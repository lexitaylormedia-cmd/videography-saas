import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ws = await requireOrg();
  const form = await req.formData();
  const invoicePrefix = String(form.get("invoicePrefix") ?? "INV-");
  const taxRate = Number(form.get("taxRate") ?? 0);

  await prisma.workspace.update({
    where: { id: ws.id },
    data: { settingsJson: { invoicePrefix, taxRate } as any },
  });

  return NextResponse.redirect(new URL("/settings", req.url), 303);
}
