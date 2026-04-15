"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Phone,
  ExternalLink,
  Building2,
  Globe,
  XCircle,
  Star,
  Map,
} from "lucide-react"
import type { Business } from "@/app/api/search/route"

interface LeadCardProps {
  business: Business
}

export function LeadCard({ business }: LeadCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/60 hover:border-primary/30 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <h3 className="font-semibold text-foreground truncate">
                {business.name}
              </h3>
            </div>
            {business.category && (
              <p className="text-sm text-muted-foreground">{business.category}</p>
            )}
          </div>
          <Badge
            variant={business.hasWebsite ? "secondary" : "destructive"}
            className="shrink-0 gap-1"
          >
            {business.hasWebsite ? (
              <><Globe className="w-3 h-3" /> Has Website</>
            ) : (
              <><XCircle className="w-3 h-3" /> No Website</>
            )}
          </Badge>
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

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Badge variant="outline" className="text-xs">
            {business.source === "both"
              ? "Google + Perplexity"
              : business.source === "google"
              ? "Google Places"
              : "Perplexity"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
