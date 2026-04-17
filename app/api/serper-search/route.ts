import { NextRequest, NextResponse } from "next/server"

export interface SerperBusiness {
  position: number
  name: string
  address: string
  phone?: string
  website?: string
  hasWebsite: boolean
  rating?: number
  reviewCount?: number
  type?: string
  placeId?: string
}

export async function POST(req: NextRequest) {
  try {
    const { query, location } = await req.json()
    if (!query && !location) {
      return NextResponse.json({ error: "Query or location required" }, { status: 400 })
    }

    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Serper API not configured" }, { status: 500 })
    }

    const searchQuery = query || `businesses in ${location}`

    const response = await fetch("https://google.serper.dev/maps", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: searchQuery,
        location: location || undefined,
        num: 20,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Serper error:", err)
      return NextResponse.json({ error: "Serper search failed" }, { status: response.status })
    }

    const data = await response.json()
    const places = data.places || []

    const businesses: SerperBusiness[] = places.map((p: any) => ({
      position: p.position || 0,
      name: p.title || "Unknown",
      address: p.address || "",
      phone: p.phoneNumber || undefined,
      website: p.website || undefined,
      hasWebsite: !!p.website,
      rating: p.rating || undefined,
      reviewCount: p.ratingCount || undefined,
      type: p.type || undefined,
      placeId: p.placeId || undefined,
    }))

    return NextResponse.json({
      businesses,
      totalCount: businesses.length,
      query: searchQuery,
      credits: data.credits,
    })
  } catch (error) {
    console.error("Serper search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
