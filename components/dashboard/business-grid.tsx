"use client"

import { useState, useMemo, useCallback } from "react"
import { LeadCard, type CardBusiness } from "./lead-card"
import { BusinessTable } from "./business-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, ArrowUpDown, LayoutGrid, TableProperties, Star, Flame, Ban, Mail, Zap } from "lucide-react"
import { saveDuellyScan as dbSaveDuellyScan, saveAnalysis as dbSaveAnalysis, saveEmails as dbSaveEmails, updateBusinessStatus, deductCredits, refundCredits, getCredits, type BusinessStatus } from "@/lib/db"

interface BusinessGridProps {
  businesses: CardBusiness[]
  onBusinessUpdate?: (id: string, updates: Partial<CardBusiness>) => void
  onProspectChange?: () => void
  onBlock?: (name: string) => void
  showScanAll?: boolean
  customServiceTags?: { id: string; label: string; color: string }[]
  customPipelineStages?: { id: string; label: string; color: string }[]
}

export function BusinessGrid({ businesses, onBusinessUpdate, onProspectChange, onBlock, showScanAll = true, customServiceTags, customPipelineStages }: BusinessGridProps) {
  const [scanningAll, setScanningAll] = useState(false)
  const [scanProgress, setScanProgress] = useState({ done: 0, total: 0 })
  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set())
  const [showScanConfirm, setShowScanConfirm] = useState(false)
  const [scanTarget, setScanTarget] = useState<"all" | "selected">("all")
  const [scanAllCount, setScanAllCount] = useState(0)
  const [noWebsiteCount, setNoWebsiteCount] = useState(0)
  const [scanSummary, setScanSummary] = useState<{ total: number; lowSeo: number; lowGeo: number; avgSeo: number; avgGeo: number; failed: number } | null>(null)
  const [sortBy, setSortBy] = useState<string>("default")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [insufficientCredits, setInsufficientCredits] = useState(false)

  const withWebsites = useMemo(() => businesses.filter((b) => (b.webPresence === "website" || b.hasWebsite) && b.website), [businesses])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === businesses.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(businesses.map((b) => b.id)))
  }, [businesses, selectedIds.size])

  const getScanCandidates = (ids?: Set<string>) => {
    const pool = ids ? businesses.filter((b) => ids.has(b.id)) : withWebsites
    return pool.filter((b) => {
      if (!b.website || (b.webPresence !== "website" && !b.hasWebsite)) return false
      const scan = b.duellyScan
      if (!scan?.scannedAt) return true
      return Date.now() - new Date(scan.scannedAt).getTime() > 30 * 24 * 60 * 60 * 1000
    })
  }

  const handleScanAllClick = async () => {
    const needsScan = getScanCandidates()
    const noSite = businesses.filter((b) => b.webPresence !== "website" && !b.hasWebsite)
    setScanAllCount(needsScan.length)
    setNoWebsiteCount(noSite.length)
    setScanTarget("all")
    setInsufficientCredits(false)
    if (needsScan.length === 0) return
    const balance = await getCredits()
    setCreditBalance(balance)
    if (balance < needsScan.length) setInsufficientCredits(true)
    setShowScanConfirm(true)
  }

  const handleScanSelectedClick = async () => {
    const needsScan = getScanCandidates(selectedIds)
    const noSite = Array.from(selectedIds).filter((id) => {
      const b = businesses.find((biz) => biz.id === id)
      return b && b.webPresence !== "website" && !b.hasWebsite
    })
    setScanAllCount(needsScan.length)
    setNoWebsiteCount(noSite.length)
    setScanTarget("selected")
    setInsufficientCredits(false)
    if (needsScan.length === 0) return
    const balance = await getCredits()
    setCreditBalance(balance)
    if (balance < needsScan.length) setInsufficientCredits(true)
    setShowScanConfirm(true)
  }

  const runBatchScan = async (toScan: CardBusiness[]) => {
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
          // Deduct 1 credit before scanning
          const { success } = await deductCredits(1, "scan", b.id, b.name)
          if (!success) {
            onBusinessUpdate?.(b.id, { scanError: "Insufficient credits" })
            failed++
            completed++
            setScanProgress({ done: completed, total: toScan.length })
            setScanningIds((prev) => { const next = new Set(prev); next.delete(b.id); return next })
            return
          }

          let scanSucceeded = false
          try {
            const [scanRes, analyzeRes, emailRes, gbpRes] = await Promise.allSettled([
              fetch("/api/duelly-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: b.website }) }),
              fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: b.website }) }),
              (!b.emails || b.emails.length === 0)
                ? fetch("/api/find-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: b.name, address: b.address }) })
                : Promise.resolve(null),
              fetch("/api/gbp-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: b.name, address: b.address }) }),
            ])

            // SEO & AI scan
            if (scanRes.status === "fulfilled" && scanRes.value.ok) {
              const scanData = await scanRes.value.json()
              results.push({ seoScore: scanData.seoScore, geoScore: scanData.geoScore })
              dbSaveDuellyScan(b.id, scanData)
              onBusinessUpdate?.(b.id, { duellyScan: scanData })
              scanSucceeded = true
            } else {
              const errMsg = scanRes.status === "fulfilled" ? (await scanRes.value.json().catch(() => ({}))).error || "Scan failed" : "Network error"
              onBusinessUpdate?.(b.id, { scanError: errMsg })
            }

            // Website analysis
            if (analyzeRes.status === "fulfilled" && analyzeRes.value.ok) {
              const analyzeData = await analyzeRes.value.json()
              dbSaveAnalysis(b.id, analyzeData)
              onBusinessUpdate?.(b.id, { analysis: analyzeData })
              if (analyzeData.emails?.length) dbSaveEmails(b.id, analyzeData.emails, b.emails || [])
              scanSucceeded = true
            }

            // Email discovery (free, no credit impact)
            if (emailRes.status === "fulfilled" && emailRes.value && emailRes.value.ok) {
              const emailData = await emailRes.value.json()
              if (emailData.emails?.length) {
                const merged = await dbSaveEmails(b.id, emailData.emails, b.emails || [])
                onBusinessUpdate?.(b.id, { emails: merged })
              }
            }

            // GBP audit
            if (gbpRes.status === "fulfilled" && gbpRes.value.ok) {
              const gbpData = await gbpRes.value.json()
              const { saveGBPAudit } = await import("@/lib/db")
              saveGBPAudit(b.id, gbpData)
              onBusinessUpdate?.(b.id, { gbpAudit: gbpData })
              scanSucceeded = true
            }

            // If nothing succeeded at all, refund the credit
            if (!scanSucceeded) {
              await refundCredits(1, "refund", b.id, b.name)
              failed++
            }
          } catch {
            await refundCredits(1, "refund", b.id, b.name)
            failed++
            onBusinessUpdate?.(b.id, { scanError: "Unexpected error — credit refunded" })
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

  const handleScanConfirm = async () => {
    setShowScanConfirm(false)
    const toScan = scanTarget === "selected" ? getScanCandidates(selectedIds) : getScanCandidates()
    if (toScan.length === 0) return
    await runBatchScan(toScan)
  }

  // --- Bulk status change ---
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const handleBulkStatus = async (newStatus: BusinessStatus) => {
    if (selectedIds.size === 0) return
    setBulkUpdating(true)
    const ids = Array.from(selectedIds)
    // Update DB
    await Promise.allSettled(ids.map((id) => updateBusinessStatus(id, newStatus)))
    // Update local state so cards reflect immediately
    ids.forEach((id) => onBusinessUpdate?.(id, { status: newStatus }))
    setBulkUpdating(false)
    setSelectedIds(new Set())
    onProspectChange?.()
  }

  // --- Bulk find emails ---
  const [findingEmails, setFindingEmails] = useState(false)
  const [emailProgress, setEmailProgress] = useState({ done: 0, total: 0, found: 0 })

  const handleBulkFindEmails = async () => {
    const targets = Array.from(selectedIds)
      .map((id) => businesses.find((b) => b.id === id))
      .filter((b): b is CardBusiness => !!b && (!b.emails || b.emails.length === 0))
    if (targets.length === 0) return

    setFindingEmails(true)
    setEmailProgress({ done: 0, total: targets.length, found: 0 })
    let found = 0

    for (let i = 0; i < targets.length; i++) {
      const b = targets[i]
      try {
        const res = await fetch("/api/find-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName: b.name, address: b.address }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.emails?.length) {
            const merged = await dbSaveEmails(b.id, data.emails, b.emails || [])
            onBusinessUpdate?.(b.id, { emails: merged })
            found++
          }
        }
      } catch {}
      setEmailProgress({ done: i + 1, total: targets.length, found })
    }

    setFindingEmails(false)
  }

  const sorted = useMemo(() => {
    const list = [...businesses]
    const getPresence = (b: CardBusiness) => (b.webPresence || (b as any).web_presence || "none")
    const presenceOrder: Record<string, number> = { website: 0, "facebook-only": 1, "social-only": 2, none: 3 }
    if (sortBy === "seo-worst") list.sort((a, b) => (a.duellyScan?.seoScore ?? 999) - (b.duellyScan?.seoScore ?? 999))
    else if (sortBy === "seo-best") list.sort((a, b) => (b.duellyScan?.seoScore ?? -1) - (a.duellyScan?.seoScore ?? -1))
    else if (sortBy === "geo-worst") list.sort((a, b) => (a.duellyScan?.geoScore ?? 999) - (b.duellyScan?.geoScore ?? 999))
    else if (sortBy === "geo-best") list.sort((a, b) => (b.duellyScan?.geoScore ?? -1) - (a.duellyScan?.geoScore ?? -1))
    else list.sort((a, b) => (presenceOrder[getPresence(a)] ?? 3) - (presenceOrder[getPresence(b)] ?? 3))
    return list
  }, [businesses, sortBy])

  const selectedWithWebsite = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const b = businesses.find((biz) => biz.id === id)
      return b && (b.webPresence === "website" || b.hasWebsite) && b.website
    }).length
  }, [selectedIds, businesses])

  return (
    <div className="space-y-4">
      {/* Controls */}
      {showScanAll && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleScanAllClick}
              disabled={scanningAll || withWebsites.length === 0}
              style={!scanningAll ? { borderColor: "#00A6BF", color: "#00A6BF" } : {}}
              className="gap-1.5"
            >
              {scanningAll && scanTarget === "all" ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auditing {scanProgress.done}/{scanProgress.total}</>
              ) : (
                <><TrendingUp className="w-3.5 h-3.5" /> Audit All</>
              )}
            </Button>

            {selectedIds.size > 0 && (
              <Button
                variant="outline" size="sm"
                onClick={handleScanSelectedClick}
                disabled={scanningAll || selectedWithWebsite === 0}
                style={!scanningAll ? { borderColor: "#00A6BF", color: "#00A6BF" } : {}}
                className="gap-1.5"
              >
                {scanningAll && scanTarget === "selected" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auditing {scanProgress.done}/{scanProgress.total}</>
                ) : (
                  <><TrendingUp className="w-3.5 h-3.5" /> Audit Selected ({selectedIds.size})</>
                )}
              </Button>
            )}

            {selectedIds.size > 0 && (
              <Button
                variant="outline" size="sm"
                onClick={handleBulkFindEmails}
                disabled={findingEmails}
                className="gap-1.5"
              >
                {findingEmails ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding {emailProgress.done}/{emailProgress.total} ({emailProgress.found} found)</>
                ) : (
                  <><Mail className="w-3.5 h-3.5" /> Find Emails ({selectedIds.size})</>
                )}
              </Button>
            )}

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] sm:w-[180px] h-8 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Sort results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Web Presence</SelectItem>
                <SelectItem value="seo-worst">SEO: Worst First</SelectItem>
                <SelectItem value="seo-best">SEO: Best First</SelectItem>
                <SelectItem value="geo-worst">AI Visibility: Worst</SelectItem>
                <SelectItem value="geo-best">AI Visibility: Best</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border border-border rounded-md ml-auto">
              <button onClick={() => setViewMode("cards")} className={`p-1.5 rounded-l-md transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} title="Card view">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-r-md transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`} title="Table view">
                <TableProperties className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulk status actions — separate row on mobile */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">{selectedIds.size} selected:</span>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus("prospect")} disabled={bulkUpdating} className="gap-1 text-xs h-7 px-2">
                <Star className="w-3 h-3" /> Prospect
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus("priority")} disabled={bulkUpdating} className="gap-1 text-xs h-7 px-2">
                <Flame className="w-3 h-3" /> Priority
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus("dismissed")} disabled={bulkUpdating} className="gap-1 text-xs h-7 px-2 text-destructive hover:text-destructive">
                <Ban className="w-3 h-3" /> Dismiss
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Scan Confirmation */}
      {showScanConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowScanConfirm(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Full Audit {scanAllCount} businesses?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This will run SEO & AI scan, website analysis, email discovery, and Google Business audit on {scanAllCount} businesses.
            </p>
            {noWebsiteCount > 0 && (
              <p className="text-sm text-muted-foreground mb-1">
                {noWebsiteCount} {scanTarget === "selected" ? "selected " : ""}businesses don't have websites and can't be scanned.
              </p>
            )}
            <div className="flex items-center gap-2 my-3 p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-foreground">{scanAllCount} credits</span>
                <span className="text-muted-foreground"> · Balance: {creditBalance ?? "..."} credits</span>
              </div>
            </div>
            {insufficientCredits && (
              <p className="text-sm text-destructive mb-2">
                Not enough credits. You need {scanAllCount} but only have {creditBalance}.
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              Sites scanned in the last 30 days will be skipped. Failed scans are refunded.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowScanConfirm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleScanConfirm} disabled={insufficientCredits} style={!insufficientCredits ? { backgroundColor: "#00A6BF" } : {}}>
                Audit {scanAllCount} Businesses
              </Button>
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

      {/* Content */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((business) => (
            <div key={business.id} className="relative">
              <div className="absolute top-3 right-3 z-10">
                <Checkbox
                  checked={selectedIds.has(business.id)}
                  onCheckedChange={() => toggleSelect(business.id)}
                  className="h-5 w-5 border-2 bg-background shadow-sm"
                />
              </div>
              <LeadCard
                business={business}
                onProspectChange={onProspectChange}
                onBlock={onBlock}
                scanningExternal={scanningIds.has(business.id)}
                customServiceTags={customServiceTags}
                customPipelineStages={customPipelineStages}
              />
            </div>
          ))}
        </div>
      ) : (
        <BusinessTable
          businesses={sorted}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onBusinessUpdate={onBusinessUpdate}
          onProspectChange={onProspectChange}
          scanningIds={scanningIds}
        />
      )}

      {sorted.length === 0 && viewMode === "cards" && (
        <p className="text-center text-muted-foreground py-8">No businesses to display</p>
      )}
    </div>
  )
}
