import { NextResponse } from "next/server"
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server"

/**
 * Verify the user is authenticated and return their user object.
 * Returns null if not authenticated (caller should return 401).
 */
export async function getAuthUser() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Check if user has enough credits. Deducts if they do.
 * Returns { success, remaining, error? }
 */
export async function requireCredits(
  userId: string,
  amount: number,
  reason: string,
  businessName?: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  const supabase = createServiceClient()

  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single()

  const current = profile?.credits ?? 0
  if (current < amount) {
    return {
      success: false,
      remaining: current,
      error: `Insufficient credits. Need ${amount}, have ${current}. Purchase more at /pricing.`,
    }
  }

  const newBalance = current - amount

  // Deduct
  await supabase
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", userId)

  // Log transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -amount,
    reason,
    business_name: businessName || null,
  })

  return { success: true, remaining: newBalance }
}

/**
 * Refund credits (e.g., when a scan fails)
 */
export async function refundCreditsServer(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single()

  const newBalance = (profile?.credits ?? 0) + amount

  await supabase
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", userId)

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    reason,
  })
}

/**
 * Standard 401 response
 */
export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
}

/**
 * Standard insufficient credits response
 */
export function insufficientCredits(remaining: number) {
  return NextResponse.json(
    { error: `Insufficient credits. You have ${remaining} remaining.`, credits: remaining },
    { status: 402 }
  )
}
