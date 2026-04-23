"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { BusinessGrid } from "@/components/dashboard/business-grid"
import type { CardBusiness } from "@/components/dashboard/lead-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import { getAudit, getBusinesses, type DbAudit } from "@/lib/db"
import Link from "next/link"
import { useCustomTags } from "@/hooks/use-custom-tags"

export default function AuditDetailPage() {
  const params = useParams()
  const [audit, setAudit] = useState<DbAudit | null>(null)
  const [businesses, setBusinesses] = useState<CardBusiness[]>([])
  const { customServiceTags, customPipelineStages } = useCustomTags()
  const loadData = async () => {
    const a = await getAudit(params.id as string)
    setAudit(a)
    if (a) {
      const allBiz = await getBusinesses()
      const matched = a.results.map((r: any) => {
        const saved = allBiz.find((b) => b.name === r.name && b.address === r.address)
        if (saved) return {
          id: saved.id, name: saved.name, address: saved.address, phone: saved.phone,
          website: saved.website, facebook: saved.facebook, hasWebsite: saved.has_website,
          webPresence: saved.web_presence, rating: saved.rating, reviewCount: saved.review_count,
          category: saved.category, googleMapsUri: saved.google_maps_uri, source: saved.source,
          status: saved.status, analysis: saved.analysis, duellyScan: saved.duelly_scan,
          gbpAudit: saved.gbp_audit, notes: saved.notes, pipelineStage: saved.pipeline_stage,
          serviceTags: saved.service_tags, emails: saved.emails,
        } as CardBusiness
        return {
          id: r.businessId || r.name, name: r.name, address: r.address, phone: r.phone,
          website: r.website, hasWebsite: r.hasWebsite, webPresence: r.webPresence,
          rating: r.rating, reviewCount: r.reviewCount, category: r.category,
          googleMapsUri: r.googleMapsUri, source: "google",
        } as CardBusiness
      }).filter((b: CardBusiness) => b.status !== "dismissed")
      setBusinesses(matched)
    }
  }

  useEffect(() => { loadData() }, [params.id])

  const handleBusinessUpdate = (id: string, updates: Partial<CardBusiness>) => {
    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b))
  }

  const handleExport = () => {
    if (!audit) return
    const headers = ["Name", "Address", "Phone", "Website", "Web Presence", "Rating", "Category"]
    const rows = businesses.map((b) => [
      b.name, b.address, b.phone || "", b.website || "",
      b.webPresence || "", b.rating?.toString() || "", b.category || "",
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
                {businesses.length} businesses · {businesses.filter((b) => b.webPresence === "website" || b.hasWebsite).length} with websites
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Download className="w-4 h-4" /> Export
            </Button>
          </div>

          <BusinessGrid
            businesses={businesses}
            onBusinessUpdate={handleBusinessUpdate}
            onProspectChange={loadData}
            customServiceTags={customServiceTags}
            customPipelineStages={customPipelineStages}
          />
        </div>
      </main>
    </div>
  )
}
