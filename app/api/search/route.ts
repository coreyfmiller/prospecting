import { NextRequest, NextResponse } from "next/server"

export interface Business {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  hasWebsite: boolean
  rating?: number
  reviewCount?: number
  category?: string
  googleMapsUri?: string
  source: "google" | "perplexity" | "both"
}

export async function POST(req: NextRequest) {
  try {
    const { query, location, category } = await req.json()

    if (!query && !location) {
      return NextResponse.json(
        { error: "Please provide a search query or location" },
        { status: 400 }
      )
    }

    const searchText = category && location
      ? `${category} in ${location}`
      : query || `businesses in ${location}`

    const [googleResults, perplexityResults] = await Promise.allSettled([
      searchGooglePlaces(searchText),
      searchPerplexity(searchText),
    ])

    const google = googleResults.status === "fulfilled" ? googleResults.value : []
    const perplexity = perplexityResults.status === "fulfilled" ? perplexityResults.value : []

    const merged = mergeResults(google, perplexity)

    return NextResponse.json({
      businesses: merged,
      totalCount: merged.length,
      withWebsite: merged.filter((b) => b.hasWebsite).length,
      withoutWebsite: merged.filter((b) => !b.hasWebsite).length,
      sources: {
        google: google.length,
        perplexity: perplexity.length,
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    )
  }
}

async function searchGooglePlaces(query: string): Promise<Business[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error("Google Places API key not configured")

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 20,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    console.error("Google Places error:", err)
    throw new Error("Google Places API request failed")
  }

  const data = await response.json()
  if (!data.places) return []

  return data.places.map((place: any) => ({
    id: place.id || crypto.randomUUID(),
    name: place.displayName?.text || "Unknown",
    address: place.formattedAddress || "",
    phone: place.nationalPhoneNumber || undefined,
    website: place.websiteUri || undefined,
    hasWebsite: !!place.websiteUri,
    rating: place.rating || undefined,
    reviewCount: place.userRatingCount || undefined,
    category: place.primaryTypeDisplayName?.text || undefined,
    googleMapsUri: place.googleMapsUri || undefined,
    source: "google" as const,
  }))
}

async function searchPerplexity(query: string): Promise<Business[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a business research assistant. Return ONLY a valid JSON array of businesses. Each object must have: name (string), address (string), phone (string or null), website (string or null). No markdown, no explanation, just the JSON array.`,
          },
          {
            role: "user",
            content: `Find local businesses matching: "${query}". Focus on finding businesses that may NOT have websites or have minimal online presence. Return up to 10 results as a JSON array.`,
          },
        ],
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      console.error("Perplexity error:", await response.text())
      return []
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.map((b: any) => ({
      id: crypto.randomUUID(),
      name: b.name || "Unknown",
      address: b.address || "",
      phone: b.phone || undefined,
      website: b.website || undefined,
      hasWebsite: !!b.website,
      source: "perplexity" as const,
    }))
  } catch (error) {
    console.error("Perplexity parse error:", error)
    return []
  }
}

function mergeResults(google: Business[], perplexity: Business[]): Business[] {
  const merged = new Map<string, Business>()

  // Google results are primary
  for (const b of google) {
    const key = normalizeName(b.name)
    merged.set(key, b)
  }

  // Add perplexity results that aren't duplicates
  for (const b of perplexity) {
    const key = normalizeName(b.name)
    if (merged.has(key)) {
      // Mark as found in both sources
      const existing = merged.get(key)!
      existing.source = "both"
      // Fill in missing data from perplexity
      if (!existing.phone && b.phone) existing.phone = b.phone
      if (!existing.website && b.website) {
        existing.website = b.website
        existing.hasWebsite = true
      }
    } else {
      merged.set(key, b)
    }
  }

  return Array.from(merged.values())
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
}
