"use client"

import { Badge } from "@/components/ui/badge"
import { Globe, Facebook, Smartphone, Zap, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type InfraTag = 
  | "no-website"
  | "facebook-only"
  | "non-mobile-responsive"
  | "slow-load-time"
  | "outdated-design"
  | "no-ssl"

interface InfrastructureTagsProps {
  tags: InfraTag[]
  compact?: boolean
}

const tagConfig: Record<InfraTag, { label: string; icon: React.ElementType; variant: "destructive" | "secondary" | "outline" }> = {
  "no-website": {
    label: "No Website Found",
    icon: Globe,
    variant: "destructive",
  },
  "facebook-only": {
    label: "Facebook Only",
    icon: Facebook,
    variant: "secondary",
  },
  "non-mobile-responsive": {
    label: "Non-Mobile Responsive",
    icon: Smartphone,
    variant: "destructive",
  },
  "slow-load-time": {
    label: "Slow Load Time",
    icon: Zap,
    variant: "secondary",
  },
  "outdated-design": {
    label: "Outdated Design",
    icon: AlertTriangle,
    variant: "outline",
  },
  "no-ssl": {
    label: "No SSL",
    icon: AlertTriangle,
    variant: "destructive",
  },
}

export function InfrastructureTags({ tags, compact = false }: InfrastructureTagsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", compact ? "max-w-[200px]" : "")}>
      {tags.map((tag) => {
        const config = tagConfig[tag]
        const Icon = config.icon
        return (
          <Badge
            key={tag}
            variant={config.variant}
            className={cn(
              "text-xs font-medium",
              config.variant === "destructive" && "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
              config.variant === "secondary" && "bg-warning/10 text-warning-foreground border-warning/20 hover:bg-warning/20"
            )}
          >
            <Icon className="w-3 h-3 mr-1" />
            {compact ? config.label.split(" ")[0] : config.label}
          </Badge>
        )
      })}
    </div>
  )
}
