"use client"

import { useState, useRef } from "react"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Building2, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES: Record<string, string[]> = {
  "Food & Drink": [
    "Restaurants & Cafes", "Bakeries", "Bars & Pubs", "Catering", "Food Trucks",
    "Coffee Shops", "Juice Bars", "Pizza Shops", "Ice Cream & Desserts",
  ],
  "Health & Wellness": [
    "Healthcare & Medical", "Dentists", "Chiropractors", "Optometrists",
    "Physical Therapy", "Massage & Spa", "Mental Health", "Veterinarians",
    "Pharmacies", "Urgent Care", "Dermatologists",
  ],
  "Home & Trade Services": [
    "Plumbers", "Electricians", "HVAC", "Roofing", "Contractors & Trades",
    "Home Services", "Landscaping", "Cleaning Services", "Pest Control",
    "Painting", "Fencing", "Flooring", "Garage Doors", "Handyman",
    "Pool Services", "Pressure Washing", "Tree Services", "Septic Services",
  ],
  "Beauty & Personal Care": [
    "Hair & Beauty Salons", "Barber Shops", "Nail Salons", "Tattoo & Piercing",
    "Tanning Salons", "Skincare & Aesthetics", "Lash & Brow Studios",
  ],
  "Automotive": [
    "Auto Services", "Auto Dealerships", "Towing Services", "Car Wash",
    "Auto Body & Collision", "Tire Shops", "Oil Change & Lube",
  ],
  "Professional Services": [
    "Law Firms", "Accounting & Tax", "Insurance Agents", "Financial Advisors",
    "Mortgage Brokers", "Real Estate Agents", "Property Management",
    "Consulting", "Marketing Agencies", "IT Services",
  ],
  "Fitness & Recreation": [
    "Fitness & Gyms", "Yoga Studios", "Martial Arts", "Dance Studios",
    "Golf Courses", "Bowling Alleys", "Skating Rinks",
  ],
  "Education & Childcare": [
    "Tutoring & Education", "Daycare & Childcare", "Driving Schools",
    "Music Lessons", "Art Classes", "Preschools",
  ],
  "Events & Entertainment": [
    "Wedding Venues", "Event Planners", "DJs & Entertainment",
    "Photo Booths", "Party Supplies", "Florists",
  ],
  "Retail & Shopping": [
    "Retail Stores", "Clothing & Boutiques", "Jewelry Stores",
    "Gift Shops", "Thrift & Consignment", "Furniture Stores",
    "Hardware Stores", "Pet Stores",
  ],
  "Pets": [
    "Pet Services", "Dog Grooming", "Pet Boarding & Kennels",
    "Dog Training", "Pet Sitting",
  ],
  "Other Services": [
    "Photography", "Printing & Sign Shops", "Moving Companies",
    "Storage Facilities", "Locksmiths", "Travel Agencies",
    "Dry Cleaning & Laundry", "Tailoring & Alterations",
    "Interior Design", "Architects",
  ],
}

const ALL_CATEGORIES = Object.values(CATEGORIES).flat()

interface CategoryPickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function CategoryPicker({ value, onChange, className }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const handleSelect = (cat: string) => {
    onChange(cat === value ? "" : cat)
    setOpen(false)
    setSearch("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim() && !ALL_CATEGORIES.some((c) => c.toLowerCase() === search.trim().toLowerCase())) {
      onChange(search.trim())
      setOpen(false)
      setSearch("")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between font-normal", className)}>
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{value || "Select or type a category"}</span>
          </div>
          <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder="Search or type custom category..."
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  className="w-full text-sm text-primary hover:underline"
                  onClick={() => { onChange(search.trim()); setOpen(false); setSearch("") }}
                >
                  Search for "{search.trim()}"
                </button>
              ) : (
                "No categories found."
              )}
            </CommandEmpty>
            {value && (
              <CommandGroup>
                <CommandItem onSelect={() => { onChange(""); setOpen(false); setSearch("") }}>
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              </CommandGroup>
            )}
            {Object.entries(CATEGORIES).map(([group, cats]) => (
              <CommandGroup key={group} heading={group}>
                {cats.map((cat) => (
                  <CommandItem key={cat} value={cat} onSelect={() => handleSelect(cat)}>
                    <Check className={cn("w-4 h-4 mr-2", value === cat ? "opacity-100" : "opacity-0")} />
                    {cat}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
