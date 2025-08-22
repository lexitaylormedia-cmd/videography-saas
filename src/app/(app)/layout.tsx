// src/app/(app)/layout.tsx
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r bg-white dark:bg-neutral-950 p-4 space-y-3">
        <div className="text-base font-semibold">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "Studio"}
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-1 text-sm">
          <NavItem href="/clients" label="Clients" />
          <NavItem href="/invoices" label="Invoices" />
          <NavItem href="/contracts" label="Contracts" />
          <NavItem href="/shoots" label="Shoots" />
          <NavItem href="/settings" label="Settings" />
          <NavItem href="/documents" label="Documents" />
        </nav>
      </aside>

      <main className="p-6">{children}</main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
    >
      {label}
    </Link>
  );
}
