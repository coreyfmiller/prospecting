"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Phone,
  ExternalLink,
  Building2,
  Globe,
  XCircle,
  Star,
  Map,
  Facebook,
  ScanSearch,
  Loader2,
  ShieldAlert,
  Smartphone,
  Clock,
  Wrench,
  AlertTriangle,
  MessageSquare,
  Ban,
  EyeOff,
  Flame,
  SearchCheck,
  Mail,
  TrendingUp,
} from "lucide-react"
import type { Business } from "@/app/api/search/route"
import type { SiteAnalysis } from "@/app/api/analyze/route"
import type { DuellyScanResult } from "@/app/api/duelly-scan/route"
import { saveAnalysis, toggleProspect, togglePriority, toggleDismiss, saveNotes, setPipelineStage, toggleServiceTag, saveEmails, saveDuellyScan, SERVICE_TAGS, type PipelineStage } from "@/lib/storage"
import { addToBlocklist } from "@/lib/blocklist"

const presenceConfig = {
  website: { label: "Has Website", variant: "secondary" as const, icon: Globe },
  "facebook-only": { label: "Facebook Only", variant: "outline" as const, icon: Facebook },
  "social-only": { label: "Social Only", variant: "outline" as const, icon: Globe },
  none: { label: "No Online Presence", variant: "destructive" as const, icon: XCircle },
}

interface LeadCardProps {
  business: Business & { analysis?: SiteAnalysis; isProspect?: boolean; isPriority?: boolean; isDismissed?: boolean; notes?: string; pipelineStage?: PipelineStage; needsSEO?: boolean; serviceTags?: string[]; emails?: string[]; rankings?: { query: string; position: number; date: string }[]; duellyScan?: DuellyScanResult }
  onProspectChange?: () => void
  onBlock?: (name: string) => void
}

