import { NextRequest, NextResponse } from "next/server"
import ReactPDF from "@react-pdf/renderer"
import { AuditReport } from "@/lib/pdf/audit-report"
import React from "react"

export const maxDuration = 30

async function generateRecommendations(business: any): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return []

  const analysis = business.analysis
  const gbpAudit = business.gbpAudit
  const duellyScan = business.duellyScan
  const aiAssessment = analysis?.aiAssessment

  let context = `Business: ${business.name}\nAddress: ${business.address}\n`
  if (business.webPresence === "none") context += "NO website at all.\n"
  else if (business.webPresence === "facebook-only") context += "Only has a Facebook page, no website.\n"
  else if (business.website) context += `Website: ${business.website}\n`
  if (business.rating) context += `Google Rating: ${business.rating}/5 (${business.reviewCount || 0} reviews)\n`
  if (analysis?.platform) context += `Platform: ${analysis.platform}\n`
  if (analysis?.estimatedAge) context += `Site age: ${analysis.estimatedAge}\n`
  if (analysis && !analysis.hasSSL) context += "No SSL certificate.\n"
  if (analysis && !analysis.isMobileFriendly) context += "Not mobile friendly.\n"
  if (analysis?.flags?.length) context += `Technical issues: ${analysis.flags.join(", ")}\n`
  if (aiAssessment) context += `Website health: ${aiAssessment.score}/10. Issues: ${aiAssessment.reasons?.join(", ")}\n`
  if (gbpAudit) context += `Google Business completeness: ${gbpAudit.completenessScore}/100. Issues: ${gbpAudit.issues?.join(", ")}\n`
  if (duellyScan) context += `SEO: ${duellyScan.seoScore}/100, GEO: ${duellyScan.geoScore}/100, Domain Authority: ${duellyScan.domainAuthority}\n`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a digital marketing consultant writing recommendations for a local business audit report.

Based on this business data:
${context}

Write 5-8 specific, prioritized "Recommended Next Steps" for this business owner. Cover all relevant areas: website, Google Business Profile, SEO, content, and online presence. Each recommendation should:
- Have a bold title and 1-2 sentence explanation
- Reference their actual data and scores
- Be actionable and specific, not generic
- Sound like expert advice, not a sales pitch

Return ONLY a JSON array of objects: [{"title": "...", "description": "..."}]
No markdown, no backticks, just the JSON array.` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1000, thinkingConfig: { thinkingBudget: 0 } },
        }),
        signal: AbortSignal.timeout(15000),
      }
    )
    if (!response.ok) return []
    const data = await response.json()
    const text = (data.candidates?.[0]?.content?.parts || []).filter((p: any) => p.text).map((p: any) => p.text).join("\n")
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.business) {
      return NextResponse.json({ error: "Business data required" }, { status: 400 })
    }

    // Generate AI recommendations
    const recommendations = await generateRecommendations(data.business)
    data.recommendations = recommendations

    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(AuditReport, { data })
    )

    const chunks: Buffer[] = []
    // @ts-ignore - stream is readable
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-${data.business.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
