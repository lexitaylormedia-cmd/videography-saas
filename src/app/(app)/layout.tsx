import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[220px_1fr] min-h-screen">
      <aside className="border-r bg-white p-4 space-y-2">
        <div className="font-semibold mb-2">{process.env.NEXT_PUBLIC_APP_NAME || "Studio"}</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/clients">Clients</Link>
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/invoices">Invoices</Link>
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/contracts">Contracts</Link>
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/shoots">Shoots</Link>
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/settings">Settings</Link>
          <Link className="rounded px-2 py-1 hover:bg-neutral-100" href="/documents">Documents</Link>

        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
