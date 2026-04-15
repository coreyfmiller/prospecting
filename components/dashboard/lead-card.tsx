"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DigitalHealthScore } from "./digital-health-score"
import { InfrastructureTags, type InfraTag } from "./infrastructure-tags"
import { Mail, Sparkles, MapPin, Phone, ExternalLink, Building2 } from "lucide-react"

export interface Lead {
  id: string
  businessName: string
  category: string
  address: string
  phone: string
  email?: string
  website?: string
  healthScore: number
  tags: InfraTag[]
  lastChecked: string
}

interface LeadCardProps {
  lead: Lead
  onGeneratePitch: (lead: Lead) => void
  onEmailLead: (lead: Lead) => void
}

export function LeadCard({ lead, onGeneratePitch, onEmailLead }: LeadCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/60 hover:border-primary/30 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <h3 className="font-semibold text-foreground truncate text-balance">
                {lead.businessName}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{lead.category}</p>
          </div>
          <DigitalHealthScore score={lead.healthScore} size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfrastructureTags tags={lead.tags} />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{lead.address}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4 shrink-0" />
            <span>{lead.phone}</span>
          </div>
          {lead.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ExternalLink className="w-4 h-4 shrink-0" />
              <a 
                href={lead.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="truncate hover:text-primary transition-colors"
              >
                {lead.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onGeneratePitch(lead)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            size="sm"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Generate Pitch
          </Button>
          <Button 
            onClick={() => onEmailLead(lead)}
            variant="outline"
            className="flex-1 border-primary/30 hover:bg-primary/10 hover:border-primary font-medium"
            size="sm"
          >
            <Mail className="w-4 h-4 mr-1.5" />
            Email Lead
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-right">
          Last checked: {lead.lastChecked}
        </p>
      </CardContent>
    </Card>
  )
}
