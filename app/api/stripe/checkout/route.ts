import { NextRequest, NextResponse } from "next/server"
import { stripe, PLAN_TO_PRICE, type PlanId } from "@/lib/stripe"
import { getAuthUser, unauthorized } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorized()

    const { plan } = await req.json()

    if (!plan || !PLAN_TO_PRICE[plan as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = PLAN_TO_PRICE[plan as PlanId]
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 })
    }

    const origin = req.headers.get("origin") || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error("[stripe/checkout] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
