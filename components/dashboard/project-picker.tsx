"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Plus, FolderOpen, Trash2, HardDrive } from "lucide-react"
import {
  getProjects,
  createProject,
  deleteProject,
  getActiveProject,
  setActiveProjectId,
  ensureProject,
  getStorageUsage,
  type DbProject,
} from "@/lib/db"

export function ProjectPicker() {
  const [projects, setProjects] = useState<DbProject[]>([])
  const [active, setActive] = useState<DbProject | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [storage, setStorage] = useState({ usedMB: 0, totalMB: 5, percent: 0 })

  useEffect(() => {
    const init = async () => {
      const p = await ensureProject()
      setProjects(await getProjects())
      setActive(p)
      setStorage(getStorageUsage())
    }
    init()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    const p = await createProject(newName.trim())
    setProjects(await getProjects())
    setActive(p)
    setNewName("")
    setShowCreate(false)
    window.location.reload()
  }

  const handleSwitch = (projectId: string) => {
    setActiveProjectId(projectId)
    window.location.reload()
  }

  const handleDelete = async (projectId: string) => {
    await deleteProject(projectId)
    setProjects(await getProjects())
    setActive(await getActiveProject())
    setShowDeleteConfirm(null)
    window.location.reload()
  }

  if (!active) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-48">
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">{active.name}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {projects.map((p) => (
            <DropdownMenuItem
              key={p.id}
              className="flex items-center justify-between"
              onClick={() => handleSwitch(p.id)}
            >
              <span className={`truncate ${p.id === active.id ? "font-semibold" : ""}`}>
                {p.name}
              </span>
              {p.id === active.id && (
                <Badge variant="secondary" className="text-xs ml-2 shrink-0">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </DropdownMenuItem>
          {projects.length > 1 && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setShowDeleteConfirm(active.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete "{active.name}"
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              {storage.usedMB} MB / {storage.totalMB} MB ({storage.percent}%)
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  storage.percent > 80 ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(storage.percent, 100)}%` }}
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">New Project</h3>
            <Input
              placeholder="Project name (e.g. Dallas Audit)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete project?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete "{active.name}" and all its businesses, prospects, and notes.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(showDeleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
