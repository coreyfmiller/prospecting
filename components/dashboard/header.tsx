"use client"

import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { Zap, Database, Star, Ban } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <header className="h-14 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">ProspectIQ</span>
        </Link>
        <Link href="/database">
          <Button variant="ghost" size="sm" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">All Businesses</span>
          </Button>
        </Link>
        <Link href="/prospects">
          <Button variant="ghost" size="sm" className="gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Prospects</span>
          </Button>
        </Link>
        <Link href="/dismissed">
          <Button variant="ghost" size="sm" className="gap-2">
            <Ban className="w-4 h-4" />
            <span className="hidden sm:inline">Dismissed</span>
          </Button>
        </Link>
      </div>
      <ThemeToggle />
    </header>
  )
}
