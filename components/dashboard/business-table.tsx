"use client"

import type { CardBusiness } from "./lead-card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Globe, XCircle, Facebook, Phone, ExternalLink, Star, MapPin, Mail,
  TrendingUp, MapPinned,
} from "lucide-react"

const presenceConfig: Record<string, { label: string; variant: "secondary" | "outline" | "destructive"; icon: any }> = {
  website: { label: "Website", variant: "secondary", icon: Globe },
  "facebook-only": { label: "Facebook", variant: "outline", icon: Facebook },
  "social-only": { label: "Social", variant: "outline", icon: Globe },
  none: { label: "None", variant: "destructive", icon: XCircle },
}

function ScoreBadge({ value, label }: { value: number; label: string }) {
  const color = value >= 60 ? "text-green-600" : value >= 30 ? "text-amber-500" : "text-red-500"
  return (
    <span className={`text-xs font-bold ${color}`} title={label}>{value}</span>
  )
}

interface BusinessTableProps {
  businesses: CardBusiness[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleAll: () => void
  scanningIds?: Set<string>
}

export function BusinessTable({ businesses, selectedIds, onToggleSelect, onToggleAll, scanningIds }: BusinessTableProps) {
  const allSelected = businesses.length > 0 && selectedIds.size === businesses.length

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
              </TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Presence</TableHead>
              <TableHead className="text-center">SEO</TableHead>
              <TableHead className="text-center">GEO</TableHead>
              <TableHead className="text-center">DA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.map((b) => {
              const wp = b.webPresence || "none"
              const presence = presenceConfig[wp] || presenceConfig.none
              const PresenceIcon = presence.icon
              const isScanning = scanningIds?.has(b.id)

              return (
                <TableRow key={b.id} className={`group ${selectedIds.has(b.id) ? "bg-primary/5" : ""} ${isScanning ? "animate-pulse" : ""}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(b.id)}
                      onCheckedChange={() => onToggleSelect(b.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[160px]">
                      <p className="font-medium text-foreground text-sm truncate">{b.name}</p>
                      {b.category && <p className="text-xs text-muted-foreground">{b.category}</p>}
                      {b.rating && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-muted-foreground">{b.rating} ({b.reviewCount || 0})</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 min-w-[120px]">
                      {b.phone && (
                        <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <Phone className="w-3 h-3 shrink-0" /> {b.phone}
                        </a>
                      )}
                      {b.website && (
                        <a href={b.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[140px]">{b.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                        </a>
                      )}
                      {b.emails && b.emails.length > 0 && (
                        <a href={`mailto:${b.emails[0]}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <Mail className="w-3 h-3 shrink-0 text-green-500" />
                          <span className="truncate max-w-[140px]">{b.emails[0]}</span>
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={presence.variant} className="gap-1 text-xs">
                      <PresenceIcon className="w-3 h-3" /> {presence.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {b.duellyScan ? <ScoreBadge value={b.duellyScan.seoScore} label="SEO" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {b.duellyScan ? <ScoreBadge value={b.duellyScan.geoScore} label="GEO" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {b.duellyScan ? <ScoreBadge value={b.duellyScan.domainAuthority} label="DA" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {b.status === "priority" && <Badge className="bg-amber-500 text-white text-xs">Priority</Badge>}
                    {b.status === "prospect" && <Badge className="bg-primary text-primary-foreground text-xs">Prospect</Badge>}
                    {b.status === "dismissed" && <Badge variant="destructive" className="text-xs">Dismissed</Badge>}
                    {(!b.status || b.status === "neutral") && <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      {b.duellyScan?.criticalIssues && b.duellyScan.criticalIssues.length > 0 ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {b.duellyScan.criticalIssues.slice(0, 2).join(", ")}
                          {b.duellyScan.criticalIssues.length > 2 && ` +${b.duellyScan.criticalIssues.length - 2}`}
                        </p>
                      ) : b.scanError ? (
                        <p className="text-xs text-destructive truncate">{b.scanError}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {businesses.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No businesses to display</p>
      )}
    </div>
  )
}
