import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/config";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Webhook handler for Stripe subscription events
// Force rebuild: Fixed import to use supabaseAdminClient instead of createSupabaseAdminClient

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 },
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  const supabaseAdmin = supabaseAdminClient;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const firmId = session.metadata?.firm_id;

        if (!firmId) {
          console.error("No firm_id in checkout session metadata");
          break;
        }

        // Verify firm exists
        const { data: firm, error: firmCheckError } = await supabaseAdmin
          .from("firms")
          .select("id")
          .eq("id", firmId)
          .maybeSingle();

        if (firmCheckError || !firm) {
          console.error("Firm not found:", firmCheckError);
          break;
        }

          // Handle subscription mode (recurring subscription)
        if (session.mode === "subscription") {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          if (subscriptionId) {
            const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(
              subscriptionId,
            );
            const priceId = subscription.items.data[0]?.price.id;

            // Get plan from price ID
            const { data: plan } = await supabaseAdmin
              .from("subscription_plans")
              .select("id")
              .eq("price_id_stripe", priceId)
              .maybeSingle();

            const now = new Date();
            // current_period_end is a timestamp in seconds
            const periodEnd = (subscription as any).current_period_end || Math.floor(now.getTime() / 1000) + 2592000; // Default to 30 days if not set
            const subscriptionEndsAt = new Date(periodEnd * 1000);

            // Update firm subscription
            const { error: updateError } = await supabaseAdmin
              .from("firms")
              .update({
                subscription_status: "active",
                subscription_started_at: now.toISOString(),
                subscription_ends_at: subscriptionEndsAt.toISOString(),
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: subscription.customer as string,
              })
              .eq("id", firmId);

            if (updateError) {
              console.error("Error updating firm subscription:", updateError);
              throw updateError;
            }

            // Log subscription start
            await supabaseAdmin.from("subscription_history").insert({
              firm_id: firmId,
              subscription_plan_id: plan?.id || null,
              status: "subscribed",
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: subscription.customer as string,
              amount_paid: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
              currency: subscription.currency.toUpperCase(),
              payment_method: "stripe",
              event_data: {
                subscription_id: subscriptionId,
                customer_id: subscription.customer,
              },
            });
          }
        } else if (session.mode === "payment") {
          // Handle one-time payment mode (if needed in future)
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              paymentIntentId,
            );

            const planId = session.metadata?.plan_id;
            const now = new Date();
            const subscriptionEndsAt = new Date(now);
            subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

            let plan = null;
            if (planId) {
              const { data: planData } = await supabaseAdmin
                .from("subscription_plans")
                .select("id")
                .eq("id", planId)
                .maybeSingle();
              plan = planData;
            }

            await supabaseAdmin
              .from("firms")
              .update({
                subscription_status: "active",
                subscription_started_at: now.toISOString(),
                subscription_ends_at: subscriptionEndsAt.toISOString(),
                stripe_customer_id: session.customer as string,
              })
              .eq("id", firmId);

            await supabaseAdmin.from("subscription_history").insert({
              firm_id: firmId,
              subscription_plan_id: plan?.id || null,
              status: "subscribed",
              stripe_customer_id: session.customer as string,
              amount_paid: (paymentIntent.amount || 0) / 100,
              currency: (paymentIntent.currency || "usd").toUpperCase(),
              payment_method: "stripe",
              payment_reference: paymentIntentId,
              event_data: {
                payment_intent_id: paymentIntentId,
                checkout_session_id: session.id,
                customer_id: session.customer,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const firmId = subscription.metadata?.firm_id;

        if (!firmId) {
          console.error("No firm_id in subscription metadata");
          break;
        }

        // Verify firm exists
        const { data: firm } = await supabaseAdmin
          .from("firms")
          .select("id")
          .eq("id", firmId)
          .maybeSingle();

        if (!firm) {
          console.error("Firm not found for subscription update:", firmId);
          break;
        }

        // current_period_end is a timestamp in seconds
        const periodEnd = (subscription as any).current_period_end || Math.floor(new Date().getTime() / 1000) + 2592000; // Default to 30 days if not set
        const subscriptionEndsAt = new Date(periodEnd * 1000);

        let status = "active";
        if (subscription.status === "canceled") {
          status = "canceled";
        } else if (subscription.status === "past_due") {
          status = "past_due";
        } else if (subscription.status === "unpaid") {
          status = "expired";
        }

        // Update firm subscription
        const { error: updateError } = await supabaseAdmin
          .from("firms")
          .update({
            subscription_status: status,
            subscription_ends_at: subscriptionEndsAt.toISOString(),
          })
          .eq("id", firmId);

        if (updateError) {
          console.error("Error updating firm subscription:", updateError);
          throw updateError;
        }

        // Log subscription update
        await supabaseAdmin.from("subscription_history").insert({
          firm_id: firmId,
          status: status,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          event_data: {
            subscription_id: subscription.id,
            status: subscription.status,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const firmId = subscription.metadata?.firm_id;

        if (!firmId) {
          console.error("No firm_id in subscription metadata");
          break;
        }

        // Verify firm exists
        const { data: firm } = await supabaseAdmin
          .from("firms")
          .select("id")
          .eq("id", firmId)
          .maybeSingle();

        if (!firm) {
          console.error("Firm not found for subscription deletion:", firmId);
          break;
        }

        // Update firm subscription to expired
        const { error: updateError } = await supabaseAdmin
          .from("firms")
          .update({
            subscription_status: "expired",
            subscription_ends_at: new Date().toISOString(),
          })
          .eq("id", firmId);

        if (updateError) {
          console.error("Error updating firm subscription:", updateError);
          throw updateError;
        }

        // Log subscription deletion
        await supabaseAdmin.from("subscription_history").insert({
          firm_id: firmId,
          status: "expired",
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          event_data: {
            subscription_id: subscription.id,
            deleted_at: new Date().toISOString(),
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;

        if (subscriptionId) {
          const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const firmId = subscription.metadata?.firm_id;

          if (firmId) {
            // Log successful payment
            await supabaseAdmin.from("subscription_history").insert({
              firm_id: firmId,
              status: "payment_received",
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: invoice.customer as string,
              amount_paid: (invoice.amount_paid || 0) / 100,
              currency: invoice.currency.toUpperCase(),
              payment_method: "stripe",
              event_data: {
                invoice_id: invoice.id,
                subscription_id: subscriptionId,
              },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id;

        if (subscriptionId) {
          const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const firmId = subscription.metadata?.firm_id;

          if (firmId) {
            // Update firm to past_due
            await supabaseAdmin
              .from("firms")
              .update({
                subscription_status: "past_due",
              })
              .eq("id", firmId);

            // Log failed payment
            await supabaseAdmin.from("subscription_history").insert({
              firm_id: firmId,
              status: "payment_failed",
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: invoice.customer as string,
              amount_paid: (invoice.amount_paid || 0) / 100,
              currency: invoice.currency.toUpperCase(),
              payment_method: "stripe",
              event_data: {
                invoice_id: invoice.id,
                subscription_id: subscriptionId,
                attempt_count: invoice.attempt_count,
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Webhook processing failed";
    console.error("Webhook error details:", {
      message: errorMessage,
      event_type: event?.type,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
