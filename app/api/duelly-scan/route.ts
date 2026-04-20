import { NextRequest, NextResponse } from "next/server"
import { crawlPage } from "@/lib/scoring/crawler"
import { gradeWebsite } from "@/lib/scoring/grader"
import { getMozMetrics } from "@/lib/scoring/moz"

export const maxDuration = 60

export interface DuellyScanResult {
  url: string
  seoScore: number
  geoScore: number
  domainAuthority: number
  criticalIssues: string[]
  scannedAt?: string
}

// Simple in-memory rate limiter
const lastScanTime = new Map<string, number>()
const COOLDOWN_MS = 30000

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Rate limit check
    const now = Date.now()
    const lastScan = lastScanTime.get(url) || 0
    if (now - lastScan < COOLDOWN_MS) {
      const waitSecs = Math.ceil((COOLDOWN_MS - (now - lastScan)) / 1000)
      return NextResponse.json({ error: `Please wait ${waitSecs}s before scanning again` }, { status: 429 })
    }
    lastScanTime.set(url, now)

    // Crawl and grade in parallel with Moz
    const [crawlResult, mozResult] = await Promise.allSettled([
      crawlPage(url),
      getMozMetrics(url),
    ])

    if (crawlResult.status === "rejected") {
      return NextResponse.json({ error: "Failed to crawl site" }, { status: 500 })
    }

    const pageData = crawlResult.value

    if (pageData.botProtected) {
      return NextResponse.json({
        error: "Bot protection detected — unable to scan this site",
      }, { status: 422 })
    }

    const scores = gradeWebsite(pageData)
    const moz = mozResult.status === "fulfilled" ? mozResult.value : null

    return NextResponse.json({
      url: pageData.url,
      seoScore: scores.seoScore,
      geoScore: scores.geoScore,
      domainAuthority: moz?.domainAuthority ?? 0,
      criticalIssues: scores.criticalIssues,
      scannedAt: new Date().toISOString(),
    } as DuellyScanResult)
  } catch (error: any) {
    console.error("Scan error:", error)
    return NextResponse.json({ error: "Scan failed" }, { status: 500 })
  }
}
