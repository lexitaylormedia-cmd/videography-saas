// src/app/(app)/invoices/[id]/checkout/route.ts
import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Create Stripe only when a request hits the route
function getStripe(): Stripe {
  const key =
    process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || "";
  if (!key) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY is missing).");
  }
  // Cast to any to satisfy types across stripe versions
  return new Stripe(key, { apiVersion: "2024-06-20" } as any);
}

export async function GET() {
  // Simple health hint
  return Response.json({
    ok: true,
    route: "/invoices/[id]/checkout",
    hint: "POST here with no body to start Stripe Checkout for the invoice.",
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stripe = getStripe();

    const invoiceId = params.id;

    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!inv) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    // itemsJson is stored as array of { description, amount, quantity? }
    const items: Array<{
      description: string;
      amount: number; // in cents
      quantity?: number;
    }> = (inv as any).itemsJson || [];

    const line_items = items.map((i) => ({
      price_data: {
        currency: (inv as any).currency || "usd",
        product_data: { name: i.description || "Line item" },
        unit_amount: i.amount,
      },
      quantity: i.quantity ?? 1,
    }));

    // fallback to request origin if APP_URL isn't set
    const origin =
      process.env.APP_URL || new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      metadata: { invoiceId },
      success_url: `${origin}/invoices/${invoiceId}?paid=1`,
      cancel_url: `${origin}/invoices/${invoiceId}?canceled=1`,
    });

    return Response.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    // Never crash the build; return a clear JSON error at runtime.
    return Response.json(
      { error: err?.message || "Stripe error" },
      { status: 500 }
    );
  }
}
