import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export async function POST(req: Request) {
  const ws = await requireOrg();
  const form = await req.formData();
  const title = String(form.get("title"));
  const location = form.get("location") ? String(form.get("location")) : null;
  const clientId = form.get("clientId") ? String(form.get("clientId")) : null;
  const start = new Date(String(form.get("start")));
  const end = new Date(String(form.get("end")));
  const notes = form.get("notes") ? String(form.get("notes")) : null;

  await prisma.shoot.create({
    data: { workspaceId: ws.id, clientId, title, location, start, end, notes },
  });

  return NextResponse.redirect(new URL("/shoots", req.url), 303);
}
