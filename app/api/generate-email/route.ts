import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { business, pitchType, companyName } = await req.json()
    if (!business) {
      return NextResponse.json({ error: "Business data required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API not configured" }, { status: 500 })
    }

    const analysis = business.analysis
    const gbpAudit = business.gbpAudit
    const mojoScan = business.mojoScan
    const aiAssessment = analysis?.aiAssessment

    let context = `Business: ${business.name}\nAddress: ${business.address}\n`
    if (business.webPresence === "none") context += "They have NO website.\n"
    else if (business.webPresence === "facebook-only") context += "They only have a Facebook page, no website.\n"
    else if (business.website) context += `Website: ${business.website}\n`
    if (business.rating) context += `Google Rating: ${business.rating}/5 (${business.reviewCount || 0} reviews)\n`
    if (analysis?.platform) context += `Platform: ${analysis.platform}\n`
    if (analysis?.estimatedAge) context += `Site age: ${analysis.estimatedAge}\n`
    if (!analysis?.hasSSL) context += "No SSL certificate.\n"
    if (!analysis?.isMobileFriendly) context += "Not mobile friendly.\n"
    if (aiAssessment) context += `Website health score: ${aiAssessment.score}/10\nIssues: ${aiAssessment.reasons?.join(", ")}\n`
    if (gbpAudit) context += `Google Business completeness: ${gbpAudit.completenessScore}/100\nGBP issues: ${gbpAudit.issues?.join(", ")}\n`
    if (mojoScan) context += `SEO Score: ${mojoScan.seoScore}/100, GEO Score: ${mojoScan.geoScore}/100, Domain Authority: ${mojoScan.domainAuthority}\n`

    const pitchPrompts: Record<string, string> = {
      design: "You're pitching web design/redesign services. Focus on their outdated or missing website and how a modern site would help them get more customers.",
      seo: "You're pitching SEO services. Focus on their low SEO scores, missing meta tags, poor content, and how better SEO would increase their visibility.",
      chatbot: "You're pitching an AI chatbot for their website. Focus on how it would help them capture leads 24/7, answer customer questions, and book appointments automatically.",
      general: "You're pitching general digital marketing services. Cover their biggest gaps — whether that's their website, SEO, Google Business Profile, or online presence.",
    }

    const prompt = `You are a professional but friendly sales copywriter for a digital agency called "${companyName || "our agency"}".

Write a cold outreach email to the owner of this business:

${context}

${pitchPrompts[pitchType] || pitchPrompts.general}

Rules:
- Keep it under 150 words
- Be specific — reference their actual data and issues
- Don't be pushy or salesy
- Sound like a real person, not a template
- Include a clear call to action (meeting, call, or reply)
- Don't use subject line — just the email body
- Sign off with just a first name placeholder [Your Name]

Return ONLY the email text, nothing else.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Gemini request failed" }, { status: 500 })
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const emailText = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n").trim()

    return NextResponse.json({ email: emailText })
  } catch (error) {
    console.error("Email generation error:", error)
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 })
  }
}
