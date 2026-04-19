"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { LeadCard } from "@/components/dashboard/lead-card"
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
  Trash2,
  Database,
  ScanSearch,
  Star,
  Loader2,
} from "lucide-react"
import {
  getSavedBusinesses,
  getStats,
  clearProjectData,
  exportToCSV,
  type SavedBusiness,
} from "@/lib/storage"

type FilterType = "all" | "website" | "facebook-only" | "no-presence" | "analyzed" | "yellow-pages" | "prospects"

export default function DatabasePage() {
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stats, setStats] = useState(getStats())
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState({ done: 0, total: 0 })

  const handleAnalyzeAll = async () => {
    const toAnalyze = filtered.filter((b) => b.webPresence === "website" && b.website && !b.analysis)
    if (toAnalyze.length === 0) return
    setAnalyzingAll(true)
    setAnalyzeProgress({ done: 0, total: toAnalyze.length })
    const { saveAnalysis } = await import("@/lib/storage")
    for (let i = 0; i < toAnalyze.length; i++) {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: toAnalyze[i].website }),
        })
        if (res.ok) {
          const data = await res.json()
          saveAnalysis(toAnalyze[i].id, data)
          setBusinesses((prev) =>
            prev.map((b) =>
              b.id === toAnalyze[i].id ? { ...b, analysis: data } : b
            )
          )
        }
      } catch {}
      setAnalyzeProgress({ done: i + 1, total: toAnalyze.length })
    }
    setAnalyzingAll(false)
  }

  useEffect(() => {
    const data = getSavedBusinesses()
    setBusinesses(data)
    setStats(getStats())
  }, [])

  const refreshData = () => {
    const data = getSavedBusinesses()
    setBusinesses(data)
    setStats(getStats())
  }

  const categories = useMemo(() => {
    const cats = new Set(businesses.map((b) => b.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [businesses])

  const filtered = useMemo(() => {
    let result = businesses.filter((b) => {
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
      if (filter === "website") return b.webPresence === "website"
      if (filter === "facebook-only")
        return b.webPresence === "facebook-only" || b.webPresence === "social-only"
      if (filter === "no-presence") return b.webPresence === "none"
      if (filter === "analyzed") return !!b.analysis
      if (filter === "yellow-pages") return !!b.analysis?.isYellowPages
      if (filter === "prospects") return !!b.isProspect
      return true
    })

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "date") return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
      if (sortBy === "category") return (a.category || "zzz").localeCompare(b.category || "zzz")
      if (sortBy === "presence") {
        const order = { none: 0, "social-only": 1, "facebook-only": 2, website: 3 }
        return (order[a.webPresence] || 0) - (order[b.webPresence] || 0)
      }
      return 0
    })

    return result
  }, [businesses, filter, searchTerm, categoryFilter, sortBy])

  const handleExport = () => {
    const csv = exportToCSV(filtered)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `marketmojo-export-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    clearProjectData()
    setBusinesses([])
    setStats(getStats())
    setShowClearConfirm(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Database className="w-6 h-6" />
                All Businesses
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.total} businesses saved across all searches
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAnalyzeAll} variant="outline" size="sm" className="gap-2" disabled={analyzingAll}>
                {analyzingAll ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {analyzeProgress.done}/{analyzeProgress.total}</>
                ) : (
                  <><ScanSearch className="w-4 h-4" /> Analyze All</>
                )}
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-2" disabled={filtered.length === 0}>
                <Download className="w-4 h-4" />
                Export CSV ({filtered.length})
              </Button>
              <Button onClick={() => setShowClearConfirm(true)} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
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
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
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
                <SelectItem value="date">Newest First</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="presence">Web Presence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={filter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter("all")}
            >
              All ({stats.total})
            </Badge>
            <Badge
              variant={filter === "website" ? "default" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setFilter("website")}
            >
              <Globe className="w-3 h-3" />
              Has Website ({stats.withWebsite})
            </Badge>
            <Badge
              variant={filter === "facebook-only" ? "default" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setFilter("facebook-only")}
            >
              <Facebook className="w-3 h-3" />
              Facebook Only ({stats.facebookOnly})
            </Badge>
            <Badge
              variant={filter === "no-presence" ? "destructive" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setFilter("no-presence")}
            >
              <XCircle className="w-3 h-3" />
              No Presence ({stats.noPresence})
            </Badge>
            <Badge
              variant={filter === "analyzed" ? "default" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setFilter("analyzed")}
            >
              <ScanSearch className="w-3 h-3" />
              Analyzed ({stats.analyzed})
            </Badge>
            {stats.yellowPages > 0 && (
              <Badge
                variant={filter === "yellow-pages" ? "destructive" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => setFilter("yellow-pages")}
              >
                Yellow Pages ({stats.yellowPages})
              </Badge>
            )}
            <Badge
              variant={filter === "prospects" ? "default" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setFilter("prospects")}
            >
              <Star className="w-3 h-3" />
              Prospects ({stats.prospects})
            </Badge>
          </div>

          {/* Results */}
          {businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Database className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No businesses saved yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Run searches from the home page and results will automatically be saved here.
                Search different categories to build up your database.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {businesses.length} businesses
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((business) => (
                  <LeadCard key={business.id} business={business} onProspectChange={refreshData} />
                ))}
              </div>
              {filtered.length === 0 && businesses.length > 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No businesses match your filters
                </p>
              )}
            </>
          )}
        </div>

        {/* Clear Confirmation Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowClearConfirm(false)}>
            <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete all saved data?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete all {stats.total} saved businesses, notes, prospect tags, and search history. This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClear}>
                  Delete Everything
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
