"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin, Phone, ExternalLink, Building2, Globe, XCircle, Star, Map, Facebook,
  ScanSearch, Loader2, ShieldAlert, Smartphone, Clock, Wrench, AlertTriangle,
  MessageSquare, Ban, EyeOff, Flame, SearchCheck, Mail, TrendingUp, MapPinned, FileText,
} from "lucide-react"
import type { SiteAnalysis } from "@/app/api/analyze/route"
import type { DuellyScanResult } from "@/app/api/duelly-scan/route"
import type { GBPAudit } from "@/app/api/gbp-audit/route"
import {
  updateBusinessStatus, updatePipelineStage, toggleServiceTag as dbToggleServiceTag,
  saveNotes as dbSaveNotes, saveEmails as dbSaveEmails, saveAnalysis as dbSaveAnalysis,
  saveDuellyScan as dbSaveDuellyScan, saveGBPAudit as dbSaveGBPAudit,
  SERVICE_TAGS, type PipelineStage, type BusinessStatus,
} from "@/lib/db"
import { addToBlocklist } from "@/lib/blocklist"

const presenceConfig: Record<string, { label: string; variant: "secondary" | "outline" | "destructive"; icon: any }> = {
  website: { label: "Has Website", variant: "secondary", icon: Globe },
  "facebook-only": { label: "Facebook Only", variant: "outline", icon: Facebook },
  "social-only": { label: "Social Only", variant: "outline", icon: Globe },
  none: { label: "No Online Presence", variant: "destructive", icon: XCircle },
}

export interface LeadCardBusiness {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  facebook?: string
  social_url?: string
  has_website?: boolean
  web_presence?: string
  rating?: number
  review_count?: number
  category?: string
  google_maps_uri?: string
  source?: string
  status?: BusinessStatus
  pipeline_stage?: PipelineStage
  service_tags?: string[]
  emails?: string[]
  notes?: string
  analysis?: any
  duelly_scan?: any
  gbp_audit?: any
  // Old format compatibility
  hasWebsite?: boolean
  webPresence?: string
  reviewCount?: number
  googleMapsUri?: string
  isProspect?: boolean
  isPriority?: boolean
  isDismissed?: boolean
  pipelineStage?: string
  serviceTags?: string[]
  duellyScan?: any
  gbpAudit?: any
  needsSEO?: boolean
}

interface LeadCardProps {
  business: LeadCardBusiness
  onProspectChange?: () => void
  onBlock?: (name: string) => void
}

