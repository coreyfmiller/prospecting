const MOZ_API_TOKEN = process.env.MOZ_API_TOKEN || ""

export interface MozMetrics {
  domainAuthority: number
  pageAuthority: number
  linkingDomains: number
  totalBacklinks: number
  spamScore: number
}

function extractDomain(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase()
}

export function isMozConfigured(): boolean {
  return !!MOZ_API_TOKEN
}

export async function getMozMetrics(targetUrl: string): Promise<MozMetrics | null> {
  if (!isMozConfigured()) return null

  const domain = extractDomain(targetUrl)
  try {
    const res = await fetch("https://lsapi.seomoz.com/v2/url_metrics", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${MOZ_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ targets: [domain] }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const m = data.results?.[0]
    if (!m) return null
    return {
      domainAuthority: Math.round(m.domain_authority ?? 0),
      pageAuthority: Math.round(m.page_authority ?? 0),
      linkingDomains: m.root_domains_to_root_domain ?? 0,
      totalBacklinks: m.external_pages_to_root_domain ?? 0,
      spamScore: m.spam_score ?? 0,
    }
  } catch {
    return null
  }
}
