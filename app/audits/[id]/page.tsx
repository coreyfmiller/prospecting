"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Globe, XCircle, Facebook, MapPin, Phone, ExternalLink, Star,
  TrendingUp, Loader2, ArrowLeft, Download, Map,
} from "lucide-react"
import { getAudit, updateAuditResult, type Audit, type AuditResult } from "@/lib/storage"
import type { DuellyScanResult } from "@/app/api/duelly-scan/route"
import Link from "next/link"

export default function AuditDetailPage() {
  const params = useParams()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [scanning, setScanning] = useState<string | null>(null)
  const [batchScanning, setBatchScanning] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })
  const [sortBy, setSortBy] = useState<"position" | "seo" | "geo" | "da">("position")

  useEffect(() => {
    const a = getAudit(params.id as string)
    setAudit(a)
  }, [params.id])

  const handleScanOne = async (result: AuditResult) => {
    if (!result.website) return
    setScanning(result.businessId)
    try {
      const res = await fetch("/api/duelly-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.website }),
      })
      if (res.ok) {
        const data: DuellyScanResult = await res.json()
        updateAuditResult(audit!.id, result.businessId, data)
        setAudit(getAudit(audit!.id))
      }
    } catch {}
    setScanning(null)
  }

  const handleBatchScan = async (count: number) => {
    if (!audit) return
    const toScan = audit.results
      .filter((r) => r.hasWebsite && r.website && !r.duellyScan)
      .slice(0, count)
    if (toScan.length === 0) return
    setBatchScanning(true)
    setBatchProgress({ done: 0, total: toScan.length })

    for (let i = 0; i < toScan.length; i++) {
      try {
        const res = await fetch("/api/duelly-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: toScan[i].website }),
        })
        if (res.ok) {
          const data: DuellyScanResult = await res.json()
          updateAuditResult(audit.id, toScan[i].businessId, data)
        }
      } catch {}
      setBatchProgress({ done: i + 1, total: toScan.length })
    }

    setAudit(getAudit(audit.id))
    setBatchScanning(false)
  }

  const handleExport = () => {
    if (!audit) return
    const headers = ["Position", "Name", "Address", "Phone", "Website", "Web Presence", "Rating", "SEO Score", "GEO Score", "DA", "Critical Issues"]
    const rows = getSorted().map((r) => [
      r.position.toString(), r.name, r.address, r.phone || "", r.website || "",
      r.webPresence, r.rating?.toString() || "",
      r.duellyScan?.seoScore?.toString() || "", r.duellyScan?.geoScore?.toString() || "",
      r.duellyScan?.domainAuthority?.toString() || "",
      (r.duellyScan?.criticalIssues || []).join("; "),
    ])
    const escape = (v: string) => v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
    const csv = [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-${audit.query.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSorted = () => {
    if (!audit) return []
    const results = [...audit.results]
    if (sortBy === "position") return results.sort((a, b) => a.position - b.position)
    if (sortBy === "seo") return results.sort((a, b) => (a.duellyScan?.seoScore ?? 999) - (b.duellyScan?.seoScore ?? 999))
    if (sortBy === "geo") return results.sort((a, b) => (a.duellyScan?.geoScore ?? 999) - (b.duellyScan?.geoScore ?? 999))
    if (sortBy === "da") return results.sort((a, b) => (a.duellyScan?.domainAuthority ?? 999) - (b.duellyScan?.domainAuthority ?? 999))
    return results
  }

  if (!audit) return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Audit not found</p>
      </main>
    </div>
  )

  const sorted = getSorted()
  const scannedCount = audit.results.filter((r) => r.duellyScan).length
  const websiteCount = audit.results.filter((r) => r.hasWebsite).length
  const avgSeo = scannedCount > 0 ? Math.round(audit.results.filter((r) => r.duellyScan).reduce((sum, r) => sum + (r.duellyScan?.seoScore || 0), 0) / scannedCount) : null
  const avgGeo = scannedCount > 0 ? Math.round(audit.results.filter((r) => r.duellyScan).reduce((sum, r) => sum + (r.duellyScan?.geoScore || 0), 0) / scannedCount) : null

  const presenceIcon = (wp: string) => {
    if (wp === "website") return <Globe className="w-4 h-4 text-green-500" />
    if (wp === "facebook-only") return <Facebook className="w-4 h-4 text-blue-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href="/audits" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                <ArrowLeft className="w-3 h-3" /> Back to Audits
              </Link>
              <h1 className="text-xl font-bold text-foreground">"{audit.query}"</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {audit.results.length} results · {websiteCount} with websites · {scannedCount} scanned · {new Date(audit.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
          </div>

          {/* Summary stats if scanned */}
          {scannedCount > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card><CardContent className="p-3 text-center">
                <p className="text-lg font-bold">{scannedCount}/{websiteCount}</p>
                <p className="text-xs text-muted-foreground">Scanned</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className={`text-lg font-bold ${(avgSeo || 0) >= 60 ? "text-green-600" : (avgSeo || 0) >= 30 ? "text-amber-500" : "text-red-500"}`}>{avgSeo}</p>
                <p className="text-xs text-muted-foreground">Avg SEO</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className={`text-lg font-bold ${(avgGeo || 0) >= 60 ? "text-green-600" : (avgGeo || 0) >= 30 ? "text-amber-500" : "text-red-500"}`}>{avgGeo}</p>
                <p className="text-xs text-muted-foreground">Avg GEO</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-foreground">
                  {Math.round(audit.results.filter((r) => r.duellyScan).reduce((sum, r) => sum + (r.duellyScan?.domainAuthority || 0), 0) / scannedCount)}
                </p>
                <p className="text-xs text-muted-foreground">Avg DA</p>
              </CardContent></Card>
            </div>
          )}

          {/* Batch scan buttons */}
          <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Duelly.ai
              </span>
              <span className="text-sm text-muted-foreground">Competitive Analysis</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => handleBatchScan(5)} disabled={batchScanning} variant="outline" size="sm" className="gap-1.5 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400">
                {batchScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> {batchProgress.done}/{batchProgress.total}</> : <><TrendingUp className="w-4 h-4" /> Duelly Top 5</>}
              </Button>
              <Button onClick={() => handleBatchScan(10)} disabled={batchScanning} variant="outline" size="sm" className="gap-1.5 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" /> Duelly Top 10
              </Button>
              <Button onClick={() => handleBatchScan(999)} disabled={batchScanning} variant="outline" size="sm" className="gap-1.5 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" /> Duelly All
              </Button>
              <div className="ml-auto flex gap-1">
              {(["position", "seo", "geo", "da"] as const).map((s) => (
                <Button key={s} variant={sortBy === s ? "default" : "outline"} size="sm" onClick={() => setSortBy(s)}>
                  {s === "position" ? "#" : s.toUpperCase()}
                </Button>
              ))}
            </div>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {sorted.map((r) => (
              <Card key={r.businessId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Position */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-foreground">#{r.position}</span>
                    </div>

                    {/* Business info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {presenceIcon(r.webPresence)}
                        <h3 className="font-medium text-foreground truncate">{r.name}</h3>
                        {r.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {r.rating}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.address}</span>
                        {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone}</span>}
                        {r.website && (
                          <a href={r.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                            <ExternalLink className="w-3 h-3" /> {r.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>
                        )}
                        {r.googleMapsUri && (
                          <a href={r.googleMapsUri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                            <Map className="w-3 h-3" /> Maps
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Duelly scores or scan button */}
                    <div className="shrink-0">
                      {r.duellyScan ? (
                        <div className="flex items-center gap-3 text-center">
                          <div>
                            <p className={`text-sm font-bold ${r.duellyScan.seoScore >= 60 ? "text-green-600" : r.duellyScan.seoScore >= 30 ? "text-amber-500" : "text-red-500"}`}>
                              {r.duellyScan.seoScore}
                            </p>
                            <p className="text-xs text-muted-foreground">SEO</p>
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${r.duellyScan.geoScore >= 60 ? "text-green-600" : r.duellyScan.geoScore >= 30 ? "text-amber-500" : "text-red-500"}`}>
                              {r.duellyScan.geoScore}
                            </p>
                            <p className="text-xs text-muted-foreground">GEO</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{r.duellyScan.domainAuthority}</p>
                            <p className="text-xs text-muted-foreground">DA</p>
                          </div>
                        </div>
                      ) : r.hasWebsite ? (
                        <Button
                          onClick={() => handleScanOne(r)}
                          disabled={scanning === r.businessId}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400"
                        >
                          {scanning === r.businessId ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          Duelly
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">No site</Badge>
                      )}
                    </div>
                  </div>

                  {/* Critical issues */}
                  {r.duellyScan?.criticalIssues && r.duellyScan.criticalIssues.length > 0 && (
                    <div className="mt-2 ml-14 flex flex-wrap gap-1">
                      {r.duellyScan.criticalIssues.map((issue) => (
                        <Badge key={issue} variant="outline" className="text-xs">{issue}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
