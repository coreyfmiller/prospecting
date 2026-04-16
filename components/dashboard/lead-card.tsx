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
} from "lucide-react"
import type { Business } from "@/app/api/search/route"
import type { SiteAnalysis } from "@/app/api/analyze/route"
import { saveAnalysis, toggleProspect, togglePriority, toggleDismiss, saveNotes, setPipelineStage, toggleServiceTag, SERVICE_TAGS, type PipelineStage } from "@/lib/storage"
import { addToBlocklist } from "@/lib/blocklist"

const presenceConfig = {
  website: { label: "Has Website", variant: "secondary" as const, icon: Globe },
  "facebook-only": { label: "Facebook Only", variant: "outline" as const, icon: Facebook },
  "social-only": { label: "Social Only", variant: "outline" as const, icon: Globe },
  none: { label: "No Online Presence", variant: "destructive" as const, icon: XCircle },
}

interface LeadCardProps {
  business: Business & { analysis?: SiteAnalysis; isProspect?: boolean; isPriority?: boolean; isDismissed?: boolean; notes?: string; pipelineStage?: PipelineStage; needsSEO?: boolean; serviceTags?: string[] }
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
    } catch {
      setAnalyzeError("Could not analyze this site")
    } finally {
      setAnalyzing(false)
    }
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDismiss}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors ${
                isDismissed
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              Dismiss
            </button>
            <button
              onClick={handleToggleProspect}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors ${
                isProspect
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isProspect ? "fill-primary-foreground" : ""}`} />
              Prospect
            </button>
            <button
              onClick={handleTogglePriority}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors ${
                isPriority
                  ? "bg-amber-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${isPriority ? "fill-white" : ""}`} />
              Priority
            </button>
            {SERVICE_TAGS.map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  const newTags = toggleServiceTag(business.id, tag.id)
                  setServiceTags(newTags)
                  onProspectChange?.()
                }}
                className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium px-1 py-1.5 rounded-md transition-colors ${
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
          <div className="flex items-center gap-1.5">
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
                  className={`flex-1 text-xs px-2 py-1 rounded-full transition-colors ${stage === s ? c.active : c.color} hover:opacity-80`}
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
