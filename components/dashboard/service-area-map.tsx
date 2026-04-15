"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Zone {
  id: string
  name: string
  color: string
  businesses: number
  active: boolean
}

const defaultZones: Zone[] = [
  { id: "downtown", name: "Downtown", color: "bg-primary", businesses: 234, active: true },
  { id: "midtown", name: "Midtown", color: "bg-chart-2", businesses: 189, active: true },
  { id: "northside", name: "Northside", color: "bg-chart-3", businesses: 156, active: false },
  { id: "southside", name: "Southside", color: "bg-chart-4", businesses: 178, active: false },
  { id: "eastside", name: "Eastside", color: "bg-chart-5", businesses: 145, active: true },
]

interface ServiceAreaMapProps {
  onZoneChange?: (activeZones: string[]) => void
}

export function ServiceAreaMap({ onZoneChange }: ServiceAreaMapProps) {
  const [zones, setZones] = useState(defaultZones)

  const toggleZone = (zoneId: string) => {
    const updated = zones.map((z) =>
      z.id === zoneId ? { ...z, active: !z.active } : z
    )
    setZones(updated)
    onZoneChange?.(updated.filter((z) => z.active).map((z) => z.id))
  }

  const activeZones = zones.filter((z) => z.active)
  const totalBusinesses = activeZones.reduce((acc, z) => acc + z.businesses, 0)

  return (
    <Card className="bg-card border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Service Area Filter
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {totalBusinesses} businesses in selected areas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Map Visualization */}
          <div className="relative flex-1 h-40 lg:h-48 bg-muted/30 rounded-lg overflow-hidden border border-border/50">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            
            {/* Zone representations */}
            <div className="absolute inset-4 grid grid-cols-3 grid-rows-2 gap-2">
              {zones.map((zone, index) => (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={cn(
                    "relative rounded-lg border-2 transition-all duration-200 flex items-center justify-center",
                    zone.active 
                      ? `${zone.color}/20 border-current opacity-100` 
                      : "bg-muted/30 border-border/30 opacity-50 hover:opacity-75",
                    index === 0 && "col-span-1 row-span-1",
                    index === 1 && "col-span-1 row-span-2",
                    index === 2 && "col-span-1 row-span-1",
                  )}
                  style={{ 
                    backgroundColor: zone.active ? `var(--${zone.color.replace('bg-', '')})` : undefined,
                    opacity: zone.active ? 0.3 : 0.15
                  }}
                >
                  <MapPin className={cn(
                    "w-4 h-4",
                    zone.active ? "text-foreground" : "text-muted-foreground"
                  )} />
                </button>
              ))}
            </div>

            {/* Location marker */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-card/90 backdrop-blur px-2 py-1 rounded-md text-xs">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-medium text-foreground">Your Location</span>
            </div>
          </div>

          {/* Zone List */}
          <div className="lg:w-64 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Toggle Zones
            </p>
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => toggleZone(zone.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all",
                  zone.active
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-transparent hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full shrink-0",
                  zone.color,
                  !zone.active && "opacity-30"
                )} />
                <span className={cn(
                  "flex-1 text-left text-sm",
                  zone.active ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {zone.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {zone.businesses}
                </span>
                {zone.active ? (
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
