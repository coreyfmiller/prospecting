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
    const res = await fetch("https://api.moz.com/jsonrpc", {
      method: "POST",
      headers: { "x-moz-token": MOZ_API_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "data.site.metrics.fetch",
        params: { data: { site_query: { query: domain, scope: "domain" } } },
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    const m = data.result?.site_metrics || {}
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
