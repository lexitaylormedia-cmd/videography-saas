import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export async function POST(req: Request) {
  const ws = await requireOrg();
  const form = await req.formData();
  const clientId = String(form.get("clientId"));
  const title = String(form.get("title") || "Service");
  const qty = Number(form.get("qty") || 1);
  const unitCents = Number(form.get("unitCents") || 0);
  const subtotal = qty * unitCents;
  const tax = 0;
  const total = subtotal + tax;

  const count = await prisma.invoice.count({ where: { workspaceId: ws.id } });
  const number = `INV-${String(count + 1).padStart(4, "0")}`;

  await prisma.invoice.create({
    data: {
      workspaceId: ws.id,
      clientId,
      number,
      subtotalCents: subtotal,
      taxCents: tax,
      totalCents: total,
      status: "sent",
      items: { create: [{ title, qty, unitCents }] },
    },
  });
  return NextResponse.redirect(new URL("/invoices", req.url), 303);
}
