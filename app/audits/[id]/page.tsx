"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { LeadCard } from "@/components/dashboard/lead-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Loader2, ArrowLeft, Download } from "lucide-react"
import { getAudit, updateAuditResult, getSavedBusinesses, type Audit, type SavedBusiness } from "@/lib/storage"
import type { DuellyScanResult } from "@/app/api/duelly-scan/route"
import Link from "next/link"

export default function AuditDetailPage() {
  const params = useParams()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([])
  const [batchScanning, setBatchScanning] = useState(false)
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 })

  useEffect(() => {
    const a = getAudit(params.id as string)
    setAudit(a)
    // Load full business data from storage to get all card features
    if (a) {
      const allBiz = getSavedBusinesses()
      const matched = a.results.map((r) => {
        const saved = allBiz.find((b) => b.name === r.name && b.address === r.address)
        if (saved) return saved
        // Fallback: create a minimal business object from audit data
        return {
          id: r.businessId,
          name: r.name,
          address: r.address,
          phone: r.phone,
          website: r.website,
          hasWebsite: r.hasWebsite,
          webPresence: r.webPresence as any,
          rating: r.rating,
          reviewCount: r.reviewCount,
          category: r.category,
          googleMapsUri: r.googleMapsUri,
          source: "google" as const,
          savedAt: a.date,
          searchQuery: a.query,
        } as SavedBusiness
      })
      setBusinesses(matched)
    }
  }, [params.id])

  // Filter out dismissed businesses
  const [refreshKey, setRefreshKey] = useState(0)
  const visibleBusinesses = businesses.filter((b) => {
    if (refreshKey < 0) return true // never happens, just for dependency
    const saved = getSavedBusinesses().find((s) => s.name === b.name && s.address === b.address)
    return !saved?.isDismissed
  })

  const handleBatchScan = async (count: number) => {
    if (!audit) return
    const toScan = businesses
      .filter((b) => b.hasWebsite && b.website && !b.duellyScan)
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
          updateAuditResult(audit.id, toScan[i].id, data)
        }
      } catch {}
      setBatchProgress({ done: i + 1, total: toScan.length })
    }

    // Reload data
    const a = getAudit(audit.id)
    setAudit(a)
    const allBiz = getSavedBusinesses()
    if (a) {
      const matched = a.results.map((r) => {
        const saved = allBiz.find((b) => b.name === r.name && b.address === r.address)
        return saved || { ...r, id: r.businessId, source: "google" as const, savedAt: a.date, searchQuery: a.query } as any
      })
      setBusinesses(matched)
    }
    setBatchScanning(false)
  }

  const handleExport = () => {
    if (!audit) return
    const headers = ["Name", "Address", "Phone", "Website", "Web Presence", "Rating", "Category"]
    const rows = businesses.map((b) => [
      b.name, b.address, b.phone || "", b.website || "",
      b.webPresence, b.rating?.toString() || "", b.category || "",
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

  if (!audit) return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Audit not found</p>
      </main>
    </div>
  )

  const websiteCount = visibleBusinesses.filter((b) => b.hasWebsite).length

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href="/audits" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                <ArrowLeft className="w-3 h-3" /> Back to Audits
              </Link>
              <h1 className="text-xl font-bold text-foreground">"{audit.query}"</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {visibleBusinesses.length} businesses · {websiteCount} with websites · {new Date(audit.date).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>

          {/* Business cards - same as rest of site */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleBusinesses.map((business) => (
              <LeadCard key={business.id} business={business} onProspectChange={() => setRefreshKey((n) => n + 1)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
