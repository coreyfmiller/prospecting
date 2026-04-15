"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  Search, 
  Utensils, 
  Scissors, 
  Wrench, 
  Building, 
  Car, 
  Heart, 
  ShoppingBag,
  Home,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Camera,
  Music,
  Palette,
  Stethoscope,
  PawPrint,
  Leaf
} from "lucide-react"

export interface Category {
  id: string
  name: string
  count: number
  icon: React.ElementType
}

const categories: Category[] = [
  { id: "restaurants", name: "Restaurants & Cafes", count: 156, icon: Utensils },
  { id: "salons", name: "Hair & Beauty Salons", count: 89, icon: Scissors },
  { id: "contractors", name: "Contractors & Trades", count: 234, icon: Wrench },
  { id: "real-estate", name: "Real Estate Agents", count: 67, icon: Building },
  { id: "auto", name: "Auto Services", count: 112, icon: Car },
  { id: "healthcare", name: "Healthcare & Medical", count: 78, icon: Stethoscope },
  { id: "retail", name: "Retail Stores", count: 198, icon: ShoppingBag },
  { id: "home-services", name: "Home Services", count: 145, icon: Home },
  { id: "professional", name: "Professional Services", count: 89, icon: Briefcase },
  { id: "education", name: "Education & Tutoring", count: 45, icon: GraduationCap },
  { id: "fitness", name: "Fitness & Gyms", count: 56, icon: Dumbbell },
  { id: "photography", name: "Photography", count: 34, icon: Camera },
  { id: "entertainment", name: "Entertainment", count: 67, icon: Music },
  { id: "creative", name: "Creative Services", count: 78, icon: Palette },
  { id: "wellness", name: "Wellness & Spa", count: 45, icon: Heart },
  { id: "pet-services", name: "Pet Services", count: 38, icon: PawPrint },
  { id: "landscaping", name: "Landscaping", count: 92, icon: Leaf },
]

interface CategorySidebarProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategorySidebar({ selectedCategory, onSelectCategory }: CategorySidebarProps) {
  const [search, setSearch] = useState("")

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalLeads = categories.reduce((acc, cat) => acc + cat.count, 0)

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-sidebar-accent/50 border-sidebar-border"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              selectedCategory === null
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <span>All Categories</span>
            <span className="text-xs bg-sidebar-primary/10 text-sidebar-primary px-2 py-0.5 rounded-full">
              {totalLeads}
            </span>
          </button>
          
          <div className="mt-2 space-y-0.5">
            {filteredCategories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    selectedCategory === category.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">{category.name}</span>
                  <span className="text-xs text-muted-foreground">{category.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
