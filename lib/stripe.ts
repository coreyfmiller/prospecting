import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// Plan configuration
export const PLANS = {
  starter: {
    name: "Starter",
    credits: 30,
    priceMonthly: 3000, // cents
  },
  pro: {
    name: "Pro",
    credits: 100,
    priceMonthly: 9500,
  },
  agency: {
    name: "Agency",
    credits: 250,
    priceMonthly: 22500,
  },
} as const

export type PlanId = keyof typeof PLANS

// Map Stripe Price IDs to plan IDs (set after creating prices)
export const PRICE_TO_PLAN: Record<string, PlanId> = {
  [process.env.STRIPE_PRICE_STARTER || ""]: "starter",
  [process.env.STRIPE_PRICE_PRO || ""]: "pro",
  [process.env.STRIPE_PRICE_AGENCY || ""]: "agency",
}

export const PLAN_TO_PRICE: Record<PlanId, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
  agency: process.env.STRIPE_PRICE_AGENCY || "",
}
