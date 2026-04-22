import type { Business } from "@/app/api/search/route"
import type { SiteAnalysis } from "@/app/api/analyze/route"
import type { DuellyScanResult } from "@/app/api/duelly-scan/route"
import type { GBPAudit } from "@/app/api/gbp-audit/route"

// --- Types ---

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
}

export type PipelineStage = "none" | "contacted" | "meeting" | "proposal" | "won" | "lost"

export interface RankingEntry {
  query: string
  position: number
  date: string
}

export interface SavedBusiness extends Business {
  savedAt: string
  searchQuery: string
  analysis?: SiteAnalysis
  isProspect?: boolean
  isPriority?: boolean
  isDismissed?: boolean
  notes?: string
  pipelineStage?: PipelineStage
  needsSEO?: boolean
  serviceTags?: string[]
  emails?: string[]
  rankings?: RankingEntry[]
  duellyScan?: DuellyScanResult
  gbpAudit?: GBPAudit
}

export interface SearchReport {
  id: string
  location: string
  category: string
  searchQuery: string
  date: string
  businessCount: number
}

export interface AuditResult {
  businessId: string
  name: string
  address: string
  phone?: string
  website?: string
  hasWebsite: boolean
  webPresence: string
  rating?: number
  reviewCount?: number
  category?: string
  googleMapsUri?: string
  duellyScan?: DuellyScanResult
}

export interface Audit {
  id: string
  query: string
  location: string
  category: string
  date: string
  results: AuditResult[]
}

// --- Keys ---

const PROJECTS_KEY = "prospectiq_projects"
const ACTIVE_PROJECT_KEY = "prospectiq_active_project"

function businessesKey(projectId: string) {
  return `prospectiq_p_${projectId}_businesses`
}
function reportsKey(projectId: string) {
  return `prospectiq_p_${projectId}_reports`
}
function auditsKey(projectId: string) {
  return `prospectiq_p_${projectId}_audits`
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

// --- Storage Monitor ---

export function getStorageUsage(): { usedMB: number; totalMB: number; percent: number } {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key)!.length * 2 // UTF-16 = 2 bytes per char
    }
  }
  const usedMB = parseFloat((total / (1024 * 1024)).toFixed(2))
  const totalMB = 5
  return { usedMB, totalMB, percent: Math.round((usedMB / totalMB) * 100) }
}

// --- Project Management ---

export function getProjects(): Project[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(PROJECTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function createProject(name: string, description?: string): Project {
  const projects = getProjects()
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: new Date().toISOString(),
  }
  projects.push(project)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  setActiveProject(project.id)
  return project
}

export function deleteProject(projectId: string): void {
  const projects = getProjects().filter((p) => p.id !== projectId)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  localStorage.removeItem(businessesKey(projectId))
  localStorage.removeItem(reportsKey(projectId))
  // If we deleted the active project, switch to another
  const active = getActiveProjectId()
  if (active === projectId) {
    setActiveProject(projects[0]?.id || "")
  }
}

export function getActiveProjectId(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || ""
}

export function setActiveProject(projectId: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
}

export function getActiveProject(): Project | null {
  const id = getActiveProjectId()
  if (!id) return null
  return getProjects().find((p) => p.id === id) || null
}

// Migrate old data into a default project if needed
export function ensureProject(): Project {
  let projects = getProjects()
  if (projects.length === 0) {
    // Check for legacy data
    const legacyBusinesses = localStorage.getItem("prospectiq_businesses")
    const legacyReports = localStorage.getItem("prospectiq_reports")

    const project = createProject("My First Project")

    if (legacyBusinesses) {
      localStorage.setItem(businessesKey(project.id), legacyBusinesses)
      localStorage.removeItem("prospectiq_businesses")
    }
    if (legacyReports) {
      localStorage.setItem(reportsKey(project.id), legacyReports)
      localStorage.removeItem("prospectiq_reports")
    }

    return project
  }

  const activeId = getActiveProjectId()
  const active = projects.find((p) => p.id === activeId)
  if (!active) {
    setActiveProject(projects[0].id)
    return projects[0]
  }
  return active
}

// --- Business CRUD (project-scoped) ---

export function getSavedBusinesses(): SavedBusiness[] {
  if (typeof window === "undefined") return []
  const pid = getActiveProjectId()
  if (!pid) return []
  try {
    const data = localStorage.getItem(businessesKey(pid))
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function _saveBusinessList(businesses: SavedBusiness[]): void {
  const pid = getActiveProjectId()
  if (!pid) return
  try {
    localStorage.setItem(businessesKey(pid), JSON.stringify(businesses))
  } catch (e: any) {
    if (e?.name === "QuotaExceededError") {
      throw new Error("Storage full! Export your data and clear old projects to free space.")
    }
    throw e
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
  const searchQuery =
    category && category !== "all"
      ? `${category} in ${location}`
      : `businesses in ${location}`
  const now = new Date().toISOString()

  for (const b of businesses) {
    const key = normalizeName(b.name) + "|" + normalizeName(b.address)
    if (existingMap.has(key)) {
      const prev = existingMap.get(key)!
      existingMap.set(key, {
        ...prev,
        ...b,
        analysis: prev.analysis,
        isProspect: prev.isProspect,
        isPriority: prev.isPriority,
        isDismissed: prev.isDismissed,
        notes: prev.notes,
        pipelineStage: prev.pipelineStage,
        needsSEO: prev.needsSEO,
        serviceTags: prev.serviceTags,
        emails: prev.emails,
        rankings: prev.rankings,
        savedAt: prev.savedAt,
        searchQuery: prev.searchQuery,
      })
      updatedCount++
    } else {
      existingMap.set(key, { ...b, savedAt: now, searchQuery })
      newCount++
    }

    // Save ranking if position is available
    if (b.searchPosition) {
      const biz = existingMap.get(key)!
      const rankings = biz.rankings || []
      const existingRank = rankings.findIndex((r) => r.query === searchQuery)
      const entry = { query: searchQuery, position: b.searchPosition, date: now }
      if (existingRank !== -1) {
        rankings[existingRank] = entry
      } else {
        rankings.push(entry)
      }
      biz.rankings = rankings
    }
  }

  _saveBusinessList(Array.from(existingMap.values()))

  // Save report
  const pid = getActiveProjectId()
  if (pid) {
    const reports = getReports()
    reports.unshift({
      id: crypto.randomUUID(),
      location,
      category: category || "All categories",
      searchQuery,
      date: now,
      businessCount: businesses.length,
    })
    localStorage.setItem(reportsKey(pid), JSON.stringify(reports.slice(0, 100)))
  }

  return { newCount, updatedCount }
}

export function saveAnalysis(businessId: string, analysis: SiteAnalysis): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].analysis = analysis
    _saveBusinessList(businesses)
  }
}

export function toggleProspect(businessId: string): boolean {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const wasProspect = businesses[idx].isProspect
    businesses[idx].isProspect = !wasProspect
    if (!wasProspect) {
      businesses[idx].isDismissed = false
      businesses[idx].isPriority = false
    }
    _saveBusinessList(businesses)
    return businesses[idx].isProspect!
  }
  return false
}

