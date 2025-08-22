set -euo pipefail

echo "== installing prisma packages =="
npm i -E @prisma/client prisma

echo "== writing .env =="
cat > .env <<'EOF'
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="Your Studio"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

echo "== writing prisma schema =="
mkdir -p prisma
cat > prisma/schema.prisma <<'EOF'
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model Workspace {
  id            String   @id @default(cuid())
  clerkOrgId    String?  @unique
  name          String
  slug          String   @unique
  brandingJson  Json?
  settingsJson  Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  members       Member[]
  clients       Client[]
  invoices      Invoice[]
  contractTemps ContractTemplate[]
  contracts     Contract[]
  shoots        Shoot[]
  documents     Document[]
  audits        AuditEvent[]
}

model Member {
  id          String   @id @default(cuid())
  workspaceId String
  userId      String
  role        String
  createdAt   DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@unique([workspaceId, userId])
}

model Client {
  id            String   @id @default(cuid())
  workspaceId   String
  name          String
  email         String?
  phone         String?
  company       String?
  notes         String?
  tags          String[] @default([])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invoices      Invoice[]
  contracts     Contract[]
  shoots        Shoot[]
}

model Invoice {
  id            String   @id @default(cuid())
  workspaceId   String
  clientId      String
  number        String
  status        String   @default("draft")
  issueDate     DateTime @default(now())
  dueDate       DateTime?
  currency      String   @default("USD")
  subtotalCents Int      @default(0)
  taxCents      Int      @default(0)
  totalCents    Int      @default(0)
  notes         String?
  pdfUrl        String?
  stripeInvoiceId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Restrict)
  items       InvoiceItem[]
}

model InvoiceItem {
  id         String  @id @default(cuid())
  invoiceId  String
  title      String
  qty        Int     @default(1)
  unitCents  Int     @default(0)
  invoice    Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}

model ContractTemplate {
  id            String   @id @default(cuid())
  workspaceId   String
  name          String
  description   String?
  body          String
  variables     String[] @default([])
  version       Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model Contract {
  id            String   @id @default(cuid())
  workspaceId   String
  clientId      String
  templateId    String?
  title         String
  compiledHtml  String
  status        String   @default("draft")
  signToken     String   @unique
  signerName    String?
  signerEmail   String?
  signedAt      DateTime?
  pdfUrl        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client      Client           @relation(fields: [clientId], references: [id], onDelete: Restrict)
  template    ContractTemplate @relation(fields: [templateId], references: [id])
}

model Shoot {
  id            String   @id @default(cuid())
  workspaceId   String
  clientId      String?
  title         String
  location      String?
  start         DateTime
  end           DateTime
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client      Client?   @relation(fields: [clientId], references: [id])
}

model Document {
  id            String   @id @default(cuid())
  workspaceId   String
  title         String
  content       String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model AuditEvent {
  id            String   @id @default(cuid())
  workspaceId   String
  entityType    String
  entityId      String
  action        String
  meta          Json?
  createdAt     DateTime @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}
EOF

echo "== creating src structure =="
mkdir -p src/lib src/app/api/clients src/app/api/invoices "src/app/(app)/clients" "src/app/(app)/invoices/new" "src/app/(app)"

echo "== writing src/lib/prisma.ts =="
cat > src/lib/prisma.ts <<'EOF'
import { PrismaClient } from "@prisma/client";
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({});
if (process.env.NODE_ENV !== "production") (globalForPrisma as any).prisma = prisma;
EOF

echo "== writing src/lib/auth.ts (demo workspace) =="
cat > src/lib/auth.ts <<'EOF'
import { prisma } from "@/lib/prisma";
export async function requireOrg() {
  let ws = await prisma.workspace.findUnique({ where: { slug: "demo" } });
  if (!ws) {
    ws = await prisma.workspace.create({ data: { slug: "demo", name: "Demo Workspace", clerkOrgId: null } } as any);
  }
  return ws;
}
EOF

echo "== ensure globals.css exists and add tiny style =="
mkdir -p src/app
touch src/app/globals.css
printf "\n.prose p { margin: 0.5rem 0; }\n" >> src/app/globals.css

echo "== write app layout with sidebar =="
cat > "src/app/(app)/layout.tsx" <<'EOF'
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] min-h-screen">
      <aside className="border-r bg-white p-4 space-y-2">
        <div className="font-semibold mb-2">{process.env.NEXT_PUBLIC_APP_NAME || "Studio"}</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/clients">Clients</Link>
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/invoices">Invoices</Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
EOF

echo "== write home page =="
cat > src/app/page.tsx <<'EOF'
export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
      <p>Use the left sidebar to open <strong>Clients</strong> or <strong>Invoices</strong>.</p>
    </div>
  );
}
EOF

echo "== write Clients page + API =="
cat > "src/app/(app)/clients/page.tsx" <<'EOF'
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const ws = await requireOrg();
  const clients = await prisma.client.findMany({ where: { workspaceId: ws.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <form action="/api/clients" method="post" className="flex gap-2">
          <input name="name" className="border p-2 rounded" placeholder="Name" required />
          <input name="email" className="border p-2 rounded" placeholder="Email" />
          <input name="company" className="border p-2 rounded" placeholder="Company" />
          <button className="rounded-md bg-black px-3 py-2 text-white">Add</button>
        </form>
      </div>
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Company</th>
              <th className="p-3">Tags</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.company}</td>
                <td className="p-3">{c.tags.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOF

cat > "src/app/api/clients/route.ts" <<'EOF'
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
EOF

echo "== write Invoices pages + API =="
cat > "src/app/(app)/invoices/page.tsx" <<'EOF'
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import Link from "next/link";

export default async function InvoicesPage() {
  const ws = await requireOrg();
  const invoices = await prisma.invoice.findMany({
    where: { workspaceId: ws.id },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <Link href="/invoices/new" className="rounded-md bg-black px-3 py-2 text-white">New Invoice</Link>
      </div>
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 text-left">
              <th className="p-3">Number</th>
              <th className="p-3">Client</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="p-3">{inv.number}</td>
                <td className="p-3">{inv.client?.name}</td>
                <td className="p-3">${(inv.totalCents/100).toFixed(2)}</td>
                <td className="p-3">{inv.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
EOF

mkdir -p "src/app/(app)/invoices/new"
cat > "src/app/(app)/invoices/new/page.tsx" <<'EOF'
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export default async function NewInvoicePage() {
  const ws = await requireOrg();
  const clients = await prisma.client.findMany({ where: { workspaceId: ws.id }, select: { id: true, name: true } });
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">New Invoice</h1>
      <form action="/api/invoices" method="post" className="space-y-3">
        <label className="block">
          <span className="text-sm">Client</span>
          <select name="clientId" className="border p-2 rounded w-full">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-6 gap-2">
          <input className="col-span-3 border p-2 rounded" name="title" defaultValue="Service" />
          <input type="number" className="col-span-1 border p-2 rounded" name="qty" defaultValue="1" />
          <input type="number" className="col-span-2 border p-2 rounded" name="unitCents" defaultValue="10000" />
        </div>
        <button className="rounded-md bg-black px-3 py-2 text-white">Create</button>
      </form>
    </div>
  );
}
EOF

cat > "src/app/api/invoices/route.ts" <<'EOF'
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
EOF

echo "== prisma migrate =="
npx prisma migrate dev --name init

echo "== all set. Run: npm run dev =="
