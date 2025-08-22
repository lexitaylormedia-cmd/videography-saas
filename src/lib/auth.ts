// src/lib/auth.ts
import { prisma } from "./prisma";

/**
 * Safe fallback: always return a workspace.
 * If none exists, create a default one.
 */
export async function requireOrg() {
  let ws = await prisma.workspace.findFirst();
  if (!ws) {
    ws = await prisma.workspace.create({
      data: { name: "My Studio", slug: "studio" },
    });
  }
  return ws;
}