export function LeadCard({ business: biz, onProspectChange, onBlock }: LeadCardProps) {
  // Normalize old/new formats
  const wp = (biz.web_presence || biz.webPresence || "none") as string
  const mapsUri = biz.google_maps_uri || biz.googleMapsUri
  const revCount = biz.review_count || biz.reviewCount || 0
  const initStatus: BusinessStatus = biz.status || (biz.isPriority ? "priority" : biz.isProspect ? "prospect" : biz.isDismissed ? "dismissed" : "neutral")
  const initAnalysis = biz.analysis || null
  const initDuelly = biz.duelly_scan || biz.duellyScan || null
  const initGbp = biz.gbp_audit || biz.gbpAudit || null
  const initStage = (biz.pipeline_stage || biz.pipelineStage || "none") as PipelineStage
  const initTags = biz.service_tags || biz.serviceTags || (biz.needsSEO ? ["pitch-seo"] : [])
  const initEmails = biz.emails || []
  const initNotes = biz.notes || ""
  const canAnalyze = wp === "website" && biz.website

  // State
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(initAnalysis)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [status, setStatus] = useState<BusinessStatus>(initStatus)
  const [stage, setStage] = useState<PipelineStage>(initStage)
  const [serviceTags, setServiceTags] = useState<string[]>(initTags)
  const [notes, setNotes] = useState(initNotes)
  const [showNotes, setShowNotes] = useState(!!initNotes)
  const [emails, setEmails] = useState<string[]>(initEmails)
  const [findingEmail, setFindingEmail] = useState(false)
  const [emailNotFound, setEmailNotFound] = useState(false)
  const [manualEmail, setManualEmail] = useState("")
  const [editingEmail, setEditingEmail] = useState(false)
  const [duellyScan, setDuellyScan] = useState<DuellyScanResult | null>(initDuelly)
  const [scanningDuelly, setScanningDuelly] = useState(false)
  const [duellyError, setDuellyError] = useState<string | null>(null)
  const [duellyCooldown, setDuellyCooldown] = useState(0)
  const [gbpAudit, setGbpAudit] = useState<GBPAudit | null>(initGbp)
  const [scanningGBP, setScanningGBP] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailDraft, setEmailDraft] = useState("")
  const [emailPitchType, setEmailPitchType] = useState("general")
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [showDismissConfirm, setShowDismissConfirm] = useState(false)
  const [hidden, setHidden] = useState(false)

  const isProspect = status === "prospect"
  const isPriority = status === "priority"
  const isDismissed = status === "dismissed"
  const presence = presenceConfig[wp] || presenceConfig.none
  const PresenceIcon = presence.icon

  // --- Handlers ---
  const handleAnalyze = async () => {
    if (!biz.website) return
    setAnalyzing(true); setAnalyzeError(null)
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: biz.website }) })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setAnalysis(data)
      dbSaveAnalysis(biz.id, data)
      if (data.emails?.length) { dbSaveEmails(biz.id, data.emails, emails); setEmails(prev => Array.from(new Set([...prev, ...data.emails]))) }
    } catch { setAnalyzeError("Could not analyze this site") }
    setAnalyzing(false)
  }

  const handleFindEmail = async () => {
    setFindingEmail(true); setEmailNotFound(false)
    try {
      const res = await fetch("/api/find-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: biz.name, address: biz.address }) })
      if (res.ok) {
        const data = await res.json()
        if (data.emails?.length) { const merged = await dbSaveEmails(biz.id, data.emails, emails); setEmails(merged) }
        else setEmailNotFound(true)
      } else setEmailNotFound(true)
    } catch { setEmailNotFound(true) }
    setFindingEmail(false)
  }

  const handleDuellyScan = async () => {
    if (!biz.website || duellyCooldown > 0) return
    setScanningDuelly(true); setDuellyError(null)
    try {
      const res = await fetch("/api/duelly-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: biz.website }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Scan failed") }
      const data = await res.json()
      setDuellyScan(data); dbSaveDuellyScan(biz.id, data)
    } catch (e: any) { setDuellyError(e.message || "Duelly scan failed") }
    setScanningDuelly(false)
    setDuellyCooldown(30)
    const iv = setInterval(() => { setDuellyCooldown(p => { if (p <= 1) { clearInterval(iv); return 0 } return p - 1 }) }, 1000)
  }

  const handleGBPAudit = async () => {
    setScanningGBP(true)
    try {
      const res = await fetch("/api/gbp-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: biz.name, address: biz.address }) })
      if (res.ok) { const data = await res.json(); setGbpAudit(data); dbSaveGBPAudit(biz.id, data) }
    } catch {}
    setScanningGBP(false)
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const logoUrl = typeof window !== "undefined" ? localStorage.getItem("marketmojo_user_logo") : null
      const companyName = typeof window !== "undefined" ? localStorage.getItem("marketmojo_company_name") : null
      const res = await fetch("/api/generate-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: { ...biz, analysis, duellyScan, gbpAudit, serviceTags }, companyName, logoUrl }) })
      if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `audit-${biz.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`; a.click(); URL.revokeObjectURL(url) }
    } catch {}
    setGeneratingReport(false)
  }

  const handleGenerateEmail = async (pitchType: string) => {
    setGeneratingEmail(true); setEmailPitchType(pitchType)
    try {
      const companyName = typeof window !== "undefined" ? localStorage.getItem("marketmojo_company_name") : null
      const res = await fetch("/api/generate-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: { ...biz, analysis, duellyScan, gbpAudit }, pitchType, companyName }) })
      if (res.ok) { const data = await res.json(); setEmailDraft(data.email) }
    } catch {}
    setGeneratingEmail(false)
  }

  const handleSetStatus = (newStatus: BusinessStatus) => {
    if (newStatus === "dismissed" && status !== "dismissed") { setShowDismissConfirm(true); return }
    if (status === newStatus) { setStatus("neutral"); updateBusinessStatus(biz.id, "neutral") }
    else { setStatus(newStatus); updateBusinessStatus(biz.id, newStatus) }
    onProspectChange?.()
  }

  const confirmDismiss = () => {
    setStatus("dismissed"); updateBusinessStatus(biz.id, "dismissed")
    setShowDismissConfirm(false); setHidden(true); onProspectChange?.()
  }

  if (hidden) return null

  const cardBg = isPriority ? "bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-400 dark:ring-amber-700"
    : isProspect ? "bg-green-50 dark:bg-green-950/30 ring-1 ring-green-300 dark:ring-green-800"
    : isDismissed ? "bg-red-50 dark:bg-red-950/30 ring-1 ring-red-300 dark:ring-red-800 opacity-75"
    : "bg-card"

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 border-border/60 hover:border-primary/30 overflow-hidden ${cardBg}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="font-semibold text-foreground truncate min-w-0">{biz.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {biz.category && <p className="text-sm text-muted-foreground">{biz.category}</p>}
            <Badge variant={presence.variant} className="shrink-0 gap-1"><PresenceIcon className="w-3 h-3" />{presence.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {biz.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{biz.rating}</span>
            {revCount > 0 && <span className="text-sm text-muted-foreground">({revCount} reviews)</span>}
          </div>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{biz.address}</span></div>
          {biz.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 shrink-0" /><a href={`tel:${biz.phone}`} className="hover:text-primary transition-colors">{biz.phone}</a></div>}
          {biz.website && <div className="flex items-center gap-2 text-muted-foreground"><ExternalLink className="w-4 h-4 shrink-0" /><a href={biz.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">{biz.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></div>}
          {biz.facebook && <div className="flex items-center gap-2 text-muted-foreground"><Facebook className="w-4 h-4 shrink-0" /><a href={biz.facebook} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">Facebook Page</a></div>}
          {(biz.social_url) && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="w-4 h-4 shrink-0" /><a href={biz.social_url} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">{biz.social_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></div>}
          {mapsUri && <div className="flex items-center gap-2 text-muted-foreground"><Map className="w-4 h-4 shrink-0" /><a href={mapsUri} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">View on Google Maps</a></div>}
        </div>

        {/* Emails */}
        {emails.length > 0 && !editingEmail && (
          <div className="space-y-1">{emails.map(e => (
            <div key={e} className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4 shrink-0 text-green-500" /><a href={`mailto:${e}`} className="truncate hover:text-primary transition-colors">{e}</a><button onClick={() => setEditingEmail(true)} className="text-xs text-muted-foreground hover:text-primary shrink-0">Edit</button></div>
          ))}</div>
        )}
        {emails.length === 0 && !editingEmail && (
          <>{emailNotFound ? (
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0 text-muted-foreground" /><span className="text-xs text-muted-foreground">No email found</span><button onClick={() => setEditingEmail(true)} className="text-xs text-primary hover:underline">Add manually</button></div>
          ) : (
            <Button onClick={handleFindEmail} disabled={findingEmail} variant="outline" size="sm" className="w-full gap-2">{findingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding email...</> : <><Mail className="w-4 h-4" /> Find Email</>}</Button>
          )}</>
        )}
        {editingEmail && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input type="email" value={manualEmail} onChange={e => setManualEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && manualEmail.trim()) { dbSaveEmails(biz.id, [manualEmail.trim()], emails).then(setEmails); setManualEmail(""); setEditingEmail(false) } if (e.key === "Escape") setEditingEmail(false) }}
              placeholder="Enter email..." className="flex-1 text-sm p-1 rounded border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
            <button onClick={() => { if (manualEmail.trim()) { dbSaveEmails(biz.id, [manualEmail.trim()], emails).then(setEmails); setManualEmail("") } setEditingEmail(false) }} className="text-xs text-primary hover:underline">Save</button>
            <button onClick={() => setEditingEmail(false)} className="text-xs text-muted-foreground">Cancel</button>
          </div>
        )}

        {/* Analyze Button */}
        {canAnalyze && !analysis && (
          <Button onClick={handleAnalyze} disabled={analyzing} variant="outline" size="sm" className="w-full gap-2">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing site...</> : <><ScanSearch className="w-4 h-4" /> Analyze Website</>}
          </Button>
        )}
        {analyzeError && <p className="text-xs text-destructive">{analyzeError}</p>}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><ScanSearch className="w-3.5 h-3.5 text-primary" />Site Analysis</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.platform && <Badge variant="secondary" className="text-xs gap-1"><Wrench className="w-3 h-3" />{analysis.platform}</Badge>}
              {analysis.isYellowPages && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />Yellow Pages Site</Badge>}
              {analysis.estimatedAge && <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />{analysis.estimatedAge}</Badge>}
              {!analysis.hasSSL && <Badge variant="destructive" className="text-xs gap-1"><ShieldAlert className="w-3 h-3" />No SSL</Badge>}
              {!analysis.isMobileFriendly && <Badge variant="destructive" className="text-xs gap-1"><Smartphone className="w-3 h-3" />Not Mobile Friendly</Badge>}
              {analysis.flags?.filter((f: string) => !f.includes("mobile") && !f.includes("SSL") && !f.includes("reach")).map((flag: string) => <Badge key={flag} variant="outline" className="text-xs">{flag}</Badge>)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>
            {analysis.aiAssessment && (
              <div className="pt-2 border-t border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Refresh Score</span>
                  <span className={`text-xs font-bold ${analysis.aiAssessment.score <= 3 ? "text-red-500" : analysis.aiAssessment.score <= 6 ? "text-amber-500" : "text-green-500"}`}>
                    {analysis.aiAssessment.score}/10{analysis.aiAssessment.needsRefresh && " — Needs Refresh"}
                  </span>
                </div>
                {analysis.aiAssessment.reasons?.length > 0 && <ul className="text-xs text-muted-foreground space-y-0.5">{analysis.aiAssessment.reasons.map((r: string, i: number) => <li key={i}>• {r}</li>)}</ul>}
                {analysis.aiAssessment.recommendation && <p className="text-xs text-primary font-medium italic">"{analysis.aiAssessment.recommendation}"</p>}
              </div>
            )}
          </div>
        )}

        {/* Duelly Scan */}
        {canAnalyze && (
          <Button onClick={handleDuellyScan} disabled={scanningDuelly || duellyCooldown > 0} variant="outline" size="sm" className="w-full gap-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30">
            {scanningDuelly ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Duelly scan...</> : duellyCooldown > 0 ? <>Cooldown {duellyCooldown}s</> : <><TrendingUp className="w-4 h-4" /> {duellyScan ? "Rescan with Duelly" : "Duelly Scan"}</>}
          </Button>
        )}
        {duellyError && <p className="text-xs text-destructive">{duellyError}</p>}
        {duellyScan && (
          <div className="space-y-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-indigo-500" />Duelly Report</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className={`text-lg font-bold ${duellyScan.seoScore >= 60 ? "text-green-600" : duellyScan.seoScore >= 30 ? "text-amber-500" : "text-red-500"}`}>{duellyScan.seoScore}</p><p className="text-xs text-muted-foreground">SEO</p></div>
              <div><p className={`text-lg font-bold ${duellyScan.geoScore >= 60 ? "text-green-600" : duellyScan.geoScore >= 30 ? "text-amber-500" : "text-red-500"}`}>{duellyScan.geoScore}</p><p className="text-xs text-muted-foreground">GEO</p></div>
              <div><p className="text-lg font-bold text-foreground">{duellyScan.domainAuthority}</p><p className="text-xs text-muted-foreground">DA</p></div>
            </div>
            {duellyScan.criticalIssues?.length > 0 && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Issues: </span>{duellyScan.criticalIssues.slice(0, 3).join(", ")}{duellyScan.criticalIssues.length > 3 && ` +${duellyScan.criticalIssues.length - 3} more`}</div>}
          </div>
        )}

        {/* GBP Audit */}
        <Button onClick={handleGBPAudit} disabled={scanningGBP} variant="outline" size="sm" className="w-full gap-2">
          {scanningGBP ? <><Loader2 className="w-4 h-4 animate-spin" /> Auditing Google Profile...</> : <><MapPinned className="w-4 h-4" /> {gbpAudit ? "Re-audit Google Business" : "Google Business Audit"}</>}
        </Button>
        {gbpAudit && (
          <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><MapPinned className="w-3.5 h-3.5 text-blue-500" />Google Business Score</p>
              <span className={`text-sm font-bold ${gbpAudit.completenessScore >= 70 ? "text-green-600" : gbpAudit.completenessScore >= 40 ? "text-amber-500" : "text-red-500"}`}>{gbpAudit.completenessScore}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className={gbpAudit.hasHours ? "text-green-600" : "text-red-500"}>{gbpAudit.hasHours ? "✓" : "✗"} Hours</span>
              <span className={gbpAudit.hasPhone ? "text-green-600" : "text-red-500"}>{gbpAudit.hasPhone ? "✓" : "✗"} Phone</span>
              <span className={gbpAudit.hasWebsite ? "text-green-600" : "text-red-500"}>{gbpAudit.hasWebsite ? "✓" : "✗"} Website</span>
              <span className={gbpAudit.hasDescription ? "text-green-600" : "text-red-500"}>{gbpAudit.hasDescription ? "✓" : "✗"} Description</span>
              <span className={gbpAudit.photoCount >= 5 ? "text-green-600" : gbpAudit.photoCount > 0 ? "text-amber-500" : "text-red-500"}>{gbpAudit.photoCount > 0 ? "✓" : "✗"} {gbpAudit.photoCount} Photos</span>
              <span className={gbpAudit.reviewCount >= 5 ? "text-green-600" : gbpAudit.reviewCount > 0 ? "text-amber-500" : "text-red-500"}>{gbpAudit.reviewCount > 0 ? "✓" : "✗"} {gbpAudit.reviewCount} Reviews</span>
            </div>
            {gbpAudit.issues?.length > 0 && <div className="text-xs text-muted-foreground">{gbpAudit.issues.slice(0, 3).map((issue: string, i: number) => <p key={i}>• {issue}</p>)}</div>}
          </div>
        )}

        {/* Report & Email */}
        {(analysis || gbpAudit || duellyScan) && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleGenerateReport} disabled={generatingReport} variant="outline" size="sm" className="gap-1.5">
              {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-3.5 h-3.5" /> Report</>}
            </Button>
            <Button onClick={() => setShowEmailModal(true)} variant="outline" size="sm" className="gap-1.5"><Mail className="w-3.5 h-3.5" /> Draft Email</Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotes(!showNotes)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${showNotes || notes ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
              <MessageSquare className="w-3 h-3" />{notes ? "Notes" : "Add Note"}
            </button>
            {onBlock && (
              <button onClick={() => { addToBlocklist(biz.name); onBlock(biz.name) }} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Block this business">
                <EyeOff className="w-3 h-3" />Block
              </button>
            )}
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => handleSetStatus("dismissed")} className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${isDismissed ? "bg-destructive text-destructive-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <Ban className="w-3 h-3" />Dismiss
            </button>
            <button onClick={() => handleSetStatus("prospect")} className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${isProspect ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <Star className={`w-3 h-3 ${isProspect ? "fill-primary-foreground" : ""}`} />Prospect
            </button>
            <button onClick={() => handleSetStatus("priority")} className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${isPriority ? "bg-amber-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <Flame className={`w-3 h-3 ${isPriority ? "fill-white" : ""}`} />Priority
            </button>
          </div>

          {/* Service Tags */}
          <div className="grid grid-cols-3 gap-1.5">
            {SERVICE_TAGS.map(tag => (
              <button key={tag.id} onClick={() => { dbToggleServiceTag(biz.id, tag.id, serviceTags).then(setServiceTags); onProspectChange?.() }}
                className={`text-xs font-medium py-1.5 rounded-md transition-colors ${serviceTags.includes(tag.id) ? `${tag.color} text-white` : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                {tag.label}
              </button>
            ))}
          </div>

          {/* Pipeline */}
          <div className="border-t border-border/50 pt-2 mt-1">
            <p className="text-xs text-muted-foreground mb-1.5">Pipeline</p>
            <div className="grid grid-cols-5 gap-1">
              {(["contacted", "meeting", "proposal", "won", "lost"] as PipelineStage[]).map(s => {
                const cfg: Record<string, { label: string; color: string; active: string }> = {
                  contacted: { label: "Contacted", color: "bg-muted/50 text-muted-foreground", active: "bg-blue-500 text-white" },
                  meeting: { label: "Meeting", color: "bg-muted/50 text-muted-foreground", active: "bg-violet-500 text-white" },
                  proposal: { label: "Proposal", color: "bg-muted/50 text-muted-foreground", active: "bg-amber-500 text-white" },
                  won: { label: "Won", color: "bg-muted/50 text-muted-foreground", active: "bg-green-600 text-white" },
                  lost: { label: "Lost", color: "bg-muted/50 text-muted-foreground", active: "bg-red-500 text-white" },
                }
                const c = cfg[s]
                return (
                  <button key={s} onClick={() => { const ns = stage === s ? "none" : s; setStage(ns); updatePipelineStage(biz.id, ns) }}
                    className={`text-xs py-1 rounded-full transition-colors ${stage === s ? c.active : c.color} hover:opacity-80`}>{c.label}</button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Notes */}
        {showNotes && (
          <div className="pt-2">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => dbSaveNotes(biz.id, notes)}
              placeholder="Add notes about this business..." className="w-full text-xs p-2 rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" rows={3} />
          </div>
        )}
      </CardContent>

      {/* Dismiss Confirmation */}
      {showDismissConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDismissConfirm(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Dismiss this business?</h3>
            <p className="text-sm text-muted-foreground mb-4">"{biz.name}" will be moved to your dismissed list. You can undo this later.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDismissConfirm(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={confirmDismiss}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmailModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-1">Draft Email for {biz.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Select a pitch type and AI will generate a personalized email</p>
            <div className="flex gap-2 mb-4">
              {[{ id: "design", label: "Design" }, { id: "seo", label: "SEO" }, { id: "chatbot", label: "AI Chatbot" }, { id: "general", label: "General" }].map(type => (
                <Button key={type.id} variant={emailPitchType === type.id && emailDraft ? "default" : "outline"} size="sm" onClick={() => handleGenerateEmail(type.id)} disabled={generatingEmail}>
                  {generatingEmail && emailPitchType === type.id ? <Loader2 className="w-3 h-3 animate-spin" /> : type.label}
                </Button>
              ))}
            </div>
            {emailDraft && (
              <div className="space-y-3">
                <textarea value={emailDraft} onChange={e => setEmailDraft(e.target.value)} className="w-full text-sm p-3 rounded-md border border-border bg-background text-foreground min-h-[200px] resize-y focus:outline-none focus:ring-1 focus:ring-primary" />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(emailDraft)}>Copy to Clipboard</Button>
                  <Button size="sm" onClick={() => setShowEmailModal(false)}>Done</Button>
                </div>
              </div>
            )}
            {!emailDraft && !generatingEmail && <p className="text-sm text-muted-foreground text-center py-4">Click a pitch type above to generate an email</p>}
          </div>
        </div>
      )}
    </Card>
  )
}
