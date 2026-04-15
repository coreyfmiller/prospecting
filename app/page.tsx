"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { CategorySidebar } from "@/components/dashboard/category-sidebar"
import { ServiceAreaMap } from "@/components/dashboard/service-area-map"
import { ProspectFeed } from "@/components/dashboard/prospect-feed"
import { CRMTable, type TableLead } from "@/components/dashboard/crm-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, Table2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const mockTableLeads: TableLead[] = [
  {
    id: "1",
    businessName: "Mike's Auto Repair",
    category: "Auto Services",
    phone: "(555) 123-4567",
    website: "http://mikesauto.com",
    healthScore: 23,
    tags: ["non-mobile-responsive", "slow-load-time", "no-ssl"],
    seoTitle: "Mike's Auto Repair - Car Service",
    seoDescription: "Your trusted local mechanic since 1985",
    pageSpeed: 34,
    mobileScore: 21,
  },
  {
    id: "2",
    businessName: "The Golden Spoon Restaurant",
    category: "Restaurants & Cafes",
    phone: "(555) 234-5678",
    healthScore: 15,
    tags: ["no-website", "facebook-only"],
  },
  {
    id: "3",
    businessName: "Bella's Hair Studio",
    category: "Hair & Beauty Salons",
    phone: "(555) 345-6789",
    website: "http://bellashair.net",
    healthScore: 42,
    tags: ["non-mobile-responsive", "outdated-design"],
    seoTitle: "Bella's Hair Studio",
    pageSpeed: 45,
    mobileScore: 38,
  },
  {
    id: "4",
    businessName: "Johnson Plumbing Co.",
    category: "Contractors & Trades",
    phone: "(555) 456-7890",
    healthScore: 8,
    tags: ["no-website"],
  },
  {
    id: "5",
    businessName: "Sunrise Dental Clinic",
    category: "Healthcare & Medical",
    phone: "(555) 567-8901",
    website: "http://sunrisedental.org",
    healthScore: 56,
    tags: ["slow-load-time", "outdated-design"],
    seoTitle: "Sunrise Dental - Family Dentistry",
    seoDescription: "Comprehensive dental care for the whole family",
    pageSpeed: 52,
    mobileScore: 61,
  },
  {
    id: "6",
    businessName: "Paws & Claws Pet Grooming",
    category: "Pet Services",
    phone: "(555) 678-9012",
    healthScore: 31,
    tags: ["facebook-only", "non-mobile-responsive"],
    seoTitle: "Paws & Claws Grooming",
    pageSpeed: 28,
    mobileScore: 19,
  },
  {
    id: "7",
    businessName: "Downtown Fitness Center",
    category: "Fitness & Gyms",
    phone: "(555) 789-0123",
    website: "http://downtownfitness.com",
    healthScore: 67,
    tags: ["slow-load-time"],
    seoTitle: "Downtown Fitness - Your Health Matters",
    seoDescription: "State-of-the-art gym with personal trainers",
    pageSpeed: 48,
    mobileScore: 72,
  },
  {
    id: "8",
    businessName: "Creative Cuts Barbershop",
    category: "Hair & Beauty Salons",
    phone: "(555) 890-1234",
    healthScore: 19,
    tags: ["no-website", "facebook-only"],
  },
]

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleGeneratePitch = (lead: TableLead) => {
    console.log("Generating pitch for:", lead.businessName)
  }

  const handleEmailLead = (lead: TableLead) => {
    console.log("Emailing lead:", lead.businessName)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 lg:hidden shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="pt-16 lg:pt-0 h-full">
            <CategorySidebar
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat)
                setSidebarOpen(false)
              }}
            />
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Service Area Map */}
          <div className="p-4 border-b border-border bg-background/50">
            <ServiceAreaMap />
          </div>

          {/* Tabs for Feed vs Table View */}
          <Tabs defaultValue="feed" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4 border-b border-border bg-background">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="feed" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Prospect Feed
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <Table2 className="w-4 h-4" />
                  CRM Table
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="feed" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ProspectFeed selectedCategory={selectedCategory} />
            </TabsContent>

            <TabsContent value="table" className="flex-1 overflow-auto p-4 mt-0">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">Lead Database</h2>
                <p className="text-sm text-muted-foreground">
                  Complete CRM view with SEO metadata and contact information
                </p>
              </div>
              <CRMTable 
                leads={mockTableLeads}
                onGeneratePitch={handleGeneratePitch}
                onEmailLead={handleEmailLead}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
