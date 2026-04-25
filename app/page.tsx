"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { BusinessGrid } from "@/components/dashboard/business-grid"
import type { CardBusiness } from "@/components/dashboard/lead-card"
import { CategoryPicker } from "@/components/dashboard/category-picker"
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
  Loader2,
  Globe,
  XCircle,
  MapPin,
  Building2,
  Facebook,
  Trash2,
  ShieldCheck,
} from "lucide-react"
import type { Business } from "@/app/api/search/route"
import { saveBusinesses as dbSaveBusinesses, ensureProject, getBusinesses, saveAudit as dbSaveAudit, getActiveProjectId } from "@/lib/db"
import { isBlocked, isBlockChainsEnabled, setBlockChainsEnabled } from "@/lib/blocklist"
import { useCustomTags } from "@/hooks/use-custom-tags"

type FilterType = "all" | "website" | "facebook-only" | "no-presence"

export default function Dashboard() {
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [radius, setRadius] = useState("15")
  const [unit, setUnit] = useState<"km" | "mi">("km")
  const [businesses, setBusinesses] = useState<CardBusiness[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")
  const [stats, setStats] = useState({ total: 0, withWebsite: 0, facebookOnly: 0, noPresence: 0 })
  const [saveInfo, setSaveInfo] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [blockChains, setBlockChains] = useState(true)
  const [blockedCount, setBlockedCount] = useState(0)
  const { customServiceTags, customPipelineStages } = useCustomTags()

  useEffect(() => {
    ensureProject().catch(console.error)
    setBlockChains(isBlockChainsEnabled())
  }, [])

  const handleToggleBlockChains = () => {
    const newVal = !blockChains
    setBlockChains(newVal)
    setBlockChainsEnabled(newVal)
  }

  const handleBlock = (name: string) => {
    setBusinesses((prev) => prev.filter((b) => b.name !== name))
  }

  const handleBusinessUpdate = (id: string, updates: Partial<CardBusiness>) => {
    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b))
  }

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
        body: JSON.stringify({ location: location.trim(), category, radius: unit === "mi" ? Math.round(parseInt(radius) * 1.60934) : parseInt(radius) }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Search failed")
      }

      const data = await res.json()
      
      const unblocked = data.businesses.filter((b: Business) => !isBlocked(b.name))
      const blocked = data.businesses.length - unblocked.length
      setBlockedCount(blocked)
      
      setBusinesses(unblocked)
      setStats({
        total: unblocked.length,
        withWebsite: unblocked.filter((b: Business) => b.webPresence === "website").length,
        facebookOnly: unblocked.filter((b: Business) => b.webPresence === "facebook-only" || b.webPresence === "social-only").length,
        noPresence: unblocked.filter((b: Business) => b.webPresence === "none").length,
      })

      const { newCount, updatedCount } = await dbSaveBusinesses(
        unblocked,
        location.trim(),
        category
      )
      setSaveInfo(`Saved ${newCount} new, updated ${updatedCount} existing${blocked > 0 ? `, ${blocked} chains filtered` : ""}`)

      const searchQuery = category && category !== "all"
        ? `${category} in ${location.trim()}`
        : `businesses in ${location.trim()}`
      try {
        const pid = getActiveProjectId()
        if (pid) {
          const auditResults = unblocked.map((b: Business) => ({
            businessId: b.id,
            name: b.name,
            address: b.address,
            phone: b.phone,
            website: b.website,
            hasWebsite: b.hasWebsite,
            webPresence: b.webPresence,
            rating: b.rating,
            reviewCount: b.reviewCount,
            category: b.category,
            googleMapsUri: b.googleMapsUri,
          }))
          await dbSaveAudit({
            project_id: pid,
            query: searchQuery,
            location: location.trim(),
            category: category || "All categories",
            results: auditResults,
          })
          setSaveInfo((prev) => (prev || "") + ` · Audit saved (${auditResults.length} businesses)`)
        }
      } catch (e) {
        console.error("Audit save failed:", e)
      }
    } catch (err: any) {
      setError(err.message)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  // Get dismissed businesses to filter them out
  const [dismissRefresh, setDismissRefresh] = useState(0)
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    getBusinesses().then((saved) => {
      const keys = new Set(
        saved.filter((b) => b.status === "dismissed").map((b) => (b.name + "|" + b.address).toLowerCase())
      )
      setDismissedKeys(keys)
    })
  }, [dismissRefresh])

  const filtered = businesses.filter((b) => {
    if (dismissedKeys.has((b.name + "|" + b.address).toLowerCase())) return false
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
        <div className="border-b border-border bg-card p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
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
                  placeholder="City, State/Province (e.g. Dallas, TX)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>

              <CategoryPicker value={category} onChange={setCategory} className="sm:w-64" />

              <div className="flex gap-2">
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={unit} onValueChange={(v) => setUnit(v as "km" | "mi")}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="mi">mi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleBlockChains}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors ${
                  blockChains
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {blockChains ? "Hiding big chains" : "Showing all businesses"}
              </button>
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
              {saveInfo && (
                <p className="text-xs text-muted-foreground">{saveInfo}</p>
              )}
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

              <BusinessGrid
                businesses={filtered}
                onBusinessUpdate={handleBusinessUpdate}
                onProspectChange={() => setDismissRefresh((n) => n + 1)}
                onBlock={handleBlock}
                customServiceTags={customServiceTags}
                customPipelineStages={customPipelineStages}
              />
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
    </div>
  )
}
