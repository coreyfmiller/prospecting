"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Upload, Loader2, Plus, Trash2, Pencil } from "lucide-react"
import {
  getServiceTags, addServiceTag, updateServiceTag, deleteServiceTag,
  getPipelineStages, addPipelineStage, updatePipelineStageConfig, deletePipelineStage,
  type CustomServiceTag, type CustomPipelineStage,
} from "@/lib/db"

const LOGO_KEY = "marketmojo_user_logo"
const COMPANY_KEY = "marketmojo_company_name"

const COLOR_OPTIONS = [
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-green-600", label: "Dark Green" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-violet-500", label: "Violet" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-fuchsia-500", label: "Fuchsia" },
  { value: "bg-slate-500", label: "Slate" },
]

function TagEditor({ items, onAdd, onUpdate, onDelete, title, description }: {
  items: { id: string; label: string; color: string }[]
  onAdd: (label: string, color: string) => Promise<void>
  onUpdate: (id: string, label: string, color: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  title: string
  description: string
}) {
  const [newLabel, setNewLabel] = useState("")
  const [newColor, setNewColor] = useState("bg-blue-500")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editColor, setEditColor] = useState("")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {editingId === item.id ? (
              <>
                <span className={`w-4 h-4 rounded-full shrink-0 ${editColor}`} />
                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="flex-1 h-8 text-sm" />
                <Select value={editColor} onValueChange={setEditColor}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${c.value}`} />{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={async () => { await onUpdate(item.id, editLabel, editColor); setEditingId(null) }}>Save</Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingId(null)}>Cancel</Button>
              </>
            ) : (
              <>
                <span className={`w-4 h-4 rounded-full shrink-0 ${item.color}`} />
                <span className="flex-1 text-sm">{item.label}</span>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setEditingId(item.id); setEditLabel(item.label); setEditColor(item.color) }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => onDelete(item.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="New item..." className="flex-1 h-8 text-sm" />
          <Select value={newColor} onValueChange={setNewColor}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${c.value}`} />{c.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 gap-1" disabled={!newLabel.trim()} onClick={async () => { await onAdd(newLabel.trim(), newColor); setNewLabel("") }}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [saving, setSaving] = useState(false)
  const [serviceTags, setServiceTags] = useState<CustomServiceTag[]>([])
  const [pipelineStages, setPipelineStages] = useState<CustomPipelineStage[]>([])

  useEffect(() => {
    setLogo(localStorage.getItem(LOGO_KEY))
    setCompanyName(localStorage.getItem(COMPANY_KEY) || "")
    getServiceTags().then(setServiceTags)
    getPipelineStages().then(setPipelineStages)
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) { alert("Logo must be under 500KB"); return }
    const reader = new FileReader()
    reader.onload = () => { const dataUrl = reader.result as string; localStorage.setItem(LOGO_KEY, dataUrl); setLogo(dataUrl) }
    reader.readAsDataURL(file)
  }

  const handleSave = () => { setSaving(true); localStorage.setItem(COMPANY_KEY, companyName); setTimeout(() => setSaving(false), 500) }
  const handleRemoveLogo = () => { localStorage.removeItem(LOGO_KEY); setLogo(null) }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6" /> Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Configure your branding, service tags, and pipeline</p>
          </div>

          {/* Branding */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Company Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Company Name</label>
                <div className="flex gap-2">
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Agency Name" />
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Report Logo</label>
                <p className="text-xs text-muted-foreground mb-3">This logo appears on PDF audit reports. PNG or JPG, max 500KB.</p>
                {logo ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-lg border border-border inline-block">
                      <img src={logo} alt="Your logo" className="h-12 max-w-48 object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild><span><Upload className="w-4 h-4 mr-1" /> Replace</span></Button>
                        <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <Button variant="outline" size="sm" onClick={handleRemoveLogo} className="text-destructive">Remove</Button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload your logo</p>
                    </div>
                    <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Tags */}
          <TagEditor
            items={serviceTags}
            title="Service Tags"
            description="Customize the service pitch buttons that appear on each business card"
            onAdd={async (label, color) => {
              const tag = await addServiceTag(label, color)
              if (tag) setServiceTags([...serviceTags, tag])
            }}
            onUpdate={async (id, label, color) => {
              await updateServiceTag(id, label, color)
              setServiceTags(serviceTags.map((t) => t.id === id ? { ...t, label, color } : t))
            }}
            onDelete={async (id) => {
              await deleteServiceTag(id)
              setServiceTags(serviceTags.filter((t) => t.id !== id))
            }}
          />

          {/* Pipeline Stages */}
          <TagEditor
            items={pipelineStages}
            title="Pipeline Stages"
            description="Customize the sales pipeline stages for tracking your outreach progress"
            onAdd={async (label, color) => {
              const stage = await addPipelineStage(label, color)
              if (stage) setPipelineStages([...pipelineStages, stage])
            }}
            onUpdate={async (id, label, color) => {
              await updatePipelineStageConfig(id, label, color)
              setPipelineStages(pipelineStages.map((s) => s.id === id ? { ...s, label, color } : s))
            }}
            onDelete={async (id) => {
              await deletePipelineStage(id)
              setPipelineStages(pipelineStages.filter((s) => s.id !== id))
            }}
          />
        </div>
      </main>
    </div>
  )
}
