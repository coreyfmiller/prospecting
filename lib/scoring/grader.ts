// Simplified SEO/GEO grader based on the scoring logic
import type { CrawlResult } from "./crawler"

export interface ScoreResult {
  seoScore: number
  geoScore: number
  criticalIssues: string[]
}

export function gradeWebsite(data: CrawlResult): ScoreResult {
  let seo = 100
  let geo = 100
  const issues: string[] = []

  // --- SEO SCORING ---

  // Title (15 points)
  if (data.titleLength === 0) { seo -= 15; issues.push("Missing page title") }
  else if (data.titleLength < 30) { seo -= 8; issues.push("Page title too short") }
  else if (data.titleLength > 60) { seo -= 5 }

  // Meta description (12 points)
  if (data.descriptionLength === 0) { seo -= 12; issues.push("No meta description") }
  else if (data.descriptionLength < 50 || data.descriptionLength > 160) { seo -= 6 }

  // H1 tag (10 points)
  if (data.h1Count === 0) { seo -= 10; issues.push("Missing H1 heading") }
  else if (data.h1Count > 1) { seo -= 4 }

  // Content (10 points)
  if (data.wordCount < 100) { seo -= 10; issues.push("Very thin content") }
  else if (data.wordCount < 300) { seo -= 6; issues.push("Thin content - under 300 words") }

  // SSL (10 points)
  if (!data.hasSSL) { seo -= 10; issues.push("Site not using HTTPS - major security and SEO issue") }

  // Mobile viewport (10 points)
  if (!data.hasViewport) { seo -= 10; issues.push("Missing viewport meta tag - not mobile optimized") }

  // Internal links (8 points)
  if (data.internalLinks === 0) { seo -= 8; issues.push("No internal links found") }
  else if (data.internalLinks < 3) { seo -= 4 }

  // External links (5 points)
  if (data.wordCount >= 500 && data.externalLinks === 0) { seo -= 5 }

  // Image alt text (8 points)
  if (data.totalImages > 0) {
    const altRatio = data.imagesWithAlt / data.totalImages
    if (altRatio < 0.5) { seo -= 8; issues.push("Most images missing alt text") }
    else if (altRatio < 1) { seo -= 4 }
  }

  // Semantic structure (5 points)
  if (data.wordCount >= 300 && !data.hasMainTag) { seo -= 5 }

  // Schema markup (7 points)
  if (data.schemas.length === 0) { seo -= 7 }

  // --- GEO SCORING ---

  // Image alt coverage for AI (15 points)
  if (data.totalImages > 0) {
    const blindspotRatio = (data.totalImages - data.imagesWithAlt) / data.totalImages
    if (blindspotRatio > 0.5) { geo -= 15 }
    else if (blindspotRatio > 0.2) { geo -= 8 }
  }

  // Social proof links (10 points)
  if (data.socialLinks === 0) { geo -= 10 }
  else if (data.socialLinks < 2) { geo -= 5 }

  // Schema for AI understanding (15 points)
  if (data.schemas.length === 0) { geo -= 15 }
  else if (data.schemas.length < 2) { geo -= 7 }

  // Content depth for AI extraction (15 points)
  if (data.wordCount < 100) { geo -= 15 }
  else if (data.wordCount < 300) { geo -= 10 }
  else if (data.wordCount < 500) { geo -= 5 }

  // Structured headings (10 points)
  if (data.h1Count === 0) { geo -= 10 }

  // Meta description for AI snippets (10 points)
  if (data.descriptionLength === 0) { geo -= 10 }
  else if (data.descriptionLength < 80) { geo -= 5 }

  // SSL trust signal (8 points)
  if (!data.hasSSL) { geo -= 8 }

  // External references (7 points)
  if (data.externalLinks === 0) { geo -= 7 }

  // Content readability proxy — very short sentences suggest thin content (10 points)
  if (data.wordCount > 0 && data.wordCount < 200) { geo -= 10 }

  // Insufficient content for AI evaluation
  if (data.wordCount < 50) {
    issues.push("Insufficient content to evaluate readability")
  }

  return {
    seoScore: Math.max(0, Math.min(100, seo)),
    geoScore: Math.max(0, Math.min(100, geo)),
    criticalIssues: issues,
  }
}
