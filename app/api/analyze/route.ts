import { NextRequest, NextResponse } from "next/server"

export interface SiteAnalysis {
  estimatedAge?: string
  copyrightYear?: number
  platform?: string
  isYellowPages: boolean
  isMobileFriendly: boolean
  hasSSL: boolean
  technologies: string[]
  flags: string[]
  summary: string
  emails: string[]
  aiAssessment?: {
    needsRefresh: boolean
    score: number
    reasons: string[]
    recommendation: string
  }
}

const PLATFORM_SIGNATURES: Record<string, RegExp[]> = {
  "Yellow Pages / Thryv": [
    /thryv/i,
    /yext/i,
    /yellowpages/i,
    /yp\.com/i,
    /hibu/i,
    /powered by yp/i,
    /dex media/i,
  ],
  WordPress: [/wp-content/i, /wp-includes/i, /wordpress/i],
  Wix: [/wix\.com/i, /wixsite\.com/i, /_wix/i, /X-Wix/i],
  Squarespace: [/squarespace/i, /sqsp/i],
  "GoDaddy Builder": [/godaddy/i, /wsimg\.com/i],
  Weebly: [/weebly/i],
  Shopify: [/shopify/i, /cdn\.shopify/i],
  Joomla: [/joomla/i, /\/media\/system/i],
  Drupal: [/drupal/i, /sites\/default\/files/i],
}

const OUTDATED_SIGNALS: Record<string, RegExp> = {
  "Flash content": /<object[^>]*flash|\.swf|embed[^>]*flash/i,
  "Old jQuery": /jquery[.-]1\.[0-9]/i,
  "Bootstrap 2/3": /bootstrap[\/.-](2|3)\./i,
  "Table-based layout": /<table[^>]*width=["']100%/i,
  "Inline styles heavy": /style="/gi,
  "No viewport meta": /VIEWPORT_CHECK/,
  "Missing doctype": /DOCTYPE_CHECK/,
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const analysis = await analyzeSite(url)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze site" },
      { status: 500 }
    )
  }
}

async function analyzeSite(url: string): Promise<SiteAnalysis> {
  const technologies: string[] = []
  const flags: string[] = []
  let platform: string | undefined
  let copyrightYear: number | undefined
  let isYellowPages = false
  let isMobileFriendly = true
  let hasSSL = url.startsWith("https")

  let html = ""
  let headers: Headers | null = null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    })

    clearTimeout(timeout)
    headers = response.headers
    html = await response.text()

    // Check final URL for SSL
    if (response.url.startsWith("https")) hasSSL = true
    else if (response.url.startsWith("http:")) hasSSL = false
  } catch (err: any) {
    if (err.name === "AbortError") {
      flags.push("Site took too long to respond")
    } else {
      flags.push("Could not reach site")
    }
    return {
      isYellowPages: false,
      isMobileFriendly: false,
      hasSSL,
      technologies,
      flags,
      summary: "Could not reach this website to analyze it.",
      emails: [],
    }
  }

  // Detect platform
  for (const [name, patterns] of Object.entries(PLATFORM_SIGNATURES)) {
    if (patterns.some((re) => re.test(html))) {
      platform = name
      technologies.push(name)
      if (name === "Yellow Pages / Thryv") isYellowPages = true
      break
    }
  }

  // Check generator meta tag
  const generatorMatch = html.match(
    /<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i
  )
  if (generatorMatch) {
    const gen = generatorMatch[1]
    technologies.push(gen)
    if (!platform) {
      if (/wordpress/i.test(gen)) platform = "WordPress"
      else if (/joomla/i.test(gen)) platform = "Joomla"
      else if (/drupal/i.test(gen)) platform = "Drupal"
      else if (/wix/i.test(gen)) platform = "Wix"
    }
    // Check for old WordPress versions
    const wpVersion = gen.match(/WordPress\s+([\d.]+)/i)
    if (wpVersion) {
      const major = parseFloat(wpVersion[1])
      if (major < 5) flags.push(`Outdated WordPress (${wpVersion[1]})`)
    }
  }

  // Check mobile friendliness
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html)
  if (!hasViewport) {
    isMobileFriendly = false
    flags.push("No mobile viewport tag")
  }

  // Check for outdated tech
  if (/<object[^>]*flash|\.swf|embed[^>]*flash/i.test(html)) {
    flags.push("Flash content detected")
  }
  if (/jquery[.-]1\.[0-9]/i.test(html)) {
    flags.push("Old jQuery version")
  }
  if (/bootstrap[\/.-](2|3)\./i.test(html)) {
    flags.push("Outdated Bootstrap")
  }
  if (/<table[^>]*width=["']100%/i.test(html)) {
    flags.push("Table-based layout")
  }
  if (!html.match(/<!DOCTYPE/i)) {
    flags.push("Missing DOCTYPE")
  }

  // Extract copyright year — look for copyright/© anywhere near a year
  const copyrightMatches = html.match(
    /(?:©|&copy;|copyright)[\s\S]{0,100}?(\d{4})/gi
  )
  // Also look for "All rights reserved" near a year
  const rightsMatches = html.match(
    /(\d{4})[\s\S]{0,50}?all\s*rights\s*reserved/gi
  )
  const allMatches = [...(copyrightMatches || []), ...(rightsMatches || [])]
  if (allMatches.length > 0) {
    const years = allMatches
      .map((m) => {
        const y = m.match(/(\d{4})/)
        return y ? parseInt(y[1]) : null
      })
      .filter((y): y is number => y !== null && y >= 2000 && y <= new Date().getFullYear())

    if (years.length > 0) {
      copyrightYear = Math.min(...years)
    }
  }

  // Check Last-Modified header
  const lastModified = headers?.get("last-modified")
  let lastModifiedYear: number | undefined
  if (lastModified) {
    const d = new Date(lastModified)
    if (!isNaN(d.getTime())) {
      lastModifiedYear = d.getFullYear()
    }
  }

  // Estimate age
  let estimatedAge: string | undefined
  const currentYear = new Date().getFullYear()
  const oldestSignal = copyrightYear || lastModifiedYear

  if (oldestSignal) {
    const age = currentYear - oldestSignal
    if (age <= 1) estimatedAge = "Less than a year old"
    else estimatedAge = `~${age} years old (est. ${oldestSignal})`
  }

  // Extract emails from HTML
  const emails = extractEmails(html)

  // AI Assessment via Gemini
  const aiAssessment = await assessWithGemini(html, {
    platform, estimatedAge, hasSSL, isMobileFriendly, flags,
  })

  // Build summary
  const summary = buildSummary({
    platform,
    estimatedAge,
    copyrightYear,
    isYellowPages,
    isMobileFriendly,
    hasSSL,
    flags,
    technologies,
  })

  return {
    estimatedAge,
    copyrightYear,
    platform,
    isYellowPages,
    isMobileFriendly,
    hasSSL,
    technologies,
    flags,
    summary,
    emails,
    aiAssessment,
  }
}

