"use client"

import { ThemeToggle } from "./theme-toggle"
import { ProjectPicker } from "./project-picker"
import { Button } from "@/components/ui/button"
import { Zap, Database, Star, Ban, Flame } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:inline">ProspectIQ</span>
        </Link>
        <ProjectPicker />
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/database">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Database className="w-4 h-4" /> All
            </Button>
          </Link>
          <Link href="/prospects">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Star className="w-4 h-4" /> Prospects
            </Button>
          </Link>
          <Link href="/priority">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Flame className="w-4 h-4" /> Priority
            </Button>
          </Link>
          <Link href="/dismissed">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Ban className="w-4 h-4" /> Dismissed
            </Button>
          </Link>
        </nav>
      </div>
      <ThemeToggle />
    </header>
  )
}
