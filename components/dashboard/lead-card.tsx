"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin, Phone, ExternalLink, Building2, Globe, XCircle, Star, Map,
  Facebook, ScanSearch, Loader2, ShieldAlert, Smartphone, Clock, Wrench,
  AlertTriangle, MessageSquare, Ban, EyeOff, Flame, SearchCheck, Mail,
  TrendingUp, MapPinned, FileText,
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

function ScoreGauge({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  // MarketMojo palette: Vibrant Aqua (60+), Orange (30-59), Market Surge Red (<30)
  const hex = clamped >= 60 ? "#00A6BF" : clamped >= 30 ? "#F97316" : "#E05D5D";
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

function ScanSpinner() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[68px] h-[68px]">
        <svg className="w-full h-full animate-spin" style={{ animationDuration: "1.5s" }} viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={28} fill="none" strokeWidth="5" className="stroke-muted/20" />
          <circle cx="34" cy="34" r={28} fill="none" strokeWidth="5" strokeLinecap="round"
            stroke="#00A6BF" strokeDasharray={`${2 * Math.PI * 28 * 0.3} ${2 * Math.PI * 28 * 0.7}`} />
        </svg>
      </div>
      <p className="text-xs text-muted-foreground leading-tight text-center">Scanning...</p>
    </div>
  );
}