function extractEmails(html: string): string[] {
  const emailSet = new Set<string>()

  // Match mailto: links
  const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi)
  if (mailtoMatches) {
    for (const m of mailtoMatches) {
      const email = m.replace(/^mailto:/i, "").toLowerCase()
      emailSet.add(email)
    }
  }

  // Match email patterns in text
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const textMatches = html.match(emailRegex)
  if (textMatches) {
    for (const email of textMatches) {
      const lower = email.toLowerCase()
      // Filter out common false positives
      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".gif") ||
          lower.endsWith(".svg") || lower.endsWith(".css") || lower.endsWith(".js") ||
          lower.includes("example.com") || lower.includes("sentry") ||
          lower.includes("webpack") || lower.includes("@2x") ||
          lower.includes("wixpress") || lower.includes("schema.org")) continue
      emailSet.add(lower)
    }
  }

  return Array.from(emailSet).slice(0, 5) // Cap at 5 emails
}

function buildSummary(data: {
  platform?: string
  estimatedAge?: string
  copyrightYear?: number
  isYellowPages: boolean
  isMobileFriendly: boolean
  hasSSL: boolean
  flags: string[]
  technologies: string[]
}): string {
  const parts: string[] = []

  if (data.isYellowPages) {
    parts.push("This site appears to be built by Yellow Pages / Thryv.")
  } else if (data.platform) {
    parts.push(`Built on ${data.platform}.`)
  }

  if (data.estimatedAge) {
    parts.push(`Estimated ${data.estimatedAge}.`)
  }

  if (!data.hasSSL) {
    parts.push("No SSL certificate (not secure).")
  }

  if (!data.isMobileFriendly) {
    parts.push("Not mobile-friendly.")
  }

  if (data.flags.length > 0) {
    const issueFlags = data.flags.filter(
      (f) => !f.includes("mobile") && !f.includes("SSL")
    )
    if (issueFlags.length > 0) {
      parts.push(`Issues: ${issueFlags.join(", ")}.`)
    }
  }

  if (parts.length === 0) {
    parts.push("Site appears to be modern and well-maintained.")
  }

  return parts.join(" ")
}

async function assessWithGemini(
  html: string,
  context: { platform?: string; estimatedAge?: string; hasSSL: boolean; isMobileFriendly: boolean; flags: string[] }
): Promise<{ needsRefresh: boolean; score: number; reasons: string[]; recommendation: string } | undefined> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return undefined

  // Trim HTML to avoid token limits — keep first 8000 chars
  const trimmedHtml = html.slice(0, 8000)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a web design expert evaluating whether a business website needs a redesign or refresh.

Here is the HTML of the website (trimmed):
${trimmedHtml}

Additional context:
- Platform: ${context.platform || "Unknown"}
- Estimated age: ${context.estimatedAge || "Unknown"}
- Has SSL: ${context.hasSSL}
- Mobile friendly: ${context.isMobileFriendly}
- Technical issues: ${context.flags.join(", ") || "None"}

Evaluate this website and return ONLY a valid JSON object (no markdown, no backticks):
{
  "needsRefresh": true/false,
  "score": 1-10 (1=desperately needs refresh, 10=modern and well-built),
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "recommendation": "One sentence pitch-ready recommendation for the business owner"
}`,
            }],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!response.ok) return undefined

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return undefined

    const parsed = JSON.parse(jsonMatch[0])
    return {
      needsRefresh: !!parsed.needsRefresh,
      score: Math.min(10, Math.max(1, parseInt(parsed.score) || 5)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 5) : [],
      recommendation: parsed.recommendation || "",
    }
  } catch (e) {
    console.error("Gemini assessment error:", e)
    return undefined
  }
}
