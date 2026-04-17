"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, Search, Calendar, MapPin, ChevronRight, Trash2 } from "lucide-react"
import { getAudits, deleteAudit, type Audit } from "@/lib/storage"
import Link from "next/link"

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { setAudits(getAudits()) }, [])

  const handleDelete = (id: string) => {
    deleteAudit(id)
    setAudits(getAudits())
    setDeleteConfirm(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6" /> Search Audits
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every search is saved as an audit with ranked positions
            </p>
          </div>

          {audits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No audits yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Run a search from the home page and it'll automatically save as an audit here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {audits.map((audit) => {
                const withWebsite = audit.results.filter((r) => r.hasWebsite).length
                const scanned = audit.results.filter((r) => r.duellyScan).length
                return (
                  <Link key={audit.id} href={`/audits/${audit.id}`}>
                    <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{audit.query}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {audit.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(audit.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Badge variant="secondary">{audit.results.length} results</Badge>
                          <Badge variant="outline">{withWebsite} websites</Badge>
                          {scanned > 0 && (
                            <Badge variant="default">{scanned} scanned</Badge>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              setDeleteConfirm(audit.id)
                            }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete this audit?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently delete this audit and all its Duelly scan results. This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