function getCacheAge(scannedAt?: string): string | null {
  if (!scannedAt) return null;
  const diff = Date.now() - new Date(scannedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Scanned just now";
  if (mins < 60) return `Scanned ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Scanned ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Scanned ${days}d ago`;
}

const presenceConfig: Record<string, { label: string; variant: "secondary" | "outline" | "destructive"; icon: any }> = {
  website: { label: "Has Website", variant: "secondary", icon: Globe },
  "facebook-only": { label: "Facebook Only", variant: "outline", icon: Facebook },
  "social-only": { label: "Social Only", variant: "outline", icon: Globe },
  none: { label: "No Online Presence", variant: "destructive", icon: XCircle },
}

// Unified business interface that works with both API results and DB records
export interface CardBusiness {
  id: string
  name: string
  address: string
  phone?: string
  website?: string
  facebook?: string
  socialUrl?: string
  hasWebsite?: boolean
  webPresence?: string
  rating?: number
  reviewCount?: number
  category?: string
  googleMapsUri?: string
  source?: string
  status?: BusinessStatus
  analysis?: SiteAnalysis | null
  duellyScan?: DuellyScanResult | null
  gbpAudit?: GBPAudit | null
  notes?: string
  pipelineStage?: PipelineStage
  serviceTags?: string[]
  emails?: string[]
}

interface LeadCardProps {
  business: CardBusiness
  onProspectChange?: () => void
  onBlock?: (name: string) => void
  customServiceTags?: { id: string; label: string; color: string }[]
  customPipelineStages?: { id: string; label: string; color: string }[]
  scanningExternal?: boolean
  onScanComplete?: (id: string, result: DuellyScanResult) => void
}

export function LeadCard({ business, onProspectChange, onBlock, customServiceTags, customPipelineStages, scanningExternal, onScanComplete }: LeadCardProps) {
  const wp = business.webPresence || "none"
  const presence = presenceConfig[wp] || presenceConfig.none
  const PresenceIcon = presence.icon
  const canAnalyze = wp === "website" && business.website

  const [status, setStatus] = useState<BusinessStatus>(business.status || "neutral")
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(business.analysis || null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [notes, setNotes] = useState(business.notes || "")
  const [showNotes, setShowNotes] = useState(!!business.notes)
  const [stage, setStage] = useState<PipelineStage>(business.pipelineStage || "none")
  const [serviceTags, setServiceTags] = useState<string[]>(business.serviceTags || [])
  const [emails, setEmails] = useState<string[]>(business.emails || [])
  const [findingEmail, setFindingEmail] = useState(false)
  const [emailNotFound, setEmailNotFound] = useState(false)
  const [manualEmail, setManualEmail] = useState("")
  const [editingEmail, setEditingEmail] = useState(false)
  const [duellyScan, setDuellyScan] = useState<DuellyScanResult | null>(business.duellyScan || null)
  const [scanningDuelly, setScanningDuelly] = useState(false)
  const [duellyError, setDuellyError] = useState<string | null>(null)

  // Sync scan data from parent (for batch scanning)
  useEffect(() => {
    if (business.duellyScan && !duellyScan) setDuellyScan(business.duellyScan)
  }, [business.duellyScan])
  const [duellyCooldown, setDuellyCooldown] = useState(0)
  const [gbpAudit, setGbpAudit] = useState<GBPAudit | null>(business.gbpAudit || null)
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

  // --- Handlers ---

  const handleAnalyze = async () => {
    if (!business.website) return
    setAnalyzing(true); setAnalyzeError(null)
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: business.website }) })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setAnalysis(data)
      dbSaveAnalysis(business.id, data)
      if (data.emails?.length) {
        const merged = await dbSaveEmails(business.id, data.emails, emails)
        setEmails(merged)
      }
    } catch { setAnalyzeError("Could not analyze this site") }
    setAnalyzing(false)
  }

  const handleFindEmail = async () => {
    setFindingEmail(true); setEmailNotFound(false)
    try {
      const res = await fetch("/api/find-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: business.name, address: business.address }) })
      if (res.ok) {
        const data = await res.json()
        if (data.emails?.length) {
          const merged = await dbSaveEmails(business.id, data.emails, emails)
          setEmails(merged)
        } else { setEmailNotFound(true) }
      } else { setEmailNotFound(true) }
    } catch { setEmailNotFound(true) }
    setFindingEmail(false)
  }

  const handleDuellyScan = async () => {
    if (!business.website) return
    setScanningDuelly(true); setDuellyError(null)
    try {
      const res = await fetch("/api/duelly-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: business.website }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Scan failed") }
      const data = await res.json()
      setDuellyScan(data); dbSaveDuellyScan(business.id, data)
    } catch (err: any) { setDuellyError(err.message || "Scan failed") }
    setScanningDuelly(false)
  }

  const handleGBPAudit = async () => {
    setScanningGBP(true)
    try {
      const res = await fetch("/api/gbp-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: business.name, address: business.address }) })
      if (res.ok) { const data = await res.json(); setGbpAudit(data); dbSaveGBPAudit(business.id, data) }
    } catch {}
    setScanningGBP(false)
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const logoUrl = typeof window !== "undefined" ? localStorage.getItem("marketmojo_user_logo") : null
      const companyName = typeof window !== "undefined" ? localStorage.getItem("marketmojo_company_name") : null
      const res = await fetch("/api/generate-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: { ...business, analysis, duellyScan, gbpAudit, serviceTags }, companyName, logoUrl }) })
      if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `audit-${business.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`; a.click(); URL.revokeObjectURL(url) }
    } catch {}
    setGeneratingReport(false)
  }

  const handleGenerateEmail = async (pitchType: string) => {
    setGeneratingEmail(true); setEmailPitchType(pitchType)
    try {
      const companyName = typeof window !== "undefined" ? localStorage.getItem("marketmojo_company_name") : null
      const res = await fetch("/api/generate-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: { ...business, analysis, duellyScan, gbpAudit }, pitchType, companyName }) })
      if (res.ok) { const data = await res.json(); setEmailDraft(data.email) }
    } catch {}
    setGeneratingEmail(false)
  }

  const handleSetStatus = async (newStatus: BusinessStatus) => {
    if (newStatus === "dismissed" && status !== "dismissed") { setShowDismissConfirm(true); return }
    if (status === newStatus) { setStatus("neutral"); await updateBusinessStatus(business.id, "neutral") }
    else { setStatus(newStatus); await updateBusinessStatus(business.id, newStatus) }
    onProspectChange?.()
  }

  const confirmDismiss = async () => {
    setStatus("dismissed"); setShowDismissConfirm(false); setHidden(true)
    await updateBusinessStatus(business.id, "dismissed")
    onProspectChange?.()
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
            <h3 className="font-semibold text-foreground truncate min-w-0">{business.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {business.category && <p className="text-sm text-muted-foreground">{business.category}</p>}
            <Badge variant={presence.variant} className="shrink-0 gap-1">
              <PresenceIcon className="w-3 h-3" /> {presence.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {business.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{business.rating}</span>
            {(business.reviewCount || 0) > 0 && <span className="text-sm text-muted-foreground">({business.reviewCount} reviews)</span>}
          </div>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{business.address}</span></div>
          {business.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 shrink-0" /><a href={`tel:${business.phone}`} className="hover:text-primary transition-colors">{business.phone}</a></div>}
          {business.website && <div className="flex items-center gap-2 text-muted-foreground"><ExternalLink className="w-4 h-4 shrink-0" /><a href={business.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">{business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></div>}
          {business.facebook && <div className="flex items-center gap-2 text-muted-foreground"><Facebook className="w-4 h-4 shrink-0" /><a href={business.facebook} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">Facebook Page</a></div>}
          {business.socialUrl && <div className="flex items-center gap-2 text-muted-foreground"><Globe className="w-4 h-4 shrink-0" /><a href={business.socialUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary transition-colors">{business.socialUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></div>}
          {business.googleMapsUri && <div className="flex items-center gap-2 text-muted-foreground"><Map className="w-4 h-4 shrink-0" /><a href={business.googleMapsUri} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">View on Google Maps</a></div>}
        </div>

        {/* Emails */}
        {emails.length > 0 && !editingEmail && (
          <div className="space-y-1">
            {emails.map((email) => (
              <div key={email} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-green-500" />
                <a href={`mailto:${email}`} className="truncate hover:text-primary transition-colors">{email}</a>
                <button onClick={() => setEditingEmail(true)} className="text-xs text-muted-foreground hover:text-primary shrink-0">Edit</button>
              </div>
            ))}
          </div>
        )}
        {emails.length === 0 && !editingEmail && (
          <>{emailNotFound ? (
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0 text-muted-foreground" /><span className="text-xs text-muted-foreground">No email found</span><button onClick={() => setEditingEmail(true)} className="text-xs text-primary hover:underline">Add manually</button></div>
          ) : (
            <Button onClick={handleFindEmail} disabled={findingEmail} variant="outline" size="sm" className="w-full gap-2">
              {findingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding email...</> : <><Mail className="w-4 h-4" /> Find Email</>}
            </Button>
          )}</>
        )}
        {editingEmail && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && manualEmail.trim()) { dbSaveEmails(business.id, [manualEmail.trim()], emails).then(setEmails); setManualEmail(""); setEditingEmail(false) } if (e.key === "Escape") setEditingEmail(false) }}
              placeholder="Enter email address..." className="flex-1 text-sm p-1 rounded border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" autoFocus />
            <button onClick={() => { if (manualEmail.trim()) { dbSaveEmails(business.id, [manualEmail.trim()], emails).then(setEmails); setManualEmail("") } setEditingEmail(false) }} className="text-xs text-primary hover:underline">Save</button>
            <button onClick={() => setEditingEmail(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
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
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><ScanSearch className="w-3.5 h-3.5 text-primary" /> Site Analysis</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.platform && <Badge variant="secondary" className="text-xs gap-1"><Wrench className="w-3 h-3" />{analysis.platform}</Badge>}
              {(analysis as any).isYellowPages && <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />Yellow Pages Site</Badge>}
              {analysis.estimatedAge && <Badge variant="outline" className="text-xs gap-1"><Clock className="w-3 h-3" />{analysis.estimatedAge}</Badge>}
              {!analysis.hasSSL && <Badge variant="destructive" className="text-xs gap-1"><ShieldAlert className="w-3 h-3" />No SSL</Badge>}
              {!analysis.isMobileFriendly && <Badge variant="destructive" className="text-xs gap-1"><Smartphone className="w-3 h-3" />Not Mobile Friendly</Badge>}
              {analysis.flags?.filter((f) => !f.includes("mobile") && !f.includes("SSL") && !f.includes("reach")).map((flag) => <Badge key={flag} variant="outline" className="text-xs">{flag}</Badge>)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>
            {(analysis as any).aiAssessment && (
              <div className="pt-2 border-t border-border/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Refresh Score</span>
                  <span className={`text-xs font-bold ${(analysis as any).aiAssessment.score <= 3 ? "text-red-500" : (analysis as any).aiAssessment.score <= 6 ? "text-amber-500" : "text-green-500"}`}>
                    {(analysis as any).aiAssessment.score}/10{(analysis as any).aiAssessment.needsRefresh && " — Needs Refresh"}
                  </span>
                </div>
                {(analysis as any).aiAssessment.reasons?.length > 0 && <ul className="text-xs text-muted-foreground space-y-0.5">{(analysis as any).aiAssessment.reasons.map((r: string, i: number) => <li key={i}>• {r}</li>)}</ul>}
                {(analysis as any).aiAssessment.recommendation && <p className="text-xs text-primary font-medium italic">"{(analysis as any).aiAssessment.recommendation}"</p>}
              </div>
            )}
          </div>
        )}

        {/* Site Scan */}
        {canAnalyze && !scanningExternal && (
          <Button onClick={handleDuellyScan} disabled={scanningDuelly} variant="outline" size="sm" className="w-full gap-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30">
            {scanningDuelly ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning site...</> : <><TrendingUp className="w-4 h-4" /> {duellyScan ? "Rescan Site" : "SEO & AI Scan"}</>}
          </Button>
        )}
        {duellyError && <p className="text-xs text-destructive">{duellyError}</p>}
        {(scanningDuelly || scanningExternal) && !duellyScan && (
          <div className="space-y-3 p-3 rounded-lg border" style={{ backgroundColor: "rgba(0,166,191,0.05)", borderColor: "rgba(0,166,191,0.2)" }}>
            <div className="grid grid-cols-3 gap-2">
              <ScanSpinner />
              <ScanSpinner />
              <ScanSpinner />
            </div>
          </div>
        )}
        {duellyScan && (
          <div className="space-y-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-indigo-500" /> Site Report</p>
              {duellyScan.scannedAt && <p className="text-[10px] text-muted-foreground/60">{getCacheAge(duellyScan.scannedAt)}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <ScoreGauge value={duellyScan.seoScore} label="SEO" />
              <ScoreGauge value={duellyScan.geoScore} label="AI Visibility" sublabel="(GEO)" />
              <ScoreGauge value={duellyScan.domainAuthority} label="DA" />
            </div>
            {duellyScan.criticalIssues?.length > 0 && <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Issues: </span>{duellyScan.criticalIssues.slice(0, 3).join(", ")}{duellyScan.criticalIssues.length > 3 && ` +${duellyScan.criticalIssues.length - 3} more`}</div>}
            <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground/50">Powered by <img src="/duelly.png" alt="Duelly" className="h-3 inline-block" /></p>
          </div>
        )}

        {/* GBP Audit */}
        <Button onClick={handleGBPAudit} disabled={scanningGBP} variant="outline" size="sm" className="w-full gap-2">
          {scanningGBP ? <><Loader2 className="w-4 h-4 animate-spin" /> Auditing Google Profile...</> : <><MapPinned className="w-4 h-4" /> {gbpAudit ? "Re-audit Google Business" : "Google Business Audit"}</>}
        </Button>
        {gbpAudit && (
          <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5"><MapPinned className="w-3.5 h-3.5 text-blue-500" /> Google Business Score</p>
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
            {gbpAudit.issues?.length > 0 && <div className="text-xs text-muted-foreground">{gbpAudit.issues.slice(0, 3).map((issue, i) => <p key={i}>• {issue}</p>)}</div>}
          </div>
        )}

        {/* Report & Email */}
        {(analysis || gbpAudit || duellyScan) && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleGenerateReport} disabled={generatingReport} variant="outline" size="sm" className="gap-1.5">
              {generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-3.5 h-3.5" /> Report</>}
            </Button>
            <Button onClick={() => setShowEmailModal(true)} variant="outline" size="sm" className="gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Draft Email
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotes(!showNotes)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${showNotes || notes ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"}`}>
              <MessageSquare className="w-3 h-3" /> {notes ? "Notes" : "Add Note"}
            </button>
            {onBlock && (
              <button onClick={() => { addToBlocklist(business.name); onBlock(business.name) }} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Block this business from future results">
                <EyeOff className="w-3 h-3" /> Block
              </button>
            )}
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={() => handleSetStatus("dismissed")} className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${isDismissed ? "bg-destructive text-destructive-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <Ban className="w-3 h-3" /> Dismiss
            </button>
            <button onClick={() => handleSetStatus("prospect")} className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${isProspect ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <Star className={`w-3 h-3 ${isProspect ? "fill-primary-foreground" : ""}`} /> Prospect
            </button>
            <button onClick={() => handleSetStatus("priority")} className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${isPriority ? "bg-amber-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <Flame className={`w-3 h-3 ${isPriority ? "fill-white" : ""}`} /> Priority
            </button>
          </div>

          {/* Service Tags */}
          {(customServiceTags || SERVICE_TAGS).length > 0 && (
            <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${Math.min((customServiceTags || SERVICE_TAGS).length, 3)}, 1fr)` }}>
              {(customServiceTags || SERVICE_TAGS).map((tag) => (
                <button key={tag.id} onClick={async () => { const newTags = await dbToggleServiceTag(business.id, tag.id, serviceTags); setServiceTags(newTags); onProspectChange?.() }}
                  className={`text-xs font-medium py-1.5 rounded-md transition-colors ${serviceTags.includes(tag.id) ? `${tag.color} text-white` : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                  {tag.label}
                </button>
              ))}
            </div>
          )}

          {/* Pipeline */}
          {(customPipelineStages || []).length > 0 && (
            <div className="border-t border-border/50 pt-2 mt-1">
              <p className="text-xs text-muted-foreground mb-1.5">Pipeline</p>
              <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${Math.min((customPipelineStages || []).length, 5)}, 1fr)` }}>
                {(customPipelineStages || []).map((s) => (
                  <button key={s.id} onClick={async () => { const newStage = stage === s.id ? "none" : s.id; setStage(newStage as PipelineStage); await updatePipelineStage(business.id, newStage as PipelineStage) }}
                    className={`text-xs py-1 rounded-full transition-colors ${stage === s.id ? `${s.color} text-white` : "bg-muted/50 text-muted-foreground"} hover:opacity-80`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {showNotes && (
          <div className="pt-2">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => dbSaveNotes(business.id, notes)}
              placeholder="Add notes about this business..." className="w-full text-xs p-2 rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary" rows={3} />
          </div>
        )}
      </CardContent>

      {/* Dismiss Confirmation */}
      {showDismissConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDismissConfirm(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Dismiss this business?</h3>
            <p className="text-sm text-muted-foreground mb-4">"{business.name}" will be moved to your dismissed list. You can undo this later.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDismissConfirm(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={confirmDismiss}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Draft Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmailModal(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-1">Draft Email for {business.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Select a pitch type and AI will generate a personalized email</p>
            <div className="flex gap-2 mb-4">
              {[{ id: "design", label: "Design" }, { id: "seo", label: "SEO" }, { id: "chatbot", label: "AI Chatbot" }, { id: "general", label: "General" }].map((type) => (
                <Button key={type.id} variant={emailPitchType === type.id && emailDraft ? "default" : "outline"} size="sm" onClick={() => handleGenerateEmail(type.id)} disabled={generatingEmail}>
                  {generatingEmail && emailPitchType === type.id ? <Loader2 className="w-3 h-3 animate-spin" /> : type.label}
                </Button>
              ))}
            </div>
            {emailDraft && (
              <div className="space-y-3">
                <textarea value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} className="w-full text-sm p-3 rounded-md border border-border bg-background text-foreground min-h-[200px] resize-y focus:outline-none focus:ring-1 focus:ring-primary" />
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

