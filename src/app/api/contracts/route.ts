import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import { randomUUID } from "node:crypto"; // safer import path for Next.js

export async function POST(req: Request) {
  const ws = await requireOrg();
  const form = await req.formData();
  const clientId = String(form.get("clientId"));
  const title = String(form.get("title") || "Service Agreement");
  const compiledHtml = String(form.get("body") || "<p>Agreement body...</p>");
  const token = randomUUID();

  await prisma.contract.create({
    data: {
      workspaceId: ws.id,
      clientId,
      title,
      compiledHtml,
      status: "sent",
      signToken: token,
    },
  });

  return NextResponse.redirect(new URL("/contracts", req.url), 303);
}