export function togglePriority(businessId: string): boolean {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const wasPriority = businesses[idx].isPriority
    businesses[idx].isPriority = !wasPriority
    if (!wasPriority) {
      businesses[idx].isProspect = false
      businesses[idx].isDismissed = false
    }
    _saveBusinessList(businesses)
    return businesses[idx].isPriority!
  }
  return false
}

export function toggleDismiss(businessId: string): boolean {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const wasDismissed = businesses[idx].isDismissed
    businesses[idx].isDismissed = !wasDismissed
    if (!wasDismissed) {
      businesses[idx].isProspect = false
      businesses[idx].isPriority = false
    }
    _saveBusinessList(businesses)
    return businesses[idx].isDismissed!
  }
  return false
}

export function saveNotes(businessId: string, notes: string): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].notes = notes
    _saveBusinessList(businesses)
  }
}

export function setPipelineStage(businessId: string, stage: PipelineStage): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].pipelineStage = stage
    _saveBusinessList(businesses)
  }
}

export const SERVICE_TAGS = [
  { id: "pitch-design", label: "Pitch Design", color: "bg-pink-500" },
  { id: "pitch-seo", label: "Pitch SEO", color: "bg-indigo-500" },
  { id: "pitch-chatbot", label: "Pitch AI Chatbot", color: "bg-cyan-500" },
] as const

export type ServiceTagId = typeof SERVICE_TAGS[number]["id"]

export function toggleServiceTag(businessId: string, tagId: string): string[] {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const tags = businesses[idx].serviceTags || []
    if (tags.includes(tagId)) {
      businesses[idx].serviceTags = tags.filter((t) => t !== tagId)
    } else {
      businesses[idx].serviceTags = [...tags, tagId]
    }
    // Migrate old needsSEO flag
    if (tagId === "pitch-seo") businesses[idx].needsSEO = businesses[idx].serviceTags!.includes("pitch-seo")
    _saveBusinessList(businesses)
    return businesses[idx].serviceTags!
  }
  return []
}

export function toggleSEO(businessId: string): boolean {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].needsSEO = !businesses[idx].needsSEO
    _saveBusinessList(businesses)
    return businesses[idx].needsSEO!
  }
  return false
}

export function saveEmails(businessId: string, emails: string[]): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const existing = businesses[idx].emails || []
    const merged = Array.from(new Set([...existing, ...emails]))
    businesses[idx].emails = merged
    _saveBusinessList(businesses)
  }
}

