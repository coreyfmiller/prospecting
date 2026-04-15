import type { Business } from "@/app/api/search/route"
import type { SiteAnalysis } from "@/app/api/analyze/route"

export interface SavedBusiness extends Business {
  savedAt: string
  searchQuery: string
  analysis?: SiteAnalysis
  isProspect?: boolean
  isDismissed?: boolean
  notes?: string
}

export interface SearchReport {
  id: string
  location: string
  category: string
  searchQuery: string
  date: string
  businessCount: number
}

const BUSINESSES_KEY = "prospectiq_businesses"
const REPORTS_KEY = "prospectiq_reports"

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

export function getSavedBusinesses(): SavedBusiness[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(BUSINESSES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveBusinesses(
  businesses: Business[],
  location: string,
  category: string
): { newCount: number; updatedCount: number } {
  const existing = getSavedBusinesses()
  const existingMap = new Map<string, SavedBusiness>()

  for (const b of existing) {
    existingMap.set(normalizeName(b.name) + "|" + normalizeName(b.address), b)
  }

  let newCount = 0
  let updatedCount = 0
  const searchQuery = category && category !== "all"
    ? `${category} in ${location}`
    : `businesses in ${location}`
  const now = new Date().toISOString()

  for (const b of businesses) {
    const key = normalizeName(b.name) + "|" + normalizeName(b.address)

    if (existingMap.has(key)) {
      // Update existing — merge data, keep analysis
      const prev = existingMap.get(key)!
      existingMap.set(key, {
        ...prev,
        ...b,
        analysis: prev.analysis,
        savedAt: prev.savedAt,
        searchQuery: prev.searchQuery,
      })
      updatedCount++
    } else {
      existingMap.set(key, {
        ...b,
        savedAt: now,
        searchQuery,
      })
      newCount++
    }
  }

  const all = Array.from(existingMap.values())
  localStorage.setItem(BUSINESSES_KEY, JSON.stringify(all))

  // Save report
  saveReport({
    id: crypto.randomUUID(),
    location,
    category: category || "All categories",
    searchQuery,
    date: now,
    businessCount: businesses.length,
  })

  return { newCount, updatedCount }
}

export function saveAnalysis(businessId: string, analysis: SiteAnalysis): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].analysis = analysis
    localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses))
  }
}

export function toggleProspect(businessId: string): boolean {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const wasProspect = businesses[idx].isProspect
    businesses[idx].isProspect = !wasProspect
    if (!wasProspect) businesses[idx].isDismissed = false // clear dismiss if adding as prospect
    localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses))
    return businesses[idx].isProspect!
  }
  return false
}

export function toggleDismiss(businessId: string): boolean {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const wasDismissed = businesses[idx].isDismissed
    businesses[idx].isDismissed = !wasDismissed
    if (!wasDismissed) businesses[idx].isProspect = false // clear prospect if dismissing
    localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses))
    return businesses[idx].isDismissed!
  }
  return false
}

export function saveNotes(businessId: string, notes: string): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].notes = notes
    localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses))
  }
}

export function getReports(): SearchReport[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(REPORTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveReport(report: SearchReport): void {
  const reports = getReports()
  reports.unshift(report)
  // Keep last 100 reports
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 100)))
}

export function clearAllData(): void {
  localStorage.removeItem(BUSINESSES_KEY)
  localStorage.removeItem(REPORTS_KEY)
}

export function getStats() {
  const businesses = getSavedBusinesses()
  return {
    total: businesses.length,
    withWebsite: businesses.filter((b) => b.webPresence === "website").length,
    facebookOnly: businesses.filter(
      (b) => b.webPresence === "facebook-only" || b.webPresence === "social-only"
    ).length,
    noPresence: businesses.filter((b) => b.webPresence === "none").length,
    analyzed: businesses.filter((b) => b.analysis).length,
    yellowPages: businesses.filter((b) => b.analysis?.isYellowPages).length,
    prospects: businesses.filter((b) => b.isProspect).length,
    dismissed: businesses.filter((b) => b.isDismissed).length,
  }
}

export function exportToCSV(businesses: SavedBusiness[]): string {
  const headers = [
    "Name",
    "Category",
    "Address",
    "Phone",
    "Website",
    "Facebook",
    "Web Presence",
    "Rating",
    "Reviews",
    "Source",
    "Platform",
    "Estimated Age",
    "Mobile Friendly",
    "Has SSL",
    "Yellow Pages Site",
    "Analysis Summary",
    "Search Query",
    "Notes",
    "Status",
    "Saved At",
  ]

  const rows = businesses.map((b) => [
    b.name,
    b.category || "",
    b.address,
    b.phone || "",
    b.website || "",
    b.facebook || "",
    b.webPresence,
    b.rating?.toString() || "",
    b.reviewCount?.toString() || "",
    b.source,
    b.analysis?.platform || "",
    b.analysis?.estimatedAge || "",
    b.analysis ? (b.analysis.isMobileFriendly ? "Yes" : "No") : "",
    b.analysis ? (b.analysis.hasSSL ? "Yes" : "No") : "",
    b.analysis ? (b.analysis.isYellowPages ? "Yes" : "No") : "",
    b.analysis?.summary || "",
    b.searchQuery || "",
    b.notes || "",
    b.isProspect ? "Prospect" : b.isDismissed ? "Dismissed" : "",
    b.savedAt || "",
  ])

  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  return [
    headers.join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n")
}
