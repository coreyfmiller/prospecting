import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 180

export interface DuellyScanResult {
  url: string
  seoScore: number
  geoScore: number
  domainAuthority: number
  pageAuthority: number
  totalBacklinks: number
  linkingDomains: number
  spamScore: number
  topBacklinks: {
    sourceDomain: string
    sourceUrl: string
    anchorText: string
    domainAuthority: number
    isDofollow: boolean
  }[]
  pageSpeedMobile: number | null
  pageSpeedDesktop: number | null
  platform: string | null
  criticalIssues: string[]
  scannedAt: string
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const apiUrl = process.env.DUELLY_API_URL
    const apiKey = process.env.DUELLY_API_KEY
    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: "Duelly API not configured" }, { status: 500 })
    }

    const response = await fetch(`${apiUrl}/api/prospect-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(180000),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => "Unknown error")
      console.error("Duelly scan error:", err)
      return NextResponse.json(
        { error: `Duelly scan failed (${response.status})` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Duelly proxy error:", error)
    if (error.name === "TimeoutError") {
      return NextResponse.json({ error: "Scan timed out (3min)" }, { status: 504 })
    }
    return NextResponse.json({ error: "Duelly scan failed" }, { status: 500 })
  }
}
