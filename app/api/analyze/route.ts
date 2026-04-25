import { NextRequest, NextResponse } from "next/server"
import { fetchWithBrightData, isBrightDataConfigured } from "@/lib/scoring/brightdata"

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
  // Rich fields from crawl worker
  title?: string
  description?: string
  wordCount?: number
  internalLinks?: number
  externalLinks?: number
  totalImages?: number
  imagesWithAlt?: number
  h1Count?: number
  h2Count?: number
  hasCanonical?: boolean
  hasOgTags?: boolean
  hasTwitterCard?: boolean
  responseTimeMs?: number
  socialLinksCount?: number
  aiAssessment?: {
    needsRefresh: boolean
    score: number
    reasons: string[]
    recommendation: string
    designQuality: string
    contentQuality: string
    seoReadiness: string
    conversionPotential: string
    topStrengths: string[]
    topWeaknesses: string[]
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
  let hasSSL = url.startsWith("https")

  let html = ""
  let headers: Headers | null = null
  let crawlData: any = null

  // Try Playwright crawl worker first for rich data
  const crawlWorkerUrl = process.env.CRAWL_WORKER_URL
  const crawlWorkerSecret = process.env.CRAWL_WORKER_SECRET
  if (crawlWorkerUrl && crawlWorkerSecret) {
    try {
      const crawlRes = await fetch(`${crawlWorkerUrl}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${crawlWorkerSecret}` },
        body: JSON.stringify({ url, lightweight: true }),
        signal: AbortSignal.timeout(25000),
      })
      if (crawlRes.ok) {
        crawlData = await crawlRes.json()
        html = crawlData.thinnedText || crawlData.summarizedContent || ""
        hasSSL = crawlData.technical?.isHttps ?? hasSSL
        // If crawl worker returned empty content, mark as limited
        const gotRealContent = (crawlData.structuralData?.wordCount || 0) > 50
        if (!gotRealContent) {
          crawlData = null // fall through to basic fetch
          console.log("Crawl worker returned thin content, falling back to fetch")
        }
      }
    } catch (e) {
      console.error("Crawl worker failed, falling back to fetch:", e)
    }
  }

  // Fallback to basic fetch if crawl worker didn't work
  if (!crawlData) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
        redirect: "follow",
      })
      clearTimeout(timeout)
      headers = response.headers
      html = await response.text()
      if (response.url.startsWith("https")) hasSSL = true
      else if (response.url.startsWith("http:")) hasSSL = false

      const isBotProtected = html.includes("Just a moment") || html.includes("challenge-platform") || (html.includes("Cloudflare") && html.length < 10000)
      if (isBotProtected) {
        console.log(`[Analyze] Bot protection detected for ${url}. Attempting bypass...`);
        
        // 1. Try Bright Data first (Premium solution)
        if (isBrightDataConfigured()) {
          try {
            const bypassHtml = await fetchWithBrightData(url);
            if (bypassHtml && bypassHtml.length > 1000) {
              html = bypassHtml;
              flags.push("Analyzed via Bright Data (bypass successful)");
              console.log(`[Analyze] Bright Data bypass successful for ${url}`);
              // If we got clean HTML, we don't need Google Cache
            }
          } catch (e: any) {
            console.error(`[Analyze] Bright Data bypass failed:`, e.message);
          }
        }

        // 2. Fallback to Google Cache only if Bright Data failed or isn't configured
        if (html.includes("Just a moment") || html.includes("challenge-platform")) {
          try {
            const cacheRes = await fetch(`https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`, {
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
              signal: AbortSignal.timeout(8000),
            })
            if (cacheRes.ok) {
              const cacheHtml = await cacheRes.text()
              if (!cacheHtml.includes("Just a moment") && cacheHtml.length > 5000) {
                html = cacheHtml
                flags.push("Analyzed from Google cache (site has bot protection)")
              }
            }
          } catch {}
        }
        
        // 3. Final check — if still blocked, return failure
        if (html.includes("Just a moment") || html.includes("challenge-platform")) {
          return { 
            isYellowPages: false, 
            hasSSL, 
            technologies, 
            flags: ["Bot protection detected"], 
            summary: "This site has bot protection that prevents automated analysis.", 
            emails: [],
            isMobileFriendly: true
          }
        }
      }

    } catch (err: any) {
      flags.push(err.name === "AbortError" ? "Site took too long to respond" : "Could not reach site")
      return { 
        isYellowPages: false, 
        hasSSL, 
        technologies, 
        flags, 
        summary: "Could not reach this website to analyze it.", 
        emails: [],
        isMobileFriendly: true
      }
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
    platform, estimatedAge, hasSSL, flags, crawlData,
  })

  // Build summary
  const summary = buildSummary({
    platform,
    estimatedAge,
    copyrightYear,
    isYellowPages,
    hasSSL,
    flags,
    technologies,
  })

  return {
    estimatedAge,
    copyrightYear,
    platform: crawlData?.platformDetection?.platform || platform,
    isYellowPages,
    isMobileFriendly: true,
    hasSSL,
    technologies,
    flags,
    summary,
    emails,
    title: crawlData?.title,
    description: crawlData?.description,
    wordCount: crawlData?.structuralData?.wordCount,
    internalLinks: crawlData?.structuralData?.links?.internal,
    externalLinks: crawlData?.structuralData?.links?.external,
    totalImages: crawlData?.structuralData?.media?.totalImages,
    imagesWithAlt: crawlData?.structuralData?.media?.imagesWithAlt,
    h1Count: crawlData?.structuralData?.semanticTags?.h1Count,
    h2Count: crawlData?.structuralData?.semanticTags?.h2Count,
    hasCanonical: crawlData?.metaChecks?.hasCanonical,
    hasOgTags: crawlData?.metaChecks?.hasOgTitle && crawlData?.metaChecks?.hasOgDescription,
    hasTwitterCard: crawlData?.metaChecks?.hasTwitterCard,
    responseTimeMs: crawlData?.technical?.responseTimeMs,
    socialLinksCount: crawlData?.structuralData?.links?.socialLinksCount,
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

  if (data.flags.length > 0) {
    const issueFlags = data.flags.filter(
      (f) => !f.includes("SSL")
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
  context: { platform?: string; estimatedAge?: string; hasSSL: boolean; flags: string[]; crawlData?: any }
): Promise<SiteAnalysis["aiAssessment"]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return undefined

  const trimmedHtml = html.slice(0, 12000)
  const hasLimitedData = !context.crawlData || trimmedHtml.length < 500

  // Build richer context from crawl data
  const crawlContext = context.crawlData ? `
- Page title: ${context.crawlData.title || "None"}
- Meta description: ${context.crawlData.description || "None"}
- Word count: ${context.crawlData.structuralData?.wordCount || "Unknown"}
- H1 tags: ${context.crawlData.structuralData?.semanticTags?.h1Count || 0}
- H2 tags: ${context.crawlData.structuralData?.semanticTags?.h2Count || 0}
- Internal links: ${context.crawlData.structuralData?.links?.internal || 0}
- External links: ${context.crawlData.structuralData?.links?.external || 0}
- Images: ${context.crawlData.structuralData?.media?.totalImages || 0} (${context.crawlData.structuralData?.media?.imagesWithAlt || 0} with alt text)
- Has canonical: ${context.crawlData.metaChecks?.hasCanonical || false}
- Has OG tags: ${context.crawlData.metaChecks?.hasOgTitle || false}
- Has Twitter card: ${context.crawlData.metaChecks?.hasTwitterCard || false}
- Response time: ${context.crawlData.technical?.responseTimeMs || "Unknown"}ms
- Social links: ${context.crawlData.structuralData?.links?.socialLinksCount || 0}` : `
NOTE: The full page content could not be retrieved (bot protection, JavaScript-heavy site, or crawl failure). The HTML below may be incomplete or a shell. DO NOT make harsh judgments based on missing data — only assess what you can actually see. If the data is too thin to evaluate, say so honestly and give a moderate score (5-6) rather than a low one.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a senior web design and digital marketing consultant evaluating a local business website. Give a thorough, actionable assessment that a web agency could use to pitch their services.

IMPORTANT: Only make claims you can support from the actual content provided. If the HTML content is thin, empty, or appears to be a bot-protection page, acknowledge that the analysis is limited. Do NOT claim a site is "missing content" if you simply couldn't access the full page. Many modern sites render via JavaScript and may appear empty in raw HTML.

Here is the website content (trimmed):
${trimmedHtml}

Technical context:
- Platform: ${context.platform || "Unknown"}
- Estimated age: ${context.estimatedAge || "Unknown"}
- Has SSL: ${context.hasSSL}
- Technical issues: ${context.flags.join(", ") || "None"}
- Data quality: ${hasLimitedData ? "LIMITED — crawl may have failed, be conservative in scoring" : "Good — full page content available"}${crawlContext}

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "needsRefresh": true/false,
  "score": 1-10 (1=desperately needs work, 10=excellent),
  "reasons": ["specific reason 1", "specific reason 2", "specific reason 3", "specific reason 4", "specific reason 5"],
  "recommendation": "One compelling sentence a salesperson could use when pitching to this business owner",
  "designQuality": "One sentence about the visual design quality and first impression",
  "contentQuality": "One sentence about the content — is it thin, outdated, well-written, missing key info?",
  "seoReadiness": "One sentence about how SEO-ready the site is — meta tags, headings, content structure",
  "conversionPotential": "One sentence about calls-to-action, contact forms, phone numbers — can visitors convert?",
  "topStrengths": ["strength 1", "strength 2"],
  "topWeaknesses": ["weakness 1", "weakness 2", "weakness 3"]
}`,
            }],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!response.ok) return undefined

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join("\n")
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return undefined

    const parsed = JSON.parse(jsonMatch[0])
    return {
      needsRefresh: !!parsed.needsRefresh,
      score: Math.min(10, Math.max(1, parseInt(parsed.score) || 5)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 7) : [],
      recommendation: parsed.recommendation || "",
      designQuality: parsed.designQuality || "",
      contentQuality: parsed.contentQuality || "",
      seoReadiness: parsed.seoReadiness || "",
      conversionPotential: parsed.conversionPotential || "",
      topStrengths: Array.isArray(parsed.topStrengths) ? parsed.topStrengths.slice(0, 3) : [],
      topWeaknesses: Array.isArray(parsed.topWeaknesses) ? parsed.topWeaknesses.slice(0, 5) : [],
    }
  } catch (e) {
    console.error("Gemini assessment error:", e)
    return undefined
  }
}
