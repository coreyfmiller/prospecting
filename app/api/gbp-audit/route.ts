import { NextRequest, NextResponse } from "next/server"

export interface GBPAudit {
  photoCount: number
  hasHours: boolean
  hasWebsite: boolean
  hasPhone: boolean
  hasDescription: boolean
  rating: number | null
  reviewCount: number
  category: string | null
  completenessScore: number
  issues: string[]
  recommendations: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { businessName, address } = await req.json()
    if (!businessName) {
      return NextResponse.json({ error: "Business name required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google API not configured" }, { status: 500 })
    }

    // Search for the specific business
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.photos,places.currentOpeningHours,places.businessStatus,places.primaryTypeDisplayName,places.editorialSummary",
        },
        body: JSON.stringify({
          textQuery: `${businessName} ${address || ""}`.trim(),
          maxResultCount: 1,
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Google Places request failed" }, { status: 500 })
    }

    const data = await response.json()
    const place = data.places?.[0]
    if (!place) {
      return NextResponse.json({ error: "Business not found on Google" }, { status: 404 })
    }

    const photoCount = place.photos?.length || 0
    const hasHours = !!(place.currentOpeningHours?.weekdayDescriptions?.length)
    const hasWebsite = !!place.websiteUri
    const hasPhone = !!place.nationalPhoneNumber
    const hasDescription = !!place.editorialSummary?.text
    const rating = place.rating || null
    const reviewCount = place.userRatingCount || 0
    const category = place.primaryTypeDisplayName?.text || null

    // Calculate completeness
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 0
    const maxScore = 100

    // Photos (25 points)
    if (photoCount === 0) {
      issues.push("No photos on Google Business Profile")
      recommendations.push("Add at least 10 high-quality photos of your business, team, and work")
    } else if (photoCount < 5) {
      issues.push(`Only ${photoCount} photo(s) — competitors average 10+`)
      recommendations.push("Add more photos to stand out in search results")
      score += 10
    } else if (photoCount < 10) {
      score += 18
    } else {
      score += 25
    }

    // Hours (15 points)
    if (!hasHours) {
      issues.push("No business hours listed")
      recommendations.push("Add your operating hours so customers know when you're open")
    } else {
      score += 15
    }

    // Website (15 points)
    if (!hasWebsite) {
      issues.push("No website linked to Google profile")
      recommendations.push("Add your website URL to drive traffic from Google")
    } else {
      score += 15
    }

    // Phone (10 points)
    if (!hasPhone) {
      issues.push("No phone number listed")
      recommendations.push("Add a phone number so customers can contact you directly")
    } else {
      score += 10
    }

    // Description (10 points)
    if (!hasDescription) {
      issues.push("No business description")
      recommendations.push("Write a compelling business description with your key services and location")
    } else {
      score += 10
    }

    // Reviews (15 points)
    if (reviewCount === 0) {
      issues.push("No Google reviews")
      recommendations.push("Ask satisfied customers to leave Google reviews")
    } else if (reviewCount < 5) {
      issues.push(`Only ${reviewCount} review(s) — aim for 20+`)
      recommendations.push("Actively request reviews from happy customers")
      score += 5
    } else if (reviewCount < 20) {
      score += 10
    } else {
      score += 15
    }

    // Rating (10 points)
    if (rating && rating >= 4.5) {
      score += 10
    } else if (rating && rating >= 4.0) {
      score += 7
    } else if (rating && rating >= 3.0) {
      issues.push(`Rating is ${rating}/5 — below the 4.0 threshold customers trust`)
      recommendations.push("Focus on service quality and respond to negative reviews")
      score += 3
    } else if (rating) {
      issues.push(`Low rating of ${rating}/5`)
      recommendations.push("Address customer complaints and improve service quality")
    }

    if (issues.length === 0) {
      recommendations.push("Your Google Business Profile looks great! Keep it updated with fresh photos and respond to reviews.")
    }

    return NextResponse.json({
      photoCount,
      hasHours,
      hasWebsite,
      hasPhone,
      hasDescription,
      rating,
      reviewCount,
      category,
      completenessScore: Math.min(score, maxScore),
      issues,
      recommendations,
    } as GBPAudit)
  } catch (error) {
    console.error("GBP audit error:", error)
    return NextResponse.json({ error: "GBP audit failed" }, { status: 500 })
  }
}
