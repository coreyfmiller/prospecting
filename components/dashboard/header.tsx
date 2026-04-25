"use client"

import { useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { ProjectPicker } from "./project-picker"
import { Button } from "@/components/ui/button"
import { Zap, Database, Star, Ban, Flame, SearchCheck, Menu, X, Search, LayoutDashboard, ClipboardList, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useCredits } from "@/hooks/use-credits"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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
  const { credits } = useCredits()

  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

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
        <div className="flex items-center gap-2">
          {credits !== null && (
            <div className="flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Zap className="w-3.5 h-3.5" />
              {credits}
            </div>
          )}
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="w-4 h-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            <div className="border-t border-border mt-2 pt-2">
              <Link href="/settings" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Settings className="w-5 h-5" /> Settings
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
                <LogOut className="w-5 h-5" /> Log out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
