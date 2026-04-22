"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2, MapPin, Building2, Globe, XCircle, Facebook, TrendingUp } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface ScanResult {
  url: string
  seoScore: number
  geoScore: number
  domainAuthority: number
  criticalIssues: string[]
  error?: string
}

function ScoreGauge({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const hex = clamped >= 60 ? "#2ECC71" : clamped >= 30 ? "#F97316" : "#E05D5D";
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[68px] h-[68px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={radius} fill="none" strokeWidth="5" className="stroke-muted/30" />
          <circle cx="34" cy="34" r={radius} fill="none" strokeWidth="5" strokeLinecap="round"
            stroke={hex} strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold" style={{ color: hex }}>{clamped}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-tight text-center">{label}</p>
      {sublabel && <p className="text-[10px] text-muted-foreground/70 leading-none -mt-0.5">{sublabel}</p>}
    </div>
  );
}

const CATEGORIES = [
  "Restaurants & Cafes", "Hair & Beauty Salons", "Contractors & Trades",
  "Plumbers", "Electricians", "HVAC", "Roofing", "Real Estate Agents",
  "Auto Services", "Healthcare & Medical", "Dentists", "Chiropractors",
  "Retail Stores", "Home Services", "Landscaping", "Fitness & Gyms",
  "Pet Services", "Photography", "Accounting & Tax", "Law Firms",
  "Insurance Agents", "Cleaning Services",
]

export default function Version2Page() {
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [searching, setSearching] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [scanResults, setScanResults] = useState<Map<string, ScanResult>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [scanTime, setScanTime] = useState<number | null>(null)
  const [scanCost, setScanCost] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!location.trim()) return
    setSearching(true); setError(null); setScanResults(new Map()); setScanTime(null); setScanCost(null)
    try {
      const res = await fetch("/api/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: location.trim(), category, radius: 15 }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Search failed")
      const data = await res.json()
      setBusinesses(data.businesses || [])
    } catch (err: any) { setError(err.message) }
    setSearching(false)
  }

  const handleBatchScan = async () => {
    const withWebsites = businesses.filter(b => b.webPresence === "website" && b.website)
    if (withWebsites.length === 0) return
    setScanning(true); setError(null)
    const start = Date.now()
    try {
      const urls = withWebsites.map(b => b.website)
      const res = await fetch("/api/batch-scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Batch scan failed")
      const data = await res.json()
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      setScanTime(parseFloat(elapsed))
      // Estimate cost: 2 Gemini calls for the batch ≈ $0.04-0.08 total
      const estimatedCost = (urls.length * 0.005).toFixed(3) // ~$0.005 per site in batch mode
      setScanCost(estimatedCost)
      const map = new Map<string, ScanResult>()
      for (const r of (data.results || [])) { map.set(r.url, r) }
      setScanResults(map)
    } catch (err: any) { setError(err.message) }
    setScanning(false)
  }

  const withWebsites = businesses.filter(b => b.webPresence === "website" && b.website)
  const withoutWebsites = businesses.filter(b => b.webPresence !== "website")

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6" style={{ color: "#00A6BF" }} />
              Version 2 — Batch AI Scan Test
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crawl all sites, send to Gemini in ONE batch prompt (x2 averaged). Compare quality vs individual scans.
            </p>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="City, State (e.g. Dallas, TX)" value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-64">
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={searching || !location.trim()} className="gap-2">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

          {/* Results */}
          {businesses.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{businesses.length} businesses found</Badge>
                <Badge variant="outline" className="gap-1"><Globe className="w-3 h-3" /> {withWebsites.length} with websites</Badge>
                <Badge variant="outline" className="gap-1"><XCircle className="w-3 h-3" /> {withoutWebsites.length} without</Badge>

                <Button onClick={handleBatchScan} disabled={scanning || withWebsites.length === 0}
                  className="gap-2 ml-auto" style={{ backgroundColor: "#00A6BF" }}>
                  {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Batch scanning {withWebsites.length} sites...</>
                    : <><TrendingUp className="w-4 h-4" /> Batch AI Scan ({withWebsites.length} sites)</>}
                </Button>
              </div>

              {/* Scan stats */}
              {scanTime !== null && (
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">Scanned {scanResults.size} sites in <span className="font-medium text-foreground">{scanTime}s</span></span>
                  {scanCost && <span className="text-muted-foreground">Est. cost: <span className="font-medium text-foreground">${scanCost}</span></span>}
                  <span className="text-muted-foreground">vs individual: ~{withWebsites.length * 20}s / ~${(withWebsites.length * 0.05).toFixed(2)}</span>
                </div>
              )}

              {/* Business cards with scan results */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {businesses.filter(b => b.webPresence === "website" && b.website).map(b => {
                  const scan = scanResults.get(b.website?.startsWith('http') ? b.website : `https://${b.website}`)
                  return (
                    <Card key={b.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground truncate">{b.name}</h3>
                          <p className="text-xs text-muted-foreground">{b.category}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.website}</p>
                        </div>

                        {scan && !scan.error ? (
                          <div className="space-y-3 p-3 rounded-lg border" style={{ backgroundColor: "rgba(0,166,191,0.05)", borderColor: "rgba(0,166,191,0.2)" }}>
                            <div className="grid grid-cols-3 gap-2">
                              <ScoreGauge value={scan.seoScore} label="SEO" />
                              <ScoreGauge value={scan.geoScore} label="AI Visibility" sublabel="(GEO)" />
                              <ScoreGauge value={scan.domainAuthority} label="DA" />
                            </div>
                            {scan.criticalIssues.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Issues: </span>
                                {scan.criticalIssues.slice(0, 3).join(", ")}
                                {scan.criticalIssues.length > 3 && ` +${scan.criticalIssues.length - 3} more`}
                              </div>
                            )}
                            <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground/50">
                              Powered by <img src="/duelly.png" alt="Duelly" className="h-3 inline-block" />
                            </p>
                          </div>
                        ) : scan?.error ? (
                          <p className="text-xs text-destructive">{scan.error}</p>
                        ) : scanning ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" /> Waiting for batch results...
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}

          {!businesses.length && !searching && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Search to test batch scanning</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Search an area, then hit "Batch AI Scan" to crawl all sites and analyze them in a single Gemini call.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
