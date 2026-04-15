import { NextRequest, NextResponse } from "next/server"

export type WebPresence = "website" | "facebook-only" | "social-only" | "none"

export interface Business {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  facebook?: string
  hasWebsite: boolean
  webPresence: WebPresence
  rating?: number
  reviewCount?: number
  category?: string
  googleMapsUri?: string
  source: "google" | "perplexity" | "both"
}

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /facebook\.com/i,
  instagram: /instagram\.com/i,
  yelp: /yelp\.com/i,
  twitter: /twitter\.com|x\.com/i,
  tiktok: /tiktok\.com/i,
}

function isSocialUrl(url: string): boolean {
  return Object.values(SOCIAL_PATTERNS).some((re) => re.test(url))
}

function isFacebookUrl(url: string): boolean {
  return SOCIAL_PATTERNS.facebook.test(url)
}

function classifyPresence(website?: string, facebook?: string): WebPresence {
  if (website && !isSocialUrl(website)) return "website"
  if (facebook || (website && isFacebookUrl(website))) return "facebook-only"
  if (website && isSocialUrl(website)) return "social-only"
  return "none"
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

    const searchText =
      category && category !== "all" && location
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
      withWebsite: merged.filter((b) => b.webPresence === "website").length,
      facebookOnly: merged.filter((b) => b.webPresence === "facebook-only" || b.webPresence === "social-only").length,
      noPresence: merged.filter((b) => b.webPresence === "none").length,
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

  return data.places.map((place: any) => {
    const website = place.websiteUri || undefined
    const facebook = website && isFacebookUrl(website) ? website : undefined
    const actualWebsite = website && !isSocialUrl(website) ? website : undefined

    return {
      id: place.id || crypto.randomUUID(),
      name: place.displayName?.text || "Unknown",
      address: place.formattedAddress || "",
      phone: place.nationalPhoneNumber || undefined,
      website: actualWebsite,
      facebook: facebook,
      hasWebsite: !!actualWebsite,
      webPresence: classifyPresence(website, facebook),
      rating: place.rating || undefined,
      reviewCount: place.userRatingCount || undefined,
      category: place.primaryTypeDisplayName?.text || undefined,
      googleMapsUri: place.googleMapsUri || undefined,
      source: "google" as const,
    }
  })
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
            content: `You are a business research assistant. Return ONLY a valid JSON array of businesses. Each object must have: name (string), address (string), phone (string or null), website (string or null), facebook (string or null - their Facebook page URL if they have one). No markdown, no explanation, just the JSON array.`,
          },
          {
            role: "user",
            content: `Find local businesses matching: "${query}". Focus on finding businesses that may NOT have websites or only have a Facebook page. Include their Facebook page URL if available. Return up to 10 results as a JSON array.`,
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

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.map((b: any) => {
      const website = b.website && !isSocialUrl(b.website) ? b.website : undefined
      const facebook = b.facebook || (b.website && isFacebookUrl(b.website) ? b.website : undefined)

      return {
        id: crypto.randomUUID(),
        name: b.name || "Unknown",
        address: b.address || "",
        phone: b.phone || undefined,
        website,
        facebook,
        hasWebsite: !!website,
        webPresence: classifyPresence(b.website, facebook),
        source: "perplexity" as const,
      }
    })
  } catch (error) {
    console.error("Perplexity parse error:", error)
    return []
  }
}

function mergeResults(google: Business[], perplexity: Business[]): Business[] {
  const merged = new Map<string, Business>()

  for (const b of google) {
    const key = normalizeName(b.name)
    merged.set(key, b)
  }

  for (const b of perplexity) {
    const key = normalizeName(b.name)
    if (merged.has(key)) {
      const existing = merged.get(key)!
      existing.source = "both"
      if (!existing.phone && b.phone) existing.phone = b.phone
      if (!existing.facebook && b.facebook) existing.facebook = b.facebook
      if (!existing.website && b.website) {
        existing.website = b.website
        existing.hasWebsite = true
      }
      // Reclassify after merge
      existing.webPresence = classifyPresence(existing.website, existing.facebook)
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
