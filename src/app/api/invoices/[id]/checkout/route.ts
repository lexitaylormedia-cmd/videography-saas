import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 0;

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const stripe = new Stripe(STRIPE_KEY || "sk_test_placeholder", {});

// ---------- helpers ----------
function calcTotal(inv: any, settings: any) {
  if (typeof inv?.totalCents === "number") return inv.totalCents;
  if (typeof inv?.subtotalCents === "number" && typeof inv?.taxCents === "number") {
    return inv.subtotalCents + inv.taxCents;
  }
  try {
    const items = inv?.itemsJson as any[] | undefined;
    if (Array.isArray(items) && items.length) {
      const subtotal = items.reduce((sum, it) => {
        const unit =
          typeof it?.unitPriceCents === "number"
            ? it.unitPriceCents
            : Math.round((Number(it?.unitPrice || 0) * 100) || 0);
        const qty = Number(it?.quantity || 1);
        return sum + unit * qty;
      }, 0);
      const taxRate = Number(settings?.taxRate || 0);
      const tax = Math.round(subtotal * (taxRate / 100));
      return subtotal + tax;
    }
  } catch {}
  return 0;
}

function readAmountFromSearch(req: Request): number | undefined {
  try {
    const url = new URL(req.url);
    const cents = url.searchParams.get("amountCents");
    const dollars = url.searchParams.get("amountDollars");
    if (cents && !Number.isNaN(Number(cents))) return Number(cents);
    if (dollars && !Number.isNaN(Number(dollars))) return Math.round(Number(dollars) * 100);
  } catch {}
  return undefined;
}

async function readAmountFromBody(req: Request): Promise<number | undefined> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      const j = await req.json();
      if (typeof j?.amountCents === "number") return j.amountCents;
    } catch {}
  } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    try {
      const f = await req.formData();
      const cents = f.get("amountCents");
      const dollars = f.get("amountDollars");
      if (cents && !Number.isNaN(Number(cents))) return Number(cents);
      if (dollars && !Number.isNaN(Number(dollars))) return Math.round(Number(dollars) * 100);
    } catch {}
  }
  return undefined;
}

async function startCheckout(params: { id: string }, amountFromReq?: number) {
  if (!STRIPE_KEY.startsWith("sk_")) {
    throw new Error("Missing/invalid STRIPE_SECRET_KEY in .env");
  }

  // 1) Load invoice + its workspace
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ws = await prisma.workspace.findUnique({ where: { id: invoice.workspaceId } });
  const settings = (ws?.settingsJson as any) || { taxRate: 0, invoicePrefix: "INV-" };

  // 2) Determine amount
  const computed = calcTotal(invoice as any, settings);
  const amount = amountFromReq && amountFromReq > 0 ? amountFromReq : computed;
  if (!amount || amount < 50) throw new Error("Amount missing or below $0.50");

  // 3) Branding/labels
  const number = (invoice as any).number || invoice.id.slice(0, 8);
  const logoUrl =
    (ws as any)?.brandingJson?.logoUrl || (settings as any)?.logoUrl || undefined;

  // 4) Stripe Checkout — force cards so it always has a payment method
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"], // 👈 important
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
    metadata: { invoiceId: invoice.id, workspaceId: invoice.workspaceId },
    success_url: `${APP_URL}/invoices/${invoice.id}?paid=1`,
    cancel_url: `${APP_URL}/invoices/${invoice.id}`,
  });

  return NextResponse.redirect(session.url as string, 303);
}

// ---------- route handlers ----------
export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const amount = readAmountFromSearch(req);
    return await startCheckout(ctx.params, amount);
  } catch (err: any) {
    const msg = encodeURIComponent(err?.message || "Checkout failed");
    return NextResponse.redirect(`${APP_URL}/invoices/${ctx.params.id}?error=${msg}`, 303);
  }
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  try {
    const amount = await readAmountFromBody(req);
    return await startCheckout(ctx.params, amount);
  } catch (err: any) {
    const msg = encodeURIComponent(err?.message || "Checkout failed");
    return NextResponse.redirect(`${APP_URL}/invoices/${ctx.params.id}?error=${msg}`, 303);
  }
}
