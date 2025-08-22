import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as unknown as File | null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = (file.name || "upload").replace(/[^\w.\-]+/g, "_");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, `${Date.now()}-${safeName}`);
  await fs.writeFile(filePath, bytes);

  return NextResponse.redirect(new URL("/documents", req.url), 303);
}
