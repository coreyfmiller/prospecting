"use client"

import { useState, useMemo } from "react"
import { LeadCard, type CardBusiness } from "./lead-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, ArrowUpDown } from "lucide-react"
import { saveDuellyScan as dbSaveDuellyScan, saveAnalysis as dbSaveAnalysis, saveEmails as dbSaveEmails } from "@/lib/db"

interface BusinessGridProps {
  businesses: CardBusiness[]
  onBusinessUpdate?: (id: string, updates: Partial<CardBusiness>) => void
  onProspectChange?: () => void
  onBlock?: (name: string) => void
  showScanAll?: boolean
}

export function BusinessGrid({ businesses, onBusinessUpdate, onProspectChange, onBlock, showScanAll = true }: BusinessGridProps) {
  const [scanningAll, setScanningAll] = useState(false)
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 })
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set())
  const [showScanConfirm, setShowScanConfirm] = useState(false)
  const [scanAllCount, setScanAllCount] = useState(0)
  const [noWebsiteCount, setNoWebsiteCount] = useState(0)
  const [scanSummary, setScanSummary] = useState<{ total: number; lowSeo: number; lowGeo: number; avgSeo: number; avgGeo: number; failed: number } | null>(null)
  const [sortBy, setSortBy] = useState<string>("default")

  const withWebsites = useMemo(() => businesses.filter((b) => (b.webPresence === "website" || b.hasWebsite) && b.website), [businesses])

  const handleScanAllClick = () => {
    const needsScan = withWebsites.filter((b) => {
      const scan = b.duellyScan
      if (!scan?.scannedAt) return true
      const age = Date.now() - new Date(scan.scannedAt).getTime()
      return age > 30 * 24 * 60 * 60 * 1000
    })
    const noSite = businesses.filter((b) => b.webPresence !== "website" && !b.hasWebsite)
    setScanAllCount(needsScan.length)
    setNoWebsiteCount(noSite.length)
    if (needsScan.length === 0) return
    setShowScanConfirm(true)
  }

  const handleScanAllConfirm = async () => {
    setShowScanConfirm(false)
    const toScan = withWebsites.filter((b) => {
      const scan = b.duellyScan
      if (!scan?.scannedAt) return true
      const age = Date.now() - new Date(scan.scannedAt).getTime()
      return age > 30 * 24 * 60 * 60 * 1000
    })
    if (toScan.length === 0) return

    setScanningAll(true)
    setScanProgress({ done: 0, total: toScan.length })
    setScanSummary(null)

    const BATCH_SIZE = 5
    let completed = 0
    let failed = 0
    const results: { seoScore: number; geoScore: number }[] = []

    for (let i = 0; i < toScan.length; i += BATCH_SIZE) {
      const batch = toScan.slice(i, i + BATCH_SIZE)
      const ids = new Set(batch.map((b) => b.id))
      setScanningIds((prev) => new Set([...prev, ...ids]))

      await Promise.allSettled(
        batch.map(async (b) => {
          try {
            const [scanRes, analyzeRes] = await Promise.allSettled([
              fetch("/api/duelly-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: b.website }) }),
              fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: b.website }) }),
            ])

            if (scanRes.status === "fulfilled" && scanRes.value.ok) {
              const scanData = await scanRes.value.json()
              results.push({ seoScore: scanData.seoScore, geoScore: scanData.geoScore })
              dbSaveDuellyScan(b.id, scanData)
              onBusinessUpdate?.(b.id, { duellyScan: scanData })
            } else {
              const errMsg = scanRes.status === "fulfilled" ? (await scanRes.value.json().catch(() => ({}))).error || "Scan failed" : "Network error"
              onBusinessUpdate?.(b.id, { scanError: errMsg })
              failed++
            }

            if (analyzeRes.status === "fulfilled" && analyzeRes.value.ok) {
              const analyzeData = await analyzeRes.value.json()
              dbSaveAnalysis(b.id, analyzeData)
              onBusinessUpdate?.(b.id, { analysis: analyzeData })
              if (analyzeData.emails?.length) {
                dbSaveEmails(b.id, analyzeData.emails, b.emails || [])
              }
            }
          } catch {
            failed++
            onBusinessUpdate?.(b.id, { scanError: "Unexpected error" })
          }
          completed++
          setScanProgress({ done: completed, total: toScan.length })
          setScanningIds((prev) => { const next = new Set(prev); next.delete(b.id); return next })
        })
      )
    }

    if (results.length > 0 || failed > 0) {
      const avgSeo = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.seoScore, 0) / results.length) : 0
      const avgGeo = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.geoScore, 0) / results.length) : 0
      setScanSummary({ total: results.length, lowSeo: results.filter((r) => r.seoScore < 50).length, lowGeo: results.filter((r) => r.geoScore < 50).length, avgSeo, avgGeo, failed })
    }

    setSortBy("seo-worst")
    setScanningAll(false)
    setScanningIds(new Set())
  }

  const sorted = useMemo(() => {
    const list = [...businesses]
    if (sortBy === "seo-worst") list.sort((a, b) => (a.duellyScan?.seoScore ?? 999) - (b.duellyScan?.seoScore ?? 999))
    else if (sortBy === "seo-best") list.sort((a, b) => (b.duellyScan?.seoScore ?? -1) - (a.duellyScan?.seoScore ?? -1))
    else if (sortBy === "geo-worst") list.sort((a, b) => (a.duellyScan?.geoScore ?? 999) - (b.duellyScan?.geoScore ?? 999))
    else if (sortBy === "geo-best") list.sort((a, b) => (b.duellyScan?.geoScore ?? -1) - (a.duellyScan?.geoScore ?? -1))
    return list
  }, [businesses, sortBy])

  return (
    <div className="space-y-4">
      {/* Controls */}
      {showScanAll && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline" size="sm"
            onClick={handleScanAllClick}
            disabled={scanningAll || withWebsites.length === 0}
            style={!scanningAll ? { borderColor: "#00A6BF", color: "#00A6BF" } : {}}
            className="gap-1.5"
          >
            {scanningAll ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auditing {scanProgress.done}/{scanProgress.total}</>
            ) : (
              <><TrendingUp className="w-3.5 h-3.5" /> SEO Audit All</>
            )}
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Sort results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Order</SelectItem>
              <SelectItem value="seo-worst">SEO: Worst First</SelectItem>
              <SelectItem value="seo-best">SEO: Best First</SelectItem>
              <SelectItem value="geo-worst">AI Visibility: Worst First</SelectItem>
              <SelectItem value="geo-best">AI Visibility: Best First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Scan Confirmation */}
      {showScanConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowScanConfirm(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Audit {scanAllCount} websites?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This will run SEO & AI scoring, website analysis, and email discovery on {scanAllCount} websites.
            </p>
            {noWebsiteCount > 0 && (
              <p className="text-sm text-muted-foreground mb-1">
                {noWebsiteCount} businesses don't have websites and can't be scanned.
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-4">
              This will use <span className="font-medium text-foreground">{scanAllCount} credits</span>. Sites scanned in the last 30 days will be skipped.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowScanConfirm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleScanAllConfirm} style={{ backgroundColor: "#00A6BF" }}>Audit {scanAllCount} Sites</Button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Summary */}
      {scanSummary && (
        <div className="p-4 rounded-lg border" style={{ backgroundColor: "rgba(0,166,191,0.05)", borderColor: "rgba(0,166,191,0.2)" }}>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><span className="font-medium text-foreground">{scanSummary.total}</span> sites scanned</span>
            {scanSummary.failed > 0 && <span><span className="font-medium" style={{ color: "#E05D5D" }}>{scanSummary.failed}</span> failed — credits refunded</span>}
            <span><span className="font-medium" style={{ color: "#E05D5D" }}>{scanSummary.lowSeo}</span> below 50 SEO</span>
            <span><span className="font-medium" style={{ color: "#E05D5D" }}>{scanSummary.lowGeo}</span> below 50 AI Visibility</span>
            <span>Avg SEO: <span className="font-medium text-foreground">{scanSummary.avgSeo}</span></span>
            <span>Avg AI Visibility: <span className="font-medium text-foreground">{scanSummary.avgGeo}</span></span>
          </div>
        </div>
      )}

      {/* Business Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((business) => (
          <LeadCard
            key={business.id}
            business={business}
            onProspectChange={onProspectChange}
            onBlock={onBlock}
            scanningExternal={scanningIds.has(business.id)}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No businesses to display</p>
      )}
    </div>
  )
}
