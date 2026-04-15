"use client"

import { useState } from "react"
import { LeadCard, type Lead } from "./lead-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List,
  RefreshCw,
  TrendingDown
} from "lucide-react"

const mockLeads: Lead[] = [
  {
    id: "1",
    businessName: "Mike's Auto Repair",
    category: "Auto Services",
    address: "123 Main St, Downtown",
    phone: "(555) 123-4567",
    website: "http://mikesauto.com",
    healthScore: 23,
    tags: ["non-mobile-responsive", "slow-load-time", "no-ssl"],
    lastChecked: "2 hours ago",
  },
  {
    id: "2",
    businessName: "The Golden Spoon Restaurant",
    category: "Restaurants & Cafes",
    address: "456 Oak Avenue, Midtown",
    phone: "(555) 234-5678",
    healthScore: 15,
    tags: ["no-website", "facebook-only"],
    lastChecked: "1 hour ago",
  },
  {
    id: "3",
    businessName: "Bella's Hair Studio",
    category: "Hair & Beauty Salons",
    address: "789 Elm Street, Eastside",
    phone: "(555) 345-6789",
    website: "http://bellashair.net",
    healthScore: 42,
    tags: ["non-mobile-responsive", "outdated-design"],
    lastChecked: "30 mins ago",
  },
  {
    id: "4",
    businessName: "Johnson Plumbing Co.",
    category: "Contractors & Trades",
    address: "321 Pine Road, Northside",
    phone: "(555) 456-7890",
    healthScore: 8,
    tags: ["no-website"],
    lastChecked: "4 hours ago",
  },
  {
    id: "5",
    businessName: "Sunrise Dental Clinic",
    category: "Healthcare & Medical",
    address: "555 Health Blvd, Downtown",
    phone: "(555) 567-8901",
    website: "http://sunrisedental.org",
    healthScore: 56,
    tags: ["slow-load-time", "outdated-design"],
    lastChecked: "1 day ago",
  },
  {
    id: "6",
    businessName: "Paws & Claws Pet Grooming",
    category: "Pet Services",
    address: "888 Furry Lane, Southside",
    phone: "(555) 678-9012",
    healthScore: 31,
    tags: ["facebook-only", "non-mobile-responsive"],
    lastChecked: "3 hours ago",
  },
]

interface ProspectFeedProps {
  selectedCategory: string | null
}

export function ProspectFeed({ selectedCategory }: ProspectFeedProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("score-low")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredLeads = mockLeads
    .filter((lead) => {
      const matchesSearch = lead.businessName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || 
        lead.category.toLowerCase().includes(selectedCategory.replace("-", " "))
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === "score-low") return a.healthScore - b.healthScore
      if (sortBy === "score-high") return b.healthScore - a.healthScore
      if (sortBy === "name") return a.businessName.localeCompare(b.businessName)
      return 0
    })

  const handleGeneratePitch = (lead: Lead) => {
    console.log("Generating pitch for:", lead.businessName)
  }

  const handleEmailLead = (lead: Lead) => {
    console.log("Emailing lead:", lead.businessName)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Feed Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Prospect Feed
            </h2>
            <p className="text-sm text-muted-foreground">
              Businesses with low digital health scores in your service area
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prospects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score-low">Lowest Score First</SelectItem>
                <SelectItem value="score-high">Highest Score First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            All Prospects
            <span className="ml-1 text-xs opacity-70">{filteredLeads.length}</span>
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            No Website
            <span className="ml-1 text-xs opacity-70">
              {filteredLeads.filter(l => l.tags.includes("no-website")).length}
            </span>
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            Not Mobile
            <span className="ml-1 text-xs opacity-70">
              {filteredLeads.filter(l => l.tags.includes("non-mobile-responsive")).length}
            </span>
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-muted">
            Slow Sites
            <span className="ml-1 text-xs opacity-70">
              {filteredLeads.filter(l => l.tags.includes("slow-load-time")).length}
            </span>
          </Badge>
        </div>
      </div>

      {/* Lead Cards */}
      <div className="flex-1 overflow-auto p-4">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No prospects found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              : "flex flex-col gap-3"
          }>
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onGeneratePitch={handleGeneratePitch}
                onEmailLead={handleEmailLead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
