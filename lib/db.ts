import { createClient } from "@/lib/supabase/client"
import type { Business } from "@/app/api/search/route"
import type { SiteAnalysis } from "@/app/api/analyze/route"
import type { DuellyScanResult } from "@/app/api/duelly-scan/route"
import type { GBPAudit } from "@/app/api/gbp-audit/route"

// --- Types ---

export type PipelineStage = "none" | "contacted" | "meeting" | "proposal" | "won" | "lost"
export type BusinessStatus = "neutral" | "prospect" | "priority" | "dismissed"

export interface DbBusiness {
  id: string
  project_id: string
  name: string
  address: string
  phone?: string
  website?: string
  facebook?: string
  social_url?: string
  has_website: boolean
  web_presence: string
  rating?: number
  review_count: number
  category?: string
  google_maps_uri?: string
  source: string
  search_query?: string
  status: BusinessStatus
  pipeline_stage: PipelineStage
  service_tags: string[]
  needs_seo: boolean
  emails: string[]
  notes?: string
  analysis?: SiteAnalysis
  duelly_scan?: DuellyScanResult
  gbp_audit?: GBPAudit
  rankings?: any[]
  saved_at: string
  updated_at: string
}

export interface DbProject {
  id: string
  user_id: string
  organization_id?: string
  name: string
  description?: string
  created_at: string
}

export interface DbAudit {
  id: string
  project_id: string
  query: string
  location: string
  category?: string
  results: any[]
  created_at: string
}

export const SERVICE_TAGS = [
  { id: "pitch-design", label: "Pitch Design", color: "bg-pink-500" },
  { id: "pitch-seo", label: "Pitch SEO", color: "bg-indigo-500" },
  { id: "pitch-chatbot", label: "Pitch AI Chatbot", color: "bg-cyan-500" },
] as const

// --- Helper ---

function getSupabase() {
  return createClient()
}

let _activeProjectId: string | null = null

export function getActiveProjectId(): string {
  return _activeProjectId || ""
}

export function setActiveProjectId(id: string) {
  _activeProjectId = id
  if (typeof window !== "undefined") {
    localStorage.setItem("marketmojo_active_project", id)
  }
}

// --- Projects ---

export async function getProjects(): Promise<DbProject[]> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })
  return data || []
}

export async function createProject(name: string, description?: string): Promise<DbProject | null> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, description, user_id: user.id })
    .select()
    .single()

  if (error) { console.error("Create project error:", error); return null }
  setActiveProjectId(data.id)
  return data
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("projects").delete().eq("id", projectId)
  if (_activeProjectId === projectId) {
    const projects = await getProjects()
    setActiveProjectId(projects[0]?.id || "")
  }
}

export async function ensureProject(): Promise<DbProject | null> {
  // Load active project from localStorage
  if (typeof window !== "undefined" && !_activeProjectId) {
    _activeProjectId = localStorage.getItem("marketmojo_active_project")
  }

  const projects = await getProjects()
  if (projects.length === 0) {
    return await createProject("My First Project")
  }

  const active = projects.find((p) => p.id === _activeProjectId)
  if (!active) {
    setActiveProjectId(projects[0].id)
    return projects[0]
  }
  return active
}

export async function getActiveProject(): Promise<DbProject | null> {
  const projects = await getProjects()
  return projects.find((p) => p.id === _activeProjectId) || projects[0] || null
}

// --- Businesses ---

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim()
}

export async function getBusinesses(projectId?: string): Promise<DbBusiness[]> {
  const pid = projectId || getActiveProjectId()
  if (!pid) return []
  const supabase = getSupabase()
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("project_id", pid)
    .order("saved_at", { ascending: false })
  return data || []
}

