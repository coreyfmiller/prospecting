"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { LeadCard } from "@/components/dashboard/lead-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Loader2,
  Globe,
  XCircle,
  MapPin,
  Building2,
  Facebook,
  Trash2,
} from "lucide-react"
import type { Business } from "@/app/api/search/route"
import { saveBusinesses, ensureProject } from "@/lib/storage"

const CATEGORIES = [
  "Restaurants & Cafes",
  "Hair & Beauty Salons",
  "Contractors & Trades",
  "Plumbers",
  "Electricians",
  "HVAC",
  "Roofing",
  "Real Estate Agents",
  "Auto Services",
  "Healthcare & Medical",
  "Dentists",
  "Chiropractors",
  "Retail Stores",
  "Home Services",
  "Landscaping",
  "Fitness & Gyms",
  "Pet Services",
  "Photography",
  "Accounting & Tax",
  "Law Firms",
  "Insurance Agents",
  "Cleaning Services",
]

type FilterType = "all" | "website" | "facebook-only" | "no-presence"

export default function Dashboard() {
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")
  const [stats, setStats] = useState({ total: 0, withWebsite: 0, facebookOnly: 0, noPresence: 0 })
  const [saveInfo, setSaveInfo] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => { ensureProject() }, [])

  const handleClearResults = () => {
    setBusinesses([])
    setHasSearched(false)
    setFilter("all")
    setStats({ total: 0, withWebsite: 0, facebookOnly: 0, noPresence: 0 })
    setSaveInfo(null)
    setShowClearConfirm(false)
  }

  const handleSearch = async () => {
    if (!location.trim()) return
    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim(), category }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Search failed")
      }

      const data = await res.json()
      setBusinesses(data.businesses)
      setStats({
        total: data.totalCount,
        withWebsite: data.withWebsite,
        facebookOnly: data.facebookOnly,
        noPresence: data.noPresence,
      })

      // Auto-save to localStorage
      const { newCount, updatedCount } = saveBusinesses(
        data.businesses,
        location.trim(),
        category
      )
      setSaveInfo(`Saved ${newCount} new, updated ${updatedCount} existing`)
    } catch (err: any) {
      setError(err.message)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = businesses.filter((b) => {
    if (filter === "website") return b.webPresence === "website"
    if (filter === "facebook-only") return b.webPresence === "facebook-only" || b.webPresence === "social-only"
    if (filter === "no-presence") return b.webPresence === "none"
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 flex flex-col">
        {/* Search Section */}
        <div className="border-b border-border bg-card p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Audit Local Businesses
              </h2>
              <p className="text-sm text-muted-foreground">
                Search any area and category to find businesses with and without websites
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="City, state or zip (e.g. Dallas, TX)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="sm:w-64">
                  <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleSearch}
                disabled={loading || !location.trim()}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 p-4 sm:p-6">
          {error && (
            <div className="max-w-4xl mx-auto mb-4 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Start a local business audit
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Enter a location and optionally pick a category to find all businesses in that area.
                We'll show you which ones have websites and which don't.
              </p>
            </div>
          )}

          {hasSearched && !loading && businesses.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No businesses found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try a different location or category
              </p>
            </div>
          )}

          {businesses.length > 0 && (
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Save Info + Stats Bar */}
              {saveInfo && (
                <p className="text-xs text-muted-foreground">{saveInfo}</p>
              )}
              <div className="flex flex-wrap items-center gap-3">
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
                  No Online Presence ({stats.noPresence})
                </Badge>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 ml-auto text-destructive hover:text-destructive"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Results
                </Button>
              </div>

              {/* Clear Confirmation Dialog */}
              {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowClearConfirm(false)}>
                  <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Clear search results?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will clear the current results from view. Your saved businesses in the database won't be affected.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleClearResults}>
                        Clear Results
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((business) => (
                  <LeadCard key={business.id} business={business} />
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No businesses match this filter
                </p>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Searching Google Places & Perplexity...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
