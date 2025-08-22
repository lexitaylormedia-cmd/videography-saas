import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const ws = await requireOrg();

  // 1) Find (or create) a demo client WITHOUT using a unique field
  let client = await prisma.client.findFirst({
    where: { workspaceId: ws.id },
    orderBy: { createdAt: "asc" },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        workspaceId: ws.id,
        name: "Demo Client",
        email: "demo-client@example.com", // fine even if not unique
      },
    });
  }

  // 2) Find (or create) a demo invoice with only safe fields
  let invoice = await prisma.invoice.findFirst({
    where: { workspaceId: ws.id, clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        workspaceId: ws.id,
        clientId: client.id,
        status: "sent", // cast to any in case your schema uses an enum
      } as any,
    });
  }

  return NextResponse.json({
    ok: true,
    workspaceId: ws.id,
    clientId: client.id,
    invoiceId: invoice.id,
  });
}

// Allow POST too, in case you prefer to call it from a form
export const POST = GET;