export async function saveBusinesses(
  businesses: Business[],
  location: string,
  category: string
): Promise<{ newCount: number; updatedCount: number }> {
  const pid = getActiveProjectId()
  if (!pid) return { newCount: 0, updatedCount: 0 }

  const supabase = getSupabase()
  const existing = await getBusinesses(pid)
  const existingMap = new Map(
    existing.map((b) => [normalizeName(b.name) + "|" + normalizeName(b.address), b])
  )

  const searchQuery = category && category !== "all"
    ? `${category} in ${location}`
    : `businesses in ${location}`

  let newCount = 0
  let updatedCount = 0

  for (const b of businesses) {
    const key = normalizeName(b.name) + "|" + normalizeName(b.address)
    const prev = existingMap.get(key)

    if (prev) {
      // Update existing — keep user data, update business data
      await supabase.from("businesses").update({
        phone: b.phone || prev.phone,
        website: b.website || prev.website,
        facebook: b.facebook || prev.facebook,
        social_url: b.socialUrl || prev.social_url,
        has_website: b.hasWebsite,
        web_presence: b.webPresence,
        rating: b.rating || prev.rating,
        review_count: b.reviewCount || prev.review_count,
        category: b.category || prev.category,
        google_maps_uri: b.googleMapsUri || prev.google_maps_uri,
        updated_at: new Date().toISOString(),
      }).eq("id", prev.id)
      updatedCount++
    } else {
      await supabase.from("businesses").insert({
        project_id: pid,
        name: b.name,
        address: b.address,
        phone: b.phone,
        website: b.website,
        facebook: b.facebook,
        social_url: b.socialUrl,
        has_website: b.hasWebsite,
        web_presence: b.webPresence,
        rating: b.rating,
        review_count: b.reviewCount || 0,
        category: b.category,
        google_maps_uri: b.googleMapsUri,
        source: b.source,
        search_query: searchQuery,
      })
      newCount++
    }
  }

  // Save search report
  await supabase.from("search_reports").insert({
    project_id: pid,
    location,
    category: category || "All categories",
    search_query: searchQuery,
    business_count: businesses.length,
  })

  return { newCount, updatedCount }
}

// --- Business Actions ---

export async function updateBusinessStatus(businessId: string, status: BusinessStatus): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("businesses").update({ status, updated_at: new Date().toISOString() }).eq("id", businessId)
}

export async function updatePipelineStage(businessId: string, stage: PipelineStage): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("businesses").update({ pipeline_stage: stage, updated_at: new Date().toISOString() }).eq("id", businessId)
}

export async function toggleServiceTag(businessId: string, tagId: string, currentTags: string[]): Promise<string[]> {
  const supabase = getSupabase()
  const newTags = currentTags.includes(tagId)
    ? currentTags.filter((t) => t !== tagId)
    : [...currentTags, tagId]
  await supabase.from("businesses").update({ service_tags: newTags, updated_at: new Date().toISOString() }).eq("id", businessId)
  return newTags
}

export async function saveNotes(businessId: string, notes: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("businesses").update({ notes, updated_at: new Date().toISOString() }).eq("id", businessId)
}

export async function saveEmails(businessId: string, newEmails: string[], existingEmails: string[]): Promise<string[]> {
  const supabase = getSupabase()
  const merged = Array.from(new Set([...existingEmails, ...newEmails]))
  await supabase.from("businesses").update({ emails: merged, updated_at: new Date().toISOString() }).eq("id", businessId)
  return merged
}

export async function saveAnalysis(businessId: string, analysis: SiteAnalysis): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("businesses").update({ analysis, updated_at: new Date().toISOString() }).eq("id", businessId)
}

export async function saveDuellyScan(businessId: string, scan: DuellyScanResult): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("businesses").update({ duelly_scan: scan, updated_at: new Date().toISOString() }).eq("id", businessId)
}

export async function saveGBPAudit(businessId: string, audit: GBPAudit): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("businesses").update({ gbp_audit: audit, updated_at: new Date().toISOString() }).eq("id", businessId)
}

// --- Audits ---

export async function getAudits(projectId?: string): Promise<DbAudit[]> {
  const pid = projectId || getActiveProjectId()
  if (!pid) return []
  const supabase = getSupabase()
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("project_id", pid)
    .order("created_at", { ascending: false })
  return data || []
}

