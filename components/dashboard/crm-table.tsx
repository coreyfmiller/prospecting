"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DigitalHealthScore } from "./digital-health-score"
import { InfrastructureTags, type InfraTag } from "./infrastructure-tags"
import { 
  ArrowUpDown, 
  Mail, 
  Sparkles, 
  MoreHorizontal,
  Phone,
  ExternalLink
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface TableLead {
  id: string
  businessName: string
  category: string
  phone: string
  website?: string
  healthScore: number
  tags: InfraTag[]
  seoTitle?: string
  seoDescription?: string
  pageSpeed?: number
  mobileScore?: number
}

interface CRMTableProps {
  leads: TableLead[]
  onGeneratePitch: (lead: TableLead) => void
  onEmailLead: (lead: TableLead) => void
}

export function CRMTable({ leads, onGeneratePitch, onEmailLead }: CRMTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [sortField, setSortField] = useState<"healthScore" | "businessName">("healthScore")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const toggleAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map((l) => l.id))
    }
  }

  const toggleLead = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSort = (field: "healthScore" | "businessName") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const sortedLeads = [...leads].sort((a, b) => {
    const modifier = sortOrder === "asc" ? 1 : -1
    if (sortField === "healthScore") {
      return (a.healthScore - b.healthScore) * modifier
    }
    return a.businessName.localeCompare(b.businessName) * modifier
  })

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedLeads.length === leads.length && leads.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm"
                className="font-semibold -ml-3"
                onClick={() => handleSort("businessName")}
              >
                Business
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm"
                className="font-semibold -ml-3"
                onClick={() => handleSort("healthScore")}
              >
                Health Score
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </TableHead>
            <TableHead>Issues</TableHead>
            <TableHead>SEO Metadata</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => (
            <TableRow key={lead.id} className="group">
              <TableCell>
                <Checkbox 
                  checked={selectedLeads.includes(lead.id)}
                  onCheckedChange={() => toggleLead(lead.id)}
                />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{lead.businessName}</p>
                  <p className="text-xs text-muted-foreground">{lead.category}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.website && (
                    <a 
                      href={lead.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">
                        {lead.website.replace(/^https?:\/\//, '')}
                      </span>
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <DigitalHealthScore score={lead.healthScore} size="sm" />
                  <div className="text-xs text-muted-foreground">
                    {lead.healthScore <= 30 && "Needs help"}
                    {lead.healthScore > 30 && lead.healthScore <= 60 && "Fair"}
                    {lead.healthScore > 60 && "Good"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <InfrastructureTags tags={lead.tags} compact />
              </TableCell>
              <TableCell>
                <div className="max-w-[200px]">
                  {lead.seoTitle ? (
                    <>
                      <p className="text-xs font-medium truncate text-foreground">
                        {lead.seoTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.seoDescription || "No description"}
                      </p>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-destructive/5 text-destructive border-destructive/20">
                      No SEO Data
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => onGeneratePitch(lead)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Pitch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-primary/30 hover:bg-primary/10"
                    onClick={() => onEmailLead(lead)}
                  >
                    <Mail className="w-3.5 h-3.5 mr-1" />
                    Email
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Add to Campaign</DropdownMenuItem>
                      <DropdownMenuItem>Export Contact</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remove Lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {selectedLeads.length > 0 && (
        <div className="border-t border-border/60 p-3 bg-muted/30 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Bulk Email
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Generate All Pitches
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
