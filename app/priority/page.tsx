"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { BusinessGrid } from "@/components/dashboard/business-grid"
import type { CardBusiness } from "@/components/dashboard/lead-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search, Globe, XCircle, Facebook, Download, Flame, ScanSearch } from "lucide-react"
import { getBusinesses, exportToCSV, type DbBusiness } from "@/lib/db"

type FilterType = "all" | "website" | "facebook-only" | "no-presence" | "analyzed"

export default function PriorityPage() {
  const [allBusinesses, setAllBusinesses] = useState<DbBusiness[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")

  const loadData = async () => {
    setAllBusinesses((await getBusinesses()).filter((b) => b.status === "priority"))
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
    analyzed: allBusinesses.filter((b) => b.analysis).length,
  }), [allBusinesses])


  const filtered = useMemo(() => {
    let result = allBusinesses.filter((b) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (!b.name.toLowerCase().includes(term) &&
            !b.address.toLowerCase().includes(term) &&
            !b.category?.toLowerCase().includes(term) &&
            !b.phone?.includes(term) &&
            !b.notes?.toLowerCase().includes(term)) return false
      }
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false
      if (filter === "website") return b.web_presence === "website"
      if (filter === "facebook-only") return b.web_presence === "facebook-only" || b.web_presence === "social-only"
      if (filter === "no-presence") return b.web_presence === "none"
      if (filter === "analyzed") return !!b.analysis
      return true
    })
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "date") return new Date(b.saved_at || 0).getTime() - new Date(a.saved_at || 0).getTime()
      return 0
    })
    return result
  }, [allBusinesses, filter, searchTerm, categoryFilter, sortBy])

  const handleExport = () => {
    const csv = exportToCSV(filtered)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `marketmojo-priority-${new Date().toISOString().split("T")[0]}.csv`
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
                <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
                Priority
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} high-priority businesses to reach out to first
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2" disabled={filtered.length === 0}>
              <Download className="w-4 h-4" /> Export Priority ({filtered.length})
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search priority businesses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-56"><SelectValue placeholder="All categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="sm:w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="rating">Highest Rating</SelectItem>
                <SelectItem value="date">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>All ({stats.total})</Badge>
            <Badge variant={filter === "website" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("website")}><Globe className="w-3 h-3" /> Has Website ({stats.withWebsite})</Badge>
            <Badge variant={filter === "facebook-only" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("facebook-only")}><Facebook className="w-3 h-3" /> Facebook Only ({stats.facebookOnly})</Badge>
            <Badge variant={filter === "no-presence" ? "destructive" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("no-presence")}><XCircle className="w-3 h-3" /> No Presence ({stats.noPresence})</Badge>
            <Badge variant={filter === "analyzed" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("analyzed")}><ScanSearch className="w-3 h-3" /> Analyzed ({stats.analyzed})</Badge>
          </div>

          {allBusinesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Flame className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No priority businesses yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">Mark your top prospects as Priority to see them here.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Showing {filtered.length} of {allBusinesses.length} priority</p>
              <BusinessGrid
                businesses={filtered as any as CardBusiness[]}
                onBusinessUpdate={(id, updates) => {
                  setAllBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } as any : b))
                }}
                onProspectChange={loadData}
              />
              {filtered.length === 0 && allBusinesses.length > 0 && (
                <p className="text-center text-muted-foreground py-8">No priority businesses match your filters</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
