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

  if (!stripe) {
    if (process.env.NODE_ENV === "development") {
      console.error("Stripe is not configured");
    }
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === "development") {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
    }
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
    if (process.env.NODE_ENV === "development") {
      console.error("Webhook signature verification failed:", err);
    }
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
          if (process.env.NODE_ENV === "development") {
            console.error("No firm_id in checkout session metadata");
          }
          break;
        }

        // Verify firm exists and get contact email for notification
        const { data: firm, error: firmCheckError } = await supabaseAdmin
          .from("firms")
          .select("id, name, contact_email")
          .eq("id", firmId)
          .maybeSingle();

        if (firmCheckError || !firm) {
          if (process.env.NODE_ENV === "development") {
            console.error("Firm not found:", firmCheckError);
          }
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

            // Get plan from price ID (id + name for notification email)
            const { data: plan } = await supabaseAdmin
              .from("subscription_plans")
              .select("id, name")
              .eq("price_id_stripe", priceId)
              .maybeSingle();

            const now = new Date();
            // current_period_end is a timestamp in seconds
            // Access current_period_end from the subscription object
            const periodEnd = "current_period_end" in subscription && typeof subscription.current_period_end === "number"
              ? subscription.current_period_end
              : Math.floor(now.getTime() / 1000) + 2592000; // Default to 30 days if not set
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
              if (process.env.NODE_ENV === "development") {
                console.error("Error updating firm subscription:", updateError);
              }
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

            // Send subscription success email via MailerSend (non-blocking)
            const toEmail = firm.contact_email ?? undefined;
            if (toEmail) {
              const { sendSubscriptionSuccessEmail } = await import("@/lib/email/mailersend");
              sendSubscriptionSuccessEmail(toEmail, firm.name || "User", plan?.name ?? undefined).catch((err) => {
                if (process.env.NODE_ENV === "development") console.warn("Subscription email error:", err);
              });
            }
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

            let plan: { id: string; name?: string } | null = null;
            if (planId) {
              const { data: planData } = await supabaseAdmin
                .from("subscription_plans")
                .select("id, name")
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

            // Send subscription success email via MailerSend (non-blocking)
            const toEmail = firm.contact_email ?? undefined;
            if (toEmail) {
              const { sendSubscriptionSuccessEmail } = await import("@/lib/email/mailersend");
              sendSubscriptionSuccessEmail(toEmail, firm.name || "User", plan?.name).catch((err) => {
                if (process.env.NODE_ENV === "development") console.warn("Subscription email error:", err);
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const firmId = subscription.metadata?.firm_id;

        if (!firmId) {
          if (process.env.NODE_ENV === "development") {
            console.error("No firm_id in subscription metadata");
          }
          break;
        }

        // Verify firm exists
        const { data: firm } = await supabaseAdmin
          .from("firms")
          .select("id")
          .eq("id", firmId)
          .maybeSingle();

        if (!firm) {
          if (process.env.NODE_ENV === "development") {
            console.error("Firm not found for subscription update:", firmId);
          }
          break;
        }

        // current_period_end is a timestamp in seconds
        // Access current_period_end from the subscription object
        const periodEnd = "current_period_end" in subscription && typeof subscription.current_period_end === "number"
          ? subscription.current_period_end
          : Math.floor(new Date().getTime() / 1000) + 2592000; // Default to 30 days if not set
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
          if (process.env.NODE_ENV === "development") {
            console.error("Error updating firm subscription:", updateError);
          }
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
          if (process.env.NODE_ENV === "development") {
            console.error("No firm_id in subscription metadata");
          }
          break;
        }

        // Verify firm exists
        const { data: firm } = await supabaseAdmin
          .from("firms")
          .select("id")
          .eq("id", firmId)
          .maybeSingle();

        if (!firm) {
          if (process.env.NODE_ENV === "development") {
            console.error("Firm not found for subscription deletion:", firmId);
          }
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
          if (process.env.NODE_ENV === "development") {
            console.error("Error updating firm subscription:", updateError);
          }
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
        // Access subscription from invoice - it can be a string ID or a Subscription object
        const invoiceSubscription = "subscription" in invoice ? invoice.subscription : null;
        let subscriptionId: string | null = null;
        
        if (typeof invoiceSubscription === "string") {
          subscriptionId = invoiceSubscription;
        } else if (invoiceSubscription && typeof invoiceSubscription === "object" && invoiceSubscription !== null && "id" in invoiceSubscription && typeof invoiceSubscription.id === "string") {
          subscriptionId = invoiceSubscription.id;
        }

        if (subscriptionId && typeof subscriptionId === "string") {
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
        // Access subscription from invoice - it can be a string ID or a Subscription object
        const invoiceSubscription = "subscription" in invoice ? invoice.subscription : null;
        let subscriptionId: string | null = null;
        
        if (typeof invoiceSubscription === "string") {
          subscriptionId = invoiceSubscription;
        } else if (invoiceSubscription && typeof invoiceSubscription === "object" && invoiceSubscription !== null && "id" in invoiceSubscription && typeof invoiceSubscription.id === "string") {
          subscriptionId = invoiceSubscription.id;
        }

        if (subscriptionId && typeof subscriptionId === "string") {
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
        if (process.env.NODE_ENV === "development") {
          console.log(`Unhandled event type: ${event.type}`);
        }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Webhook processing failed";
    if (process.env.NODE_ENV === "development") {
      console.error("Error processing webhook:", error);
      console.error("Webhook error details:", {
        message: errorMessage,
        event_type: event?.type,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
