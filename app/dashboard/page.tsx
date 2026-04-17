"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Globe, XCircle, Facebook, Star, Flame, Ban, SearchCheck,
  Building2, BarChart3, Paintbrush, Bot, Search as SearchIcon, Trash2,
} from "lucide-react"
import { getSavedBusinesses, getStats, getReports, clearProjectData, SERVICE_TAGS, type SavedBusiness } from "@/lib/storage"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState<ReturnType<typeof getStats> | null>(null)
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([])
  const [recentSearches, setRecentSearches] = useState<{ query: string; date: string; count: number }[]>([])
  const [topCategories, setTopCategories] = useState<{ name: string; count: number }[]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const loadData = () => {
    const s = getStats()
    const b = getSavedBusinesses()
    const r = getReports()
    setStats(s)
    setBusinesses(b)

    const seen = new Set<string>()
    const recent = r.filter((rep) => {
      if (seen.has(rep.searchQuery)) return false
      seen.add(rep.searchQuery)
      return true
    }).slice(0, 5).map((rep) => ({
      query: rep.searchQuery,
      date: new Date(rep.date).toLocaleDateString(),
      count: rep.businessCount,
    }))
    setRecentSearches(recent)

    const catMap = new Map<string, number>()
    for (const biz of b) {
      if (biz.category) catMap.set(biz.category, (catMap.get(biz.category) || 0) + 1)
    }
    setTopCategories(
      Array.from(catMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))
    )
  }

  useEffect(() => { loadData() }, [])

  const handleClear = () => {
    clearProjectData()
    setShowClearConfirm(false)
    loadData()
  }

  if (!stats) return null

  const untouched = stats.total - stats.prospects - stats.priority - stats.dismissed
  const serviceTagCounts = businesses.reduce((acc, b) => {
    for (const tag of (b.serviceTags || [])) {
      acc[tag] = (acc[tag] || 0) + 1
    }
    if (b.needsSEO && !b.serviceTags?.includes("pitch-seo")) {
      acc["pitch-seo"] = (acc["pitch-seo"] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  // Pipeline counts
  const pipelineCounts = businesses.reduce((acc, b) => {
    if (b.pipelineStage && b.pipelineStage !== "none") {
      acc[b.pipelineStage] = (acc[b.pipelineStage] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-6 h-6" /> Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Overview of your prospecting pipeline</p>
            </div>
            <Button onClick={() => setShowClearConfirm(true)} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" /> Clear Project Data
            </Button>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/database">
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/priority">
              <Card className="hover:border-amber-400/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Flame className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-2xl font-bold">{stats.priority}</p>
                  <p className="text-xs text-muted-foreground">Priority</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/prospects">
              <Card className="hover:border-green-400/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold">{stats.prospects}</p>
                  <p className="text-xs text-muted-foreground">Prospects</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dismissed">
              <Card className="hover:border-red-400/50 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Ban className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <p className="text-2xl font-bold">{stats.dismissed}</p>
                  <p className="text-xs text-muted-foreground">Dismissed</p>
                </CardContent>
              </Card>
            </Link>
            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{untouched}</p>
                <p className="text-xs text-muted-foreground">Untouched</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <SearchIcon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{stats.analyzed}</p>
                <p className="text-xs text-muted-foreground">Analyzed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Web Presence Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Web Presence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-green-500" /> Has Website</span>
                  <Badge variant="secondary">{stats.withWebsite}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-500" /> Facebook Only</span>
                  <Badge variant="secondary">{stats.facebookOnly}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> No Presence</span>
                  <Badge variant="secondary">{stats.noPresence}</Badge>
                </div>
                {stats.yellowPages > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Yellow Pages Sites</span>
                    <Badge variant="destructive">{stats.yellowPages}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Stages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: "contacted", label: "Contacted", color: "bg-blue-500" },
                  { key: "meeting", label: "Meeting Booked", color: "bg-violet-500" },
                  { key: "proposal", label: "Proposal Sent", color: "bg-amber-500" },
                  { key: "won", label: "Won", color: "bg-green-600" },
                  { key: "lost", label: "Lost", color: "bg-red-500" },
                ].map((stage) => (
                  <div key={stage.key} className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      {stage.label}
                    </span>
                    <Badge variant="secondary">{pipelineCounts[stage.key] || 0}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Service Tags */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Service Pitches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SERVICE_TAGS.map((tag) => (
                  <div key={tag.id} className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${tag.color}`} />
                      {tag.label}
                    </span>
                    <Badge variant="secondary">{serviceTagCounts[tag.id] || 0}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Categories */}
            {topCategories.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topCategories.map((cat) => (
                    <div key={cat.name} className="flex justify-between items-center">
                      <span className="text-sm truncate">{cat.name}</span>
                      <Badge variant="outline">{cat.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentSearches.map((s, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm truncate">{s.query}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{s.count} results · {s.date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Clear all project data?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will delete all businesses, prospects, notes, audits, and search history in this project. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleClear}>Clear Everything</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
