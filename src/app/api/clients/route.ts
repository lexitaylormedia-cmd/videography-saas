import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export async function POST(req: Request) {
  const ws = await requireOrg();
  const form = await req.formData();
  const name = String(form.get("name") || "");
  const email = form.get("email") ? String(form.get("email")) : null;
  const company = form.get("company") ? String(form.get("company")) : null;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  await prisma.client.create({ data: { workspaceId: ws.id, name, email, company } });
  return NextResponse.redirect(new URL("/clients", req.url), 303);
}