export function LeadCard({ business, onProspectChange, onBlock }: LeadCardProps) {
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(business.analysis || null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [isProspect, setIsProspect] = useState(business.isProspect || false)
  const [isPriority, setIsPriority] = useState(business.isPriority || false)
  const [isDismissed, setIsDismissed] = useState(business.isDismissed || false)
  const [notes, setNotes] = useState(business.notes || "")
  const [showNotes, setShowNotes] = useState(!!business.notes)
  const [stage, setStage] = useState<PipelineStage>(business.pipelineStage || "none")
  const [serviceTags, setServiceTags] = useState<string[]>(business.serviceTags || (business.needsSEO ? ["pitch-seo"] : []))
  const [emails, setEmails] = useState<string[]>(business.emails || (business.analysis?.emails || []))
  const [findingEmail, setFindingEmail] = useState(false)
  const [rankings] = useState(business.rankings || [])
  const [duellyScan, setDuellyScan] = useState<DuellyScanResult | null>(business.duellyScan || null)
  const [scanningDuelly, setScanningDuelly] = useState(false)
  const [duellyError, setDuellyError] = useState<string | null>(null)

  const presence = presenceConfig[business.webPresence]
  const PresenceIcon = presence.icon

  const canAnalyze = business.webPresence === "website" && business.website

  const handleAnalyze = async () => {
    if (!business.website) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: business.website }),
      })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setAnalysis(data)
      // Persist to localStorage
      saveAnalysis(business.id, data)
      // Save any emails found
      if (data.emails?.length) {
        saveEmails(business.id, data.emails)
        setEmails((prev) => Array.from(new Set([...prev, ...data.emails])))
      }
    } catch {
      setAnalyzeError("Could not analyze this site")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFindEmail = async () => {
    setFindingEmail(true)
    try {
      const res = await fetch("/api/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: business.name, address: business.address }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.emails?.length) {
          saveEmails(business.id, data.emails)
          setEmails((prev) => Array.from(new Set([...prev, ...data.emails])))
        }
      }
    } catch {}
    setFindingEmail(false)
  }

  const handleDuellyScan = async () => {
    if (!business.website) return
    setScanningDuelly(true)
    setDuellyError(null)
    try {
      const res = await fetch("/api/duelly-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: business.website }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Scan failed")
      }
      const data = await res.json()
      setDuellyScan(data)
      saveDuellyScan(business.id, data)
    } catch (err: any) {
      setDuellyError(err.message || "Duelly scan failed")
    }
    setScanningDuelly(false)
  }

  const handleToggleProspect = () => {
    const newVal = toggleProspect(business.id)
    setIsProspect(newVal)
    if (newVal) { setIsDismissed(false); setIsPriority(false) }
    onProspectChange?.()
  }

  const handleTogglePriority = () => {
    const newVal = togglePriority(business.id)
    setIsPriority(newVal)
    if (newVal) { setIsProspect(false); setIsDismissed(false) }
    onProspectChange?.()
  }

  const handleToggleDismiss = () => {
    const newVal = toggleDismiss(business.id)
    setIsDismissed(newVal)
    if (newVal) { setIsProspect(false); setIsPriority(false) }
    onProspectChange?.()
  }

  const cardBg = isPriority
    ? "bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-400 dark:ring-amber-700"
    : isProspect
    ? "bg-green-50 dark:bg-green-950/30 ring-1 ring-green-300 dark:ring-green-800"
    : isDismissed
    ? "bg-red-50 dark:bg-red-950/30 ring-1 ring-red-300 dark:ring-red-800 opacity-75"
    : "bg-card"

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 border-border/60 hover:border-primary/30 overflow-hidden ${cardBg}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="font-semibold text-foreground truncate min-w-0">
              {business.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {business.category && (
              <p className="text-sm text-muted-foreground">{business.category}</p>
            )}
            <Badge variant={presence.variant} className="shrink-0 gap-1">
              <PresenceIcon className="w-3 h-3" />
              {presence.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {business.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">{business.rating}</span>
            {business.reviewCount && (
              <span className="text-sm text-muted-foreground">
                ({business.reviewCount} reviews)
              </span>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{business.address}</span>
          </div>
          {business.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <a href={`tel:${business.phone}`} className="hover:text-primary transition-colors">
                {business.phone}
              </a>
            </div>
          )}
          {business.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ExternalLink className="w-4 h-4 shrink-0" />
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-primary transition-colors"
              >
                {business.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </div>
          )}
          {business.facebook && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Facebook className="w-4 h-4 shrink-0" />
              <a
                href={business.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-primary transition-colors"
              >
                Facebook Page
              </a>
            </div>
          )}
          {business.socialUrl && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4 shrink-0" />
              <a
                href={business.socialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-primary transition-colors"
              >
                {business.socialUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </div>
          )}
          {business.googleMapsUri && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Map className="w-4 h-4 shrink-0" />
              <a
                href={business.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                View on Google Maps
              </a>
            </div>
          )}
        </div>

        {/* Emails */}
        {emails.length > 0 && (
          <div className="space-y-1">
            {emails.map((email) => (
              <div key={email} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-green-500" />
                <a href={`mailto:${email}`} className="truncate hover:text-primary transition-colors">{email}</a>
              </div>
            ))}
          </div>
        )}

        {/* Find Email Button */}
        {emails.length === 0 && (
          <Button onClick={handleFindEmail} disabled={findingEmail} variant="outline" size="sm" className="w-full gap-2">
            {findingEmail ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Finding email...</>
            ) : (
              <><Mail className="w-4 h-4" /> Find Email</>
            )}
          </Button>
        )}

        {/* Rankings */}
        {rankings.length > 0 && (
          <div className="space-y-1 p-2 bg-muted/30 rounded-md">
            <p className="text-xs font-medium text-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Rankings
            </p>
            {rankings.map((r) => (
              <div key={r.query} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground truncate mr-2">"{r.query}"</span>
                <Badge variant={r.position <= 3 ? "default" : r.position <= 10 ? "secondary" : "outline"} className="shrink-0">
                  #{r.position}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Analyze Button */}
        {canAnalyze && !analysis && (
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            {analyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing site...</>
            ) : (
              <><ScanSearch className="w-4 h-4" /> Analyze Website</>
            )}
          </Button>
        )}

        {analyzeError && (
          <p className="text-xs text-destructive">{analyzeError}</p>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <ScanSearch className="w-3.5 h-3.5 text-primary" />
              Site Analysis
            </p>

            <div className="flex flex-wrap gap-1.5">
              {analysis.platform && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Wrench className="w-3 h-3" />
                  {analysis.platform}
                </Badge>
              )}
              {analysis.isYellowPages && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Yellow Pages Site
                </Badge>
              )}
              {analysis.estimatedAge && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  {analysis.estimatedAge}
                </Badge>
              )}
              {!analysis.hasSSL && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  No SSL
                </Badge>
              )}
              {!analysis.isMobileFriendly && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <Smartphone className="w-3 h-3" />
                  Not Mobile Friendly
                </Badge>
              )}
              {analysis.flags
                .filter((f) => !f.includes("mobile") && !f.includes("SSL") && !f.includes("reach"))
                .map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs">
                    {flag}
                  </Badge>
                ))}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        )}

        {/* Duelly Scan Button */}
        {canAnalyze && (
          <Button
            onClick={handleDuellyScan}
            disabled={scanningDuelly}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            {scanningDuelly ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Running Duelly scan...</>
            ) : (
              <><TrendingUp className="w-4 h-4" /> {duellyScan ? "Rescan with Duelly" : "Duelly Scan"}</>
            )}
          </Button>
        )}

        {duellyError && (
          <p className="text-xs text-destructive">{duellyError}</p>
        )}

        {/* Duelly Scan Results */}
        {duellyScan && (
          <div className="space-y-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              Duelly Report
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className={`text-lg font-bold ${duellyScan.seoScore >= 60 ? "text-green-600" : duellyScan.seoScore >= 30 ? "text-amber-500" : "text-red-500"}`}>
                  {duellyScan.seoScore}
                </p>
                <p className="text-xs text-muted-foreground">SEO</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${duellyScan.geoScore >= 60 ? "text-green-600" : duellyScan.geoScore >= 30 ? "text-amber-500" : "text-red-500"}`}>
                  {duellyScan.geoScore}
                </p>
                <p className="text-xs text-muted-foreground">GEO</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{duellyScan.domainAuthority}</p>
                <p className="text-xs text-muted-foreground">DA</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {duellyScan.pageSpeedMobile !== null && (
                <Badge variant={duellyScan.pageSpeedMobile >= 50 ? "secondary" : "destructive"} className="text-xs">
                  Mobile: {duellyScan.pageSpeedMobile}/100
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {duellyScan.totalBacklinks} backlinks
              </Badge>
              <Badge variant="outline" className="text-xs">
                {duellyScan.linkingDomains} domains
              </Badge>
              {duellyScan.spamScore > 30 && (
                <Badge variant="destructive" className="text-xs">
                  Spam: {duellyScan.spamScore}%
                </Badge>
              )}
            </div>
            {duellyScan.criticalIssues.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Issues: </span>
                {duellyScan.criticalIssues.slice(0, 3).join(", ")}
                {duellyScan.criticalIssues.length > 3 && ` +${duellyScan.criticalIssues.length - 3} more`}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {business.source === "both"
                ? "Google + Perplexity"
                : business.source === "google"
                ? "Google Places"
                : "Perplexity"}
            </Badge>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                showNotes || notes
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              {notes ? "Notes" : "Add Note"}
            </button>
            {onBlock && (
              <button
                onClick={() => {
                  addToBlocklist(business.name)
                  onBlock(business.name)
                }}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Block this business from future results"
              >
                <EyeOff className="w-3 h-3" />
                Block
              </button>
            )}
          </div>
          {/* Status Actions */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleToggleDismiss}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                isDismissed
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Ban className="w-3 h-3" />
              Dismiss
            </button>
            <button
              onClick={handleToggleProspect}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                isProspect
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Star className={`w-3 h-3 ${isProspect ? "fill-primary-foreground" : ""}`} />
              Prospect
            </button>
            <button
              onClick={handleTogglePriority}
              className={`flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                isPriority
                  ? "bg-amber-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Flame className={`w-3 h-3 ${isPriority ? "fill-white" : ""}`} />
              Priority
            </button>
          </div>

          {/* Service Tags */}
          <div className="grid grid-cols-3 gap-1.5">
            {SERVICE_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  const newTags = toggleServiceTag(business.id, tag.id)
                  setServiceTags(newTags)
                  onProspectChange?.()
                }}
                className={`text-xs font-medium py-1.5 rounded-md transition-colors ${
                  serviceTags.includes(tag.id)
                    ? `${tag.color} text-white`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Pipeline Stage */}
          <div className="grid grid-cols-5 gap-1">
            {(["contacted", "meeting", "proposal", "won", "lost"] as PipelineStage[]).map((s) => {
              const config: Record<string, { label: string; color: string; active: string }> = {
                contacted: { label: "Contacted", color: "bg-muted/50 text-muted-foreground", active: "bg-blue-500 text-white" },
                meeting: { label: "Meeting", color: "bg-muted/50 text-muted-foreground", active: "bg-violet-500 text-white" },
                proposal: { label: "Proposal", color: "bg-muted/50 text-muted-foreground", active: "bg-amber-500 text-white" },
                won: { label: "Won", color: "bg-muted/50 text-muted-foreground", active: "bg-green-600 text-white" },
                lost: { label: "Lost", color: "bg-muted/50 text-muted-foreground", active: "bg-red-500 text-white" },
              }
              const c = config[s]
              return (
                <button
                  key={s}
                  onClick={() => {
                    const newStage = stage === s ? "none" : s
                    setStage(newStage)
                    setPipelineStage(business.id, newStage)
                  }}
                  className={`text-xs py-1 rounded-full transition-colors ${stage === s ? c.active : c.color} hover:opacity-80`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {showNotes && (
          <div className="pt-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveNotes(business.id, notes)}
              placeholder="Add notes about this business..."
              className="w-full text-xs p-2 rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