export function saveDuellyScan(businessId: string, scan: DuellyScanResult): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].duellyScan = scan
    _saveBusinessList(businesses)
  }
}

export function saveGBPAudit(businessId: string, audit: GBPAudit): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    businesses[idx].gbpAudit = audit
    _saveBusinessList(businesses)
  }
}

export function addRanking(businessId: string, query: string, position: number): void {
  const businesses = getSavedBusinesses()
  const idx = businesses.findIndex((b) => b.id === businessId)
  if (idx !== -1) {
    const rankings = businesses[idx].rankings || []
    // Update existing ranking for same query or add new
    const existingIdx = rankings.findIndex((r) => r.query === query)
    const entry: RankingEntry = { query, position, date: new Date().toISOString() }
    if (existingIdx !== -1) {
      rankings[existingIdx] = entry
    } else {
      rankings.push(entry)
    }
    businesses[idx].rankings = rankings
    _saveBusinessList(businesses)
  }
}

// --- Reports ---

export function getReports(): SearchReport[] {
  if (typeof window === "undefined") return []
  const pid = getActiveProjectId()
  if (!pid) return []
  try {
    const data = localStorage.getItem(reportsKey(pid))
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// --- Stats ---

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
    priority: businesses.filter((b) => b.isPriority).length,
    dismissed: businesses.filter((b) => b.isDismissed).length,
    needsSEO: businesses.filter((b) => b.needsSEO || b.serviceTags?.includes("pitch-seo")).length,
    pitchDesign: businesses.filter((b) => b.serviceTags?.includes("pitch-design")).length,
    pitchChatbot: businesses.filter((b) => b.serviceTags?.includes("pitch-chatbot")).length,
  }
}

// --- Clear ---

export function clearProjectData(): void {
  const pid = getActiveProjectId()
  if (!pid) return
  localStorage.removeItem(businessesKey(pid))
  localStorage.removeItem(reportsKey(pid))
  localStorage.removeItem(auditsKey(pid))
}

// --- Audits ---

export function getAudits(): Audit[] {
  if (typeof window === "undefined") return []
  const pid = getActiveProjectId()
  if (!pid) return []
  try {
    const data = localStorage.getItem(auditsKey(pid))
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveAudit(audit: Audit): void {
  const pid = getActiveProjectId()
  if (!pid) return
  const audits = getAudits()
  audits.unshift(audit)
  localStorage.setItem(auditsKey(pid), JSON.stringify(audits.slice(0, 50)))
}

export function getAudit(auditId: string): Audit | null {
  return getAudits().find((a) => a.id === auditId) || null
}

export function updateAuditResult(auditId: string, businessId: string, duellyScan: DuellyScanResult): void {
  const pid = getActiveProjectId()
  if (!pid) return
  const audits = getAudits()
  const audit = audits.find((a) => a.id === auditId)
  if (!audit) return
  const result = audit.results.find((r) => r.businessId === businessId)
  if (result) {
    result.duellyScan = duellyScan
    localStorage.setItem(auditsKey(pid), JSON.stringify(audits))
  }
}

export function deleteAudit(auditId: string): void {
  const pid = getActiveProjectId()
  if (!pid) return
  const audits = getAudits().filter((a) => a.id !== auditId)
  localStorage.setItem(auditsKey(pid), JSON.stringify(audits))
}

// --- CSV Export ---

export function exportToCSV(businesses: SavedBusiness[]): string {
  const headers = [
    "Name", "Category", "Address", "Phone", "Website", "Facebook",
    "Web Presence", "Rating", "Reviews", "Source", "Platform",
    "Estimated Age", "Mobile Friendly", "Has SSL", "Yellow Pages Site",
    "Analysis Summary", "Search Query", "Notes", "Status", "Pipeline Stage", "Service Tags", "Emails", "Rankings", "Saved At",
  ]

  const rows = businesses.map((b) => [
    b.name, b.category || "", b.address, b.phone || "",
    b.website || "", b.facebook || "", b.webPresence,
    b.rating?.toString() || "", b.reviewCount?.toString() || "",
    b.source, b.analysis?.platform || "", b.analysis?.estimatedAge || "",
    b.analysis ? (b.analysis.isMobileFriendly ? "Yes" : "No") : "",
    b.analysis ? (b.analysis.hasSSL ? "Yes" : "No") : "",
    b.analysis ? (b.analysis.isYellowPages ? "Yes" : "No") : "",
    b.analysis?.summary || "", b.searchQuery || "", b.notes || "",
    b.isProspect ? "Prospect" : b.isPriority ? "Priority" : b.isDismissed ? "Dismissed" : "",
    b.pipelineStage || "",
    (b.serviceTags || []).join("; "),
    (b.emails || []).join("; "),
    (b.rankings || []).map((r) => `#${r.position} for "${r.query}"`).join("; "),
    b.savedAt || "",
  ])

  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  return [headers.join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n")
}

