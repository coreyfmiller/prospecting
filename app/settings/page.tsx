"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Upload, Loader2 } from "lucide-react"

const LOGO_KEY = "marketmojo_user_logo"
const COMPANY_KEY = "marketmojo_company_name"

export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLogo(localStorage.getItem(LOGO_KEY))
    setCompanyName(localStorage.getItem(COMPANY_KEY) || "")
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) {
      alert("Logo must be under 500KB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      localStorage.setItem(LOGO_KEY, dataUrl)
      setLogo(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    setSaving(true)
    localStorage.setItem(COMPANY_KEY, companyName)
    setTimeout(() => setSaving(false), 500)
  }

  const handleRemoveLogo = () => {
    localStorage.removeItem(LOGO_KEY)
    setLogo(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6" /> Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Configure your branding for reports</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Company Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Company Name</label>
                <div className="flex gap-2">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Agency Name"
                  />
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Report Logo</label>
                <p className="text-xs text-muted-foreground mb-3">
                  This logo appears on PDF audit reports you generate. PNG or JPG, max 500KB.
                </p>
                {logo ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-lg border border-border inline-block">
                      <img src={logo} alt="Your logo" className="h-12 max-w-48 object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild>
                          <span><Upload className="w-4 h-4 mr-1" /> Replace</span>
                        </Button>
                        <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      <Button variant="outline" size="sm" onClick={handleRemoveLogo} className="text-destructive">
                        Remove
                      </Button>
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
        </div>
      </main>
    </div>
  )
}
