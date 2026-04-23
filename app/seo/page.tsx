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
import { Search, Globe, XCircle, Facebook, Download, SearchCheck, ScanSearch, Paintbrush, Bot } from "lucide-react"
import { getBusinesses, exportToCSV, SERVICE_TAGS, type DbBusiness } from "@/lib/db"
import { useCustomTags } from "@/hooks/use-custom-tags"

type FilterType = "all" | "website" | "facebook-only" | "no-presence"

export default function ServicesPage() {
  const [allBusinesses, setAllBusinesses] = useState<DbBusiness[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [serviceFilter, setServiceFilter] = useState("all")
  const { customServiceTags, customPipelineStages } = useCustomTags()

  const loadData = async () => {
    const data = (await getBusinesses()).filter((b) =>
      b.service_tags?.length || b.needs_seo
    )
    setAllBusinesses(data)
  }
  useEffect(() => { loadData() }, [])

  const categories = useMemo(() => {
    const cats = new Set(allBusinesses.map((b) => b.category).filter(Boolean))
    return Array.from(cats).sort() as string[]
  }, [allBusinesses])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const tag of SERVICE_TAGS) {
      counts[tag.id] = allBusinesses.filter((b) =>
        b.service_tags?.includes(tag.id) || (tag.id === "pitch-seo" && b.needs_seo)
      ).length
    }
    return counts
  }, [allBusinesses])


  const filtered = useMemo(() => {
    let result = allBusinesses.filter((b) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        if (!b.name.toLowerCase().includes(term) &&
            !b.address.toLowerCase().includes(term) &&
            !b.category?.toLowerCase().includes(term) &&
            !b.notes?.toLowerCase().includes(term)) return false
      }
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false
      if (serviceFilter !== "all") {
        const tags = b.service_tags || (b.needs_seo ? ["pitch-seo"] : [])
        if (!tags.includes(serviceFilter)) return false
      }
      if (filter === "website") return b.web_presence === "website"
      if (filter === "facebook-only") return b.web_presence === "facebook-only" || b.web_presence === "social-only"
      if (filter === "no-presence") return b.web_presence === "none"
      return true
    })
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "date") return new Date(b.saved_at || 0).getTime() - new Date(a.saved_at || 0).getTime()
      return 0
    })
    return result
  }, [allBusinesses, filter, searchTerm, categoryFilter, sortBy, serviceFilter])

  const handleExport = () => {
    const csv = exportToCSV(filtered)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `marketmojo-services-${new Date().toISOString().split("T")[0]}.csv`
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
                <SearchCheck className="w-6 h-6 text-indigo-500" />
                Pitch Services
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {allBusinesses.length} businesses tagged for service pitches
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2" disabled={filtered.length === 0}>
              <Download className="w-4 h-4" /> Export ({filtered.length})
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
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
            <Badge variant={serviceFilter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setServiceFilter("all")}>
              All ({allBusinesses.length})
            </Badge>
            {SERVICE_TAGS.map((tag) => (
              <Badge
                key={tag.id}
                variant={serviceFilter === tag.id ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => setServiceFilter(tag.id)}
              >
                {tag.label} ({tagCounts[tag.id] || 0})
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter("all")}>All Presence</Badge>
            <Badge variant={filter === "website" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("website")}><Globe className="w-3 h-3" /> Has Website</Badge>
            <Badge variant={filter === "facebook-only" ? "default" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("facebook-only")}><Facebook className="w-3 h-3" /> Facebook Only</Badge>
            <Badge variant={filter === "no-presence" ? "destructive" : "outline"} className="cursor-pointer gap-1" onClick={() => setFilter("no-presence")}><XCircle className="w-3 h-3" /> No Presence</Badge>
          </div>

          {allBusinesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SearchCheck className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No businesses tagged yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">Tag businesses with Pitch Design, Pitch SEO, or Pitch AI Chatbot to see them here.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Showing {filtered.length} of {allBusinesses.length}</p>
              <BusinessGrid
                businesses={filtered as any as CardBusiness[]}
                onBusinessUpdate={(id, updates) => {
                  setAllBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } as any : b))
                }}
                onProspectChange={loadData}
                customServiceTags={customServiceTags}
                customPipelineStages={customPipelineStages}
              />
              {filtered.length === 0 && allBusinesses.length > 0 && (
                <p className="text-center text-muted-foreground py-8">No businesses match your filters</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
