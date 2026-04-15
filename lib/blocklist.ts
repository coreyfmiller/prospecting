const DEFAULT_CHAINS: string[] = [
  "McDonald's", "Burger King", "Wendy's", "Subway", "Taco Bell",
  "KFC", "Popeyes", "Chick-fil-A", "Five Guys", "Arby's",
  "Sonic Drive-In", "Jack in the Box", "Whataburger", "Carl's Jr",
  "Hardee's", "Panda Express", "Chipotle", "Qdoba", "Panera Bread",
  "Jimmy John's", "Jersey Mike's", "Firehouse Subs", "Wingstop",
  "Raising Cane's", "Zaxby's", "Culver's", "In-N-Out",
  "Starbucks", "Dunkin'", "Tim Hortons", "Krispy Kreme",
  "Baskin-Robbins", "Dairy Queen", "Cold Stone",
  "Walmart", "Target", "Costco", "Sam's Club", "Dollar General",
  "Dollar Tree", "Family Dollar", "Big Lots", "Five Below",
  "Walgreens", "CVS", "Rite Aid",
  "Home Depot", "Lowe's", "Menards", "Ace Hardware",
  "AutoZone", "O'Reilly Auto Parts", "Advance Auto Parts", "NAPA",
  "Jiffy Lube", "Valvoline", "Midas", "Meineke", "Maaco",
  "Pizza Hut", "Domino's", "Papa John's", "Little Caesars",
  "Olive Garden", "Applebee's", "Chili's", "TGI Friday's",
  "Red Lobster", "Outback Steakhouse", "Cracker Barrel",
  "Denny's", "IHOP", "Waffle House", "Bob Evans",
  "PetSmart", "Petco", "Pet Valu",
  "Planet Fitness", "Anytime Fitness", "LA Fitness", "Gold's Gym",
  "Great Clips", "Supercuts", "Sport Clips", "Fantastic Sams",
  "H&R Block", "Jackson Hewitt", "Liberty Tax",
  "UPS Store", "FedEx Office",
  "State Farm", "Allstate", "Farmers Insurance", "Geico",
  "RE/MAX", "Keller Williams", "Century 21", "Coldwell Banker",
  "7-Eleven", "Circle K", "Wawa", "Sheetz", "QuikTrip",
  "Shell", "BP", "Chevron", "ExxonMobil", "Sunoco",
  "Irving Oil", "Petro-Canada", "Esso", "Canadian Tire",
  "Shoppers Drug Mart", "Sobeys", "Loblaws", "Metro",
  "A&W", "Harvey's", "Mary Brown's", "Swiss Chalet",
  "Boston Pizza", "Montana's", "East Side Mario's",
  "Marriott", "Hilton", "Holiday Inn", "Best Western",
  "Hampton Inn", "Comfort Inn", "Days Inn", "Super 8",
  "Enterprise", "Hertz", "Avis", "Budget",
]

const BLOCKLIST_KEY = "prospectiq_blocklist"
const CHAINS_ENABLED_KEY = "prospectiq_block_chains"

export function getDefaultChains(): string[] {
  return [...DEFAULT_CHAINS]
}

export function getUserBlocklist(): string[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(BLOCKLIST_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addToBlocklist(name: string): void {
  const list = getUserBlocklist()
  const normalized = name.trim()
  if (!list.some((n) => n.toLowerCase() === normalized.toLowerCase())) {
    list.push(normalized)
    localStorage.setItem(BLOCKLIST_KEY, JSON.stringify(list))
  }
}

export function removeFromBlocklist(name: string): void {
  const list = getUserBlocklist().filter(
    (n) => n.toLowerCase() !== name.toLowerCase()
  )
  localStorage.setItem(BLOCKLIST_KEY, JSON.stringify(list))
}

export function isBlockChainsEnabled(): boolean {
  if (typeof window === "undefined") return true
  const val = localStorage.getItem(CHAINS_ENABLED_KEY)
  return val === null ? true : val === "true" // default on
}

export function setBlockChainsEnabled(enabled: boolean): void {
  localStorage.setItem(CHAINS_ENABLED_KEY, String(enabled))
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

export function isBlocked(businessName: string): boolean {
  const name = normalize(businessName)
  const blockChains = isBlockChainsEnabled()

  // Check user blocklist always
  const userList = getUserBlocklist()
  for (const blocked of userList) {
    if (name.includes(normalize(blocked))) return true
  }

  // Check default chains if enabled
  if (blockChains) {
    for (const chain of DEFAULT_CHAINS) {
      if (name.includes(normalize(chain))) return true
    }
  }

  return false
}
