import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { businessName, address } = await req.json()
    if (!businessName) {
      return NextResponse.json({ error: "Business name required" }, { status: 400 })
    }

    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Perplexity API key not configured" }, { status: 500 })
    }

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
            content: `You are a business contact researcher. Return ONLY a JSON object with: { "emails": ["email1@example.com"], "source": "where you found it" }. If you cannot find an email, return { "emails": [], "source": "not found" }. No markdown, no explanation.`,
          },
          {
            role: "user",
            content: `Find the contact email address for this business: "${businessName}" located at "${address || "unknown location"}". Check their website, Google Business Profile, Yelp, Facebook, BBB, and any business directories.`,
          },
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Perplexity request failed" }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ emails: [], source: "Could not parse response" })
    }

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      emails: parsed.emails || [],
      source: parsed.source || "Perplexity",
    })
  } catch (error) {
    console.error("Find email error:", error)
    return NextResponse.json({ error: "Failed to find email" }, { status: 500 })
  }
}
