import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function computeTotal(inv: any, settings: any) {
  if (typeof inv?.totalCents === "number") return inv.totalCents;
  if (typeof inv?.subtotalCents === "number" && typeof inv?.taxCents === "number") {
    return inv.subtotalCents + inv.taxCents;
  }
  try {
    const items = inv?.itemsJson as any[] | undefined;
    if (Array.isArray(items) && items.length) {
      const subtotal = items.reduce((sum, it) => {
        const unit =
          typeof it?.unitPriceCents === "number"
            ? it.unitPriceCents
            : Math.round((Number(it?.unitPrice || 0) * 100) || 0);
        const qty = Number(it?.quantity || 1);
        return sum + unit * qty;
      }, 0);
      const taxRate = Number(settings?.taxRate || 0);
      const tax = Math.round(subtotal * (taxRate / 100));
      return subtotal + tax;
    }
  } catch {}
  return 0;
}

export default async function InvoicesPage() {
  try {
    const ws = await requireOrg();
    const settings = (ws?.settingsJson as any) || { taxRate: 0, invoicePrefix: "INV-" };

    const invoices = await prisma.invoice.findMany({
      where: { workspaceId: ws.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Invoices</h1>
          <Link href="/invoices/new" className="rounded-md bg-black px-3 py-2 text-white">
            New Invoice
          </Link>
        </div>

        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-neutral-50 text-left">
                <th className="p-3">Number</th>
                <th className="p-3">Client</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => {
                const total = computeTotal(inv, settings);
                const number = inv?.number || inv.id.slice(0, 8);
                return (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link className="underline" href={`/invoices/${inv.id}`}>
                        {number}
                      </Link>
                    </td>
                    <td className="p-3">{inv?.client?.name || ""}</td>
                    <td className="p-3">{total ? formatUsd(total) : "—"}</td>
                    <td className="p-3 capitalize">{inv?.status || "sent"}</td>
                    <td className="p-3">
                      <Link className="rounded bg-black/80 px-2 py-1 text-white" href={`/invoices/${inv.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td className="p-3 text-neutral-500" colSpan={5}>
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold mb-2">Couldn’t load invoices</h1>
        <pre className="text-xs bg-neutral-50 border rounded p-3 overflow-auto">
{String(err?.message || err)}
        </pre>
      </div>
    );
  }
}
