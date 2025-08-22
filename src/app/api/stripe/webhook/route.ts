import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY" },
      { status: 500 }
    );
  }

  // We need the raw body to verify the signature
  const signature = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(key, {});
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle successful checkouts
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = (session.metadata?.invoiceId as string) || null;

    if (invoiceId) {
      try {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "paid" } as any,
        });

        // Optional audit
        try {
          await prisma.auditEvent.create({
            data: {
              workspaceId: String(session.metadata?.workspaceId || ""),
              entityType: "invoice",
              entityId: invoiceId,
              action: "paid",
              meta: { stripeSessionId: session.id } as any,
            },
          });
        } catch {}
      } catch (e) {
        // If invoice not found, swallow (id may be wrong); you can log if desired
      }
    }
  }

  return NextResponse.json({ received: true });
}