export async function getAudit(auditId: string): Promise<DbAudit | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .single()
  return data
}

export async function saveAudit(audit: Omit<DbAudit, "id" | "created_at">): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("audits").insert(audit)
}

export async function deleteAudit(auditId: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("audits").delete().eq("id", auditId)
}

// --- Stats ---

export async function getStats(projectId?: string) {
  const businesses = await getBusinesses(projectId)
  return {
    total: businesses.length,
    withWebsite: businesses.filter((b) => b.web_presence === "website").length,
    facebookOnly: businesses.filter((b) => b.web_presence === "facebook-only" || b.web_presence === "social-only").length,
    noPresence: businesses.filter((b) => b.web_presence === "none").length,
    analyzed: businesses.filter((b) => b.analysis).length,
    yellowPages: businesses.filter((b) => (b.analysis as any)?.isYellowPages).length,
    prospects: businesses.filter((b) => b.status === "prospect").length,
    priority: businesses.filter((b) => b.status === "priority").length,
    dismissed: businesses.filter((b) => b.status === "dismissed").length,
    needsSEO: businesses.filter((b) => b.service_tags?.includes("pitch-seo")).length,
    pitchDesign: businesses.filter((b) => b.service_tags?.includes("pitch-design")).length,
    pitchChatbot: businesses.filter((b) => b.service_tags?.includes("pitch-chatbot")).length,
  }
}

// --- Reports ---

export async function getReports(projectId?: string) {
  const pid = projectId || getActiveProjectId()
  if (!pid) return []
  const supabase = getSupabase()
  const { data } = await supabase
    .from("search_reports")
    .select("*")
    .eq("project_id", pid)
    .order("created_at", { ascending: false })
    .limit(50)
  return data || []
}

// --- Clear ---

export async function clearProjectData(projectId?: string): Promise<void> {
  const pid = projectId || getActiveProjectId()
  if (!pid) return
  const supabase = getSupabase()
  await supabase.from("businesses").delete().eq("project_id", pid)
  await supabase.from("audits").delete().eq("project_id", pid)
  await supabase.from("search_reports").delete().eq("project_id", pid)
}

// --- CSV Export ---

export function exportToCSV(businesses: DbBusiness[]): string {
  const headers = [
    "Name", "Category", "Address", "Phone", "Website", "Facebook",
    "Web Presence", "Rating", "Reviews", "Source", "Platform",
    "Estimated Age", "Mobile Friendly", "Has SSL", "Yellow Pages Site",
    "Analysis Summary", "Search Query", "Notes", "Status", "Pipeline Stage",
    "Service Tags", "Emails", "Saved At",
  ]

  const rows = businesses.map((b) => {
    const a = b.analysis as any
    return [
      b.name, b.category || "", b.address, b.phone || "",
      b.website || "", b.facebook || "", b.web_presence,
      b.rating?.toString() || "", b.review_count?.toString() || "",
      b.source, a?.platform || "", a?.estimatedAge || "",
      a ? (a.isMobileFriendly ? "Yes" : "No") : "",
      a ? (a.hasSSL ? "Yes" : "No") : "",
      a ? (a.isYellowPages ? "Yes" : "No") : "",
      a?.summary || "", b.search_query || "", b.notes || "",
      b.status, b.pipeline_stage,
      (b.service_tags || []).join("; "),
      (b.emails || []).join("; "),
      b.saved_at || "",
    ]
  })

  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  return [headers.join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n")
}

// --- Storage Usage (for compatibility) ---

export function getStorageUsage() {
  return { usedMB: 0, totalMB: 999, percent: 0 } // No longer relevant with Supabase
}

// --- Custom Service Tags ---

export interface CustomServiceTag {
  id: string
  user_id: string
  label: string
  color: string
  sort_order: number
}

export interface CustomPipelineStage {
  id: string
  user_id: string
  label: string
  color: string
  sort_order: number
}

const DEFAULT_SERVICE_TAGS: Omit<CustomServiceTag, "id" | "user_id">[] = [
  { label: "Pitch Design", color: "bg-pink-500", sort_order: 0 },
  { label: "Pitch SEO", color: "bg-indigo-500", sort_order: 1 },
  { label: "Pitch AI Chatbot", color: "bg-cyan-500", sort_order: 2 },
]

const DEFAULT_PIPELINE_STAGES: Omit<CustomPipelineStage, "id" | "user_id">[] = [
  { label: "Contacted", color: "bg-blue-500", sort_order: 0 },
  { label: "Meeting", color: "bg-violet-500", sort_order: 1 },
  { label: "Proposal", color: "bg-amber-500", sort_order: 2 },
  { label: "Won", color: "bg-green-600", sort_order: 3 },
  { label: "Lost", color: "bg-red-500", sort_order: 4 },
]

export async function getServiceTags(): Promise<CustomServiceTag[]> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("custom_service_tags")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order")

  if (!data || data.length === 0) {
    // Seed defaults
    const defaults = DEFAULT_SERVICE_TAGS.map((t) => ({ ...t, user_id: user.id }))
    const { data: seeded } = await supabase.from("custom_service_tags").insert(defaults).select()
    return seeded || []
  }
  return data
}

