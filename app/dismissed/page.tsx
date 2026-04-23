"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { BusinessGrid } from "@/components/dashboard/business-grid"
import type { CardBusiness } from "@/components/dashboard/lead-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Globe,
  XCircle,
  Facebook,
  Download,
  Ban,
} from "lucide-react"
import {
  getBusinesses,
  exportToCSV,
  type DbBusiness,
} from "@/lib/db"

type FilterType = "all" | "website" | "facebook-only" | "no-presence"

export default function DismissedPage() {
  const [allBusinesses, setAllBusinesses] = useState<DbBusiness[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const loadData = async () => {
    const data = (await getBusinesses()).filter((b) => b.status === "dismissed")
    setAllBusinesses(data)
  }

  useEffect(() => { loadData() }, [])

  const categories = useMemo(() => {
    const cats = new Set(allBusinesses.map((b) => b.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [allBusinesses])

  const stats = useMemo(() => ({
    total: allBusinesses.length,
    withWebsite: allBusinesses.filter((b) => b.web_presence === "website").length,
    facebookOnly: allBusinesses.filter((b) => b.web_presence === "facebook-only" || b.web_presence === "social-only").length,
    noPresence: allBusinesses.filter((b) => b.web_presence === "none").length,
  }), [allBusinesses])


  const filtered = useMemo(() => {
    return allBusinesses.filter((b) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          b.name.toLowerCase().includes(term) ||
          b.address.toLowerCase().includes(term) ||
          (b.category?.toLowerCase().includes(term)) ||
          (b.phone?.includes(term)) ||
          (b.notes?.toLowerCase().includes(term))
        if (!match) return false
      }
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false
      if (filter === "website") return b.web_presence === "website"
      if (filter === "facebook-only") return b.web_presence === "facebook-only" || b.web_presence === "social-only"
      if (filter === "no-presence") return b.web_presence === "none"
      return true
    })
  }, [allBusinesses, filter, searchTerm, categoryFilter])

  const handleExport = () => {
    const csv = exportToCSV(filtered)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `marketmojo-dismissed-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Ban className="w-6 h-6 text-destructive" />
                Dismissed
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} businesses you've passed on — click Dismiss again to undo
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2" disabled={filtered.length === 0}>
              <Download className="w-4 h-4" />
              Export ({filtered.length})
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search dismissed businesses..."
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
          </div>

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
          </div>

          {allBusinesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Ban className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No dismissed businesses</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Businesses you dismiss will show up here. You can undo a dismissal at any time.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {allBusinesses.length} dismissed
              </p>
              <BusinessGrid
                businesses={filtered as any as CardBusiness[]}
                onBusinessUpdate={(id, updates) => {
                  setAllBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } as any : b))
                }}
                onProspectChange={loadData}
                showScanAll={false}
              />
              {filtered.length === 0 && allBusinesses.length > 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No dismissed businesses match your filters
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
