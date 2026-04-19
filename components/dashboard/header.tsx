"use client"

import { useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { ProjectPicker } from "./project-picker"
import { Button } from "@/components/ui/button"
import { Zap, Database, Star, Ban, Flame, SearchCheck, Menu, X, Search, LayoutDashboard, ClipboardList } from "lucide-react"
import Link from "next/link"

const NAV_LINKS = [
  { href: "/", label: "Search", icon: Search },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audits", label: "Audits", icon: ClipboardList },
  { href: "/database", label: "All Businesses", icon: Database },
  { href: "/priority", label: "Priority", icon: Flame },
  { href: "/prospects", label: "Prospects", icon: Star },
  { href: "/dismissed", label: "Dismissed", icon: Ban },
  { href: "/seo", label: "Services", icon: SearchCheck },
]

export function DashboardHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
          </Link>
          <ProjectPicker />
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <link.icon className="w-4 h-4" /> {link.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="MarketMojo.ai" className="h-8" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="mb-4">
              <ProjectPicker />
            </div>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <link.icon className="w-5 h-5" /> {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