export async function addServiceTag(label: string, color: string): Promise<CustomServiceTag | null> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const existing = await getServiceTags()
  const { data } = await supabase.from("custom_service_tags")
    .insert({ user_id: user.id, label, color, sort_order: existing.length })
    .select().single()
  return data
}

export async function updateServiceTag(id: string, label: string, color: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("custom_service_tags").update({ label, color }).eq("id", id)
}

export async function deleteServiceTag(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("custom_service_tags").delete().eq("id", id)
}

export async function getPipelineStages(): Promise<CustomPipelineStage[]> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("custom_pipeline_stages")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order")

  if (!data || data.length === 0) {
    const defaults = DEFAULT_PIPELINE_STAGES.map((s) => ({ ...s, user_id: user.id }))
    const { data: seeded } = await supabase.from("custom_pipeline_stages").insert(defaults).select()
    return seeded || []
  }
  return data
}

export async function addPipelineStage(label: string, color: string): Promise<CustomPipelineStage | null> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const existing = await getPipelineStages()
  const { data } = await supabase.from("custom_pipeline_stages")
    .insert({ user_id: user.id, label, color, sort_order: existing.length })
    .select().single()
  return data
}

export async function updatePipelineStageConfig(id: string, label: string, color: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("custom_pipeline_stages").update({ label, color }).eq("id", id)
}

export async function deletePipelineStage(id: string): Promise<void> {
  const supabase = getSupabase()
  await supabase.from("custom_pipeline_stages").delete().eq("id", id)
}

// --- Credits ---

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  business_id?: string
  business_name?: string
  created_at: string
}

export async function getCredits(): Promise<number> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { data } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single()
  return data?.credits ?? 0
}

export async function deductCredits(
  amount: number,
  reason: string,
  businessId?: string,
  businessName?: string
): Promise<{ success: boolean; remaining: number }> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, remaining: 0 }

  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single()

  const current = profile?.credits ?? 0
  if (current < amount) return { success: false, remaining: current }

  const newBalance = current - amount

  // Deduct
  await supabase
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", user.id)

  // Log transaction
  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: -amount,
    reason,
    business_id: businessId || null,
    business_name: businessName || null,
  })

  return { success: true, remaining: newBalance }
}

export async function refundCredits(
  amount: number,
  reason: string,
  businessId?: string,
  businessName?: string
): Promise<number> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single()

  const newBalance = (profile?.credits ?? 0) + amount

  await supabase
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", user.id)

  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount,
    reason,
    business_id: businessId || null,
    business_name: businessName || null,
  })

  return newBalance
}

export async function getCreditHistory(limit = 50): Promise<CreditTransaction[]> {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)
  return data || []
}
