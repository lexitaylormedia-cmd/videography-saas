import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export const runtime = "nodejs";
export const revalidate = 0;

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const stripe = new Stripe(STRIPE_KEY, {}); // no apiVersion → avoids TS mismatch

function calcTotal(inv: any, settings: any) {
  if (typeof inv?.totalCents === "number") return inv.totalCents;
  if (typeof inv?.subtotalCents === "number" && typeof inv?.taxCents === "number") {
    return inv.subtotalCents + inv.taxCents;
  }
  try {
    const items = inv?.itemsJson as any[] | undefined;
    if (Array.isArray(items) && items.length) {
      const subtotal = items.reduce((sum, it) => {
        const priceCents =
          typeof it?.unitPriceCents === "number"
            ? it.unitPriceCents
            : Math.round((Number(it?.unitPrice || 0) * 100) || 0);
        const qty = Number(it?.quantity || 1);
        return sum + priceCents * qty;
      }, 0);
      const taxRate = Number(settings?.taxRate || 0);
      const tax = Math.round(subtotal * (taxRate / 100));
      return subtotal + tax;
    }
  } catch {}
  return 0;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!STRIPE_KEY) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const ws = await requireOrg();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!invoice || invoice.workspaceId !== ws.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Read JSON or form data; support amountCents or amountDollars
  const { amountCents } = await readAmount(req);

  const settings = (ws.settingsJson as any) || { taxRate: 0, invoicePrefix: "INV-" };
  const computed = calcTotal(invoice as any, settings);
  const amount = amountCents && amountCents > 0 ? amountCents : computed;

  if (!amount || amount < 50) {
    // redirect back with an error query (keeps things simple for forms)
    return NextResponse.redirect(`${APP_URL}/invoices/${invoice.id}?error=amount`, 303);
  }

  const number = (invoice as any).number || invoice.id.slice(0, 8);
  const logoUrl =
    (ws as any)?.brandingJson?.logoUrl || (settings as any)?.logoUrl || undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.client?.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: {
            name: `Invoice ${number}`,
            images: logoUrl ? [logoUrl] : [],
            description: invoice.client?.name ? `Client: ${invoice.client.name}` : undefined,
          },
        },
      },
    ],
    metadata: {
      invoiceId: invoice.id,
      workspaceId: ws.id,
    },
    success_url: `${APP_URL}/invoices/${invoice.id}?paid=1`,
    cancel_url: `${APP_URL}/invoices/${invoice.id}`,
  });

  // With HTML form posts, a redirect is ideal
  return NextResponse.redirect(session.url as string, 303);
}

async function readAmount(req: Request): Promise<{ amountCents?: number }> {
  // Try JSON first
  try {
    const json = await req.json();
    if (typeof json?.amountCents === "number") return { amountCents: json.amountCents };
  } catch {}

  // Then try form data
  try {
    const form = await req.formData();
    const centsStr = form.get("amountCents")?.toString();
    const dollarsStr = form.get("amountDollars")?.toString();
    if (centsStr) {
      const n = Number(centsStr);
      if (!Number.isNaN(n)) return { amountCents: n };
    }
    if (dollarsStr) {
      const d = parseFloat(dollarsStr);
      if (!Number.isNaN(d)) return { amountCents: Math.round(d * 100) };
    }
  } catch {}

  return {};
}
