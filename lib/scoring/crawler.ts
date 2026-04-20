// Lightweight HTML crawler for scoring — no Playwright needed

export interface CrawlResult {
  url: string
  html: string
  title: string
  description: string
  titleLength: number
  descriptionLength: number
  hasSSL: boolean
  hasViewport: boolean
  h1Count: number
  wordCount: number
  internalLinks: number
  externalLinks: number
  totalImages: number
  imagesWithAlt: number
  schemas: any[]
  hasMainTag: boolean
  socialLinks: number
  botProtected: boolean
  responseTimeMs: number
}

export async function crawlPage(url: string): Promise<CrawlResult> {
  if (!url.startsWith("http")) url = `https://${url}`

  const start = Date.now()
  let html = ""
  let finalUrl = url
  let hasSSL = url.startsWith("https")

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    html = await res.text()
    finalUrl = res.url
    hasSSL = res.url.startsWith("https")
  } catch {
    return emptyResult(url, Date.now() - start)
  }

  const responseTimeMs = Date.now() - start

  // Bot protection check
  const botProtected = html.includes("Just a moment") || html.includes("challenge-platform") || (html.includes("Cloudflare") && html.length < 10000)
  if (botProtected) return { ...emptyResult(url, responseTimeMs), botProtected: true }

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch?.[1]?.trim() || ""

  // Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)
  const description = descMatch?.[1]?.trim() || ""

  // Viewport
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html)

  // H1 count
  const h1Matches = html.match(/<h1[\s>]/gi)
  const h1Count = h1Matches?.length || 0

  // Word count (rough — strip tags, count words)
  const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const wordCount = textContent.split(/\s+/).filter((w) => w.length > 1).length

  // Links
  const linkMatches = html.match(/<a[^>]+href=["']([^"']*)/gi) || []
  const domain = new URL(finalUrl).hostname
  let internalLinks = 0, externalLinks = 0
  for (const link of linkMatches) {
    const href = link.match(/href=["']([^"']*)/)?.[1] || ""
    if (href.startsWith("/") || href.includes(domain)) internalLinks++
    else if (href.startsWith("http")) externalLinks++
  }

  // Images
  const imgMatches = html.match(/<img[^>]*/gi) || []
  const totalImages = imgMatches.length
  const imagesWithAlt = imgMatches.filter((img) => /alt=["'][^"']+["']/i.test(img)).length

  // Schemas
  const schemaMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  const schemas: any[] = []
  for (const match of schemaMatches) {
    try {
      const json = match.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim()
      schemas.push(JSON.parse(json))
    } catch {}
  }

  // Semantic tags
  const hasMainTag = /<main[\s>]/i.test(html)

  // Social links
  const socialPatterns = [/facebook\.com/i, /instagram\.com/i, /twitter\.com|x\.com/i, /linkedin\.com/i, /youtube\.com/i, /tiktok\.com/i]
  const socialLinks = socialPatterns.filter((p) => p.test(html)).length

  return {
    url: finalUrl, html, title, description,
    titleLength: title.length, descriptionLength: description.length,
    hasSSL, hasViewport, h1Count, wordCount,
    internalLinks, externalLinks, totalImages, imagesWithAlt,
    schemas, hasMainTag, socialLinks, botProtected: false, responseTimeMs,
  }
}

function emptyResult(url: string, responseTimeMs: number): CrawlResult {
  return {
    url, html: "", title: "", description: "",
    titleLength: 0, descriptionLength: 0,
    hasSSL: false, hasViewport: false, h1Count: 0, wordCount: 0,
    internalLinks: 0, externalLinks: 0, totalImages: 0, imagesWithAlt: 0,
    schemas: [], hasMainTag: false, socialLinks: 0, botProtected: false, responseTimeMs,
  }
}
