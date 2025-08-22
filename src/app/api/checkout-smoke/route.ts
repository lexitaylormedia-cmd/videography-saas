import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// ✅ Named GET export only
export async function GET(req: Request) {
  try {
    if (!STRIPE_KEY.startsWith("sk_")) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY (use a test key like sk_test_...)" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const amount = Number(url.searchParams.get("amountCents") || "5000"); // $50 default

    const stripe = new Stripe(STRIPE_KEY, {});
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // 👇 Force cards so Checkout has at least one method
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: "Stripe smoke test" },
          },
        },
      ],
      success_url: `${APP_URL}/?ok=1`,
      cancel_url: `${APP_URL}/?cancel=1`,
    });

    return NextResponse.redirect(session.url as string, 303);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
