"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { BusinessGrid } from "@/components/dashboard/business-grid"
import type { CardBusiness } from "@/components/dashboard/lead-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Download, Search, Globe, XCircle, Facebook, ScanSearch } from "lucide-react"
import { getAudit, getBusinesses, exportToCSV, type DbAudit } from "@/lib/db"
import Link from "next/link"
import { useCustomTags } from "@/hooks/use-custom-tags"

type FilterType = "all" | "website" | "facebook-only" | "no-presence" | "analyzed"

export default function AuditDetailPage() {
  const params = useParams()
  const [audit, setAudit] = useState<DbAudit | null>(null)
  const [allBusinesses, setAllBusinesses] = useState<CardBusiness[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
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
      setAllBusinesses(matched)
    }
  }

  useEffect(() => { loadData() }, [params.id])

  const handleBusinessUpdate = (id: string, updates: Partial<CardBusiness>) => {
    setAllBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b))
  }

  const categories = useMemo(() => {
    const cats = new Set(allBusinesses.map((b) => b.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [allBusinesses])

  const stats = useMemo(() => ({
    total: allBusinesses.length,
    withWebsite: allBusinesses.filter((b) => b.webPresence === "website" || b.hasWebsite).length,
    facebookOnly: allBusinesses.filter((b) => b.webPresence === "facebook-only" || b.webPresence === "social-only").length,
    noPresence: allBusinesses.filter((b) => b.webPresence === "none").length,
    analyzed: allBusinesses.filter((b) => b.analysis).length,
  }), [allBusinesses])

  const filtered = useMemo(() => {
    let result = allBusinesses.filter((b) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          b.name.toLowerCase().includes(term) ||
          b.address.toLowerCase().includes(term) ||
          (b.category?.toLowerCase().includes(term)) ||
          (b.phone?.includes(term))
        if (!match) return false
      }
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false
      if (filter === "website") return b.webPresence === "website" || b.hasWebsite
      if (filter === "facebook-only") return b.webPresence === "facebook-only" || b.webPresence === "social-only"
      if (filter === "no-presence") return b.webPresence === "none"
      if (filter === "analyzed") return !!b.analysis
      return true
    })
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      return 0
    })
    return result
  }, [allBusinesses, filter, searchTerm, categoryFilter, sortBy])

  const handleExport = () => {
    if (!audit) return
    const headers = ["Name", "Address", "Phone", "Website", "Web Presence", "Rating", "Category"]
    const rows = filtered.map((b) => [
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/audits" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
                <ArrowLeft className="w-3 h-3" /> Back to Audits
              </Link>
              <h1 className="text-xl font-bold text-foreground">"{audit.query}"</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} businesses · {stats.withWebsite} with websites
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2" disabled={filtered.length === 0}>
              <Download className="w-4 h-4" />
              Export ({filtered.length})
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>
              All ({stats.total})
            </Badge>
            <Badge variant={filter === "website" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("website")}>
              <Globe className="w-3 h-3" /> Has Website ({stats.withWebsite})
            </Badge>
            <Badge variant={filter === "facebook-only" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("facebook-only")}>
              <Facebook className="w-3 h-3" /> Facebook Only ({stats.facebookOnly})
            </Badge>
            <Badge variant={filter === "no-presence" ? "destructive" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("no-presence")}>
              <XCircle className="w-3 h-3" /> No Presence ({stats.noPresence})
            </Badge>
            <Badge variant={filter === "analyzed" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("analyzed")}>
              <ScanSearch className="w-3 h-3" /> Analyzed ({stats.analyzed})
            </Badge>
          </div>

          {/* Results */}
          <>
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {allBusinesses.length} businesses
            </p>
            <BusinessGrid
              businesses={filtered}
              onBusinessUpdate={handleBusinessUpdate}
              onProspectChange={loadData}
              customServiceTags={customServiceTags}
              customPipelineStages={customPipelineStages}
            />
            {filtered.length === 0 && allBusinesses.length > 0 && (
              <p className="text-center text-muted-foreground py-8">
                No businesses match your filters
              </p>
            )}
          </>
        </div>
      </main>
    </div>
  )
}
