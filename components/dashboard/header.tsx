"use client"

import { ThemeToggle } from "./theme-toggle"
import { Zap } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-foreground">ProspectIQ</span>
      </div>
      <ThemeToggle />
    </header>
  )
}
