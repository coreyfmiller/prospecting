import { NextRequest, NextResponse } from "next/server"
import { stripe, PRICE_TO_PLAN, PLANS } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase/server"
import type Stripe from "stripe"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("[stripe/webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan as keyof typeof PLANS | undefined

      if (userId && plan && PLANS[plan]) {
        // Set user's plan and add credits
        await supabase
          .from("profiles")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId)

        // Add monthly credits
        const credits = PLANS[plan].credits
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single()

        const newBalance = (profile?.credits ?? 0) + credits
        await supabase
          .from("profiles")
          .update({ credits: newBalance })
          .eq("id", userId)

        // Log transaction
        await supabase.from("credit_transactions").insert({
          user_id: userId,
          amount: credits,
          reason: `${PLANS[plan].name} plan subscription`,
        })

        console.log(`[stripe] User ${userId} subscribed to ${plan}, +${credits} credits`)
      }
      break
    }

    case "invoice.paid": {
      // Monthly renewal — add credits
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const subscriptionId = invoice.subscription as string

      // Skip the first invoice (already handled in checkout.session.completed)
      if (invoice.billing_reason === "subscription_create") break

      // Find user by stripe_customer_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, plan, credits")
        .eq("stripe_customer_id", customerId)
        .single()

      if (profile?.plan && PLANS[profile.plan as keyof typeof PLANS]) {
        const credits = PLANS[profile.plan as keyof typeof PLANS].credits
        const newBalance = (profile.credits ?? 0) + credits

        await supabase
          .from("profiles")
          .update({ credits: newBalance })
          .eq("id", profile.id)

        await supabase.from("credit_transactions").insert({
          user_id: profile.id,
          amount: credits,
          reason: `Monthly renewal — ${profile.plan} plan`,
        })

        console.log(`[stripe] Monthly renewal for ${profile.id}, +${credits} credits`)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase
        .from("profiles")
        .update({
          plan: "free",
          stripe_subscription_id: null,
        })
        .eq("stripe_customer_id", customerId)

      console.log(`[stripe] Subscription cancelled for customer ${customerId}`)
      break
    }
  }

  return NextResponse.json({ received: true })
}
