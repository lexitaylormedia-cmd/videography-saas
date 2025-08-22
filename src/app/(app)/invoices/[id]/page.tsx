import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import CopyLink from "@/components/copy-link";

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

export default async function InvoiceDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const ws = await requireOrg();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true },
  });

  if (!invoice || invoice.workspaceId !== ws.id) {
    return <div className="p-6">Invoice not found.</div>;
  }

  const settings: any = ws.settingsJson || { invoicePrefix: "INV-", taxRate: 0 };
  const number = (invoice as any).number || invoice.id.slice(0, 8);
  const status = ((invoice as any).status || "sent") as string;
  const totalCents = computeTotal(invoice as any, settings);

  const logoUrl =
    (ws as any)?.brandingJson?.logoUrl || (settings as any)?.logoUrl || null;

  // Public pay link (uses your APP_URL in .env when deployed; localhost fallback for dev)
  const publicUrl = `${process.env.APP_URL || "http://localhost:3000"}/pay/${invoice.id}`;

  const paidFlag = searchParams?.paid === "1";
  const errorMsg = typeof searchParams?.error === "string" ? searchParams?.error : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Flash banners */}
      {paidFlag && (
        <div className="rounded border border-green-200 bg-green-50 text-green-800 p-3 text-sm">
          Thanks! If this invoice doesn’t show as <strong>Paid</strong> yet, it will as soon as
          the Stripe webhook confirms the payment (usually a few seconds).
        </div>
      )}
      {errorMsg && (
        <div className="rounded border border-red-200 bg-red-50 text-red-800 p-3 text-sm">
          {decodeURIComponent(errorMsg)}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded" />
          ) : (
            <div className="h-10 w-10 rounded bg-black" />
          )}
          <div>
            <div className="text-lg font-semibold">{ws.name}</div>
            <div className="text-xs text-neutral-600">Invoice</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-500">Status</div>
          <div className="text-base font-medium capitalize">{status}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border bg-white p-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-neutral-500 text-xs">Invoice #</div>
            <div className="font-medium">{number}</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">Client</div>
            <div className="font-medium">{invoice.client?.name || "—"}</div>
            <div className="text-neutral-600">{invoice.client?.email || ""}</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">Issued</div>
            <div>{new Date(invoice.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">Total</div>
            <div className="text-lg font-semibold">
              {totalCents ? formatUsd(totalCents) : "—"}
            </div>
          </div>
        </div>

        {/* Pay + Copy Link */}
        <div className="mt-4 flex flex-col gap-2">
          {status.toLowerCase() === "paid" ? (
            <div className="inline-flex items-center rounded bg-green-600 px-3 py-2 text-white text-sm">
              Paid
            </div>
          ) : totalCents > 0 ? (
            <>
              <form method="post" action={`/api/invoices/${invoice.id}/checkout`}>
                <input type="hidden" name="amountCents" value={totalCents} />
                <input type="hidden" name="intent" value="pay" />
                <button type="submit" className="rounded-md bg-black px-3 py-2 text-white">
                  Pay Now
                </button>
              </form>
              <div className="text-xs text-neutral-500">Or share this link with your client:</div>
              <CopyLink url={publicUrl} />
            </>
          ) : (
            <>
              <form
                method="post"
                action={`/api/invoices/${invoice.id}/checkout`}
                className="flex items-center gap-2"
              >
                <input
                  name="amountDollars"
                  type="number"
                  min="0.50"
                  step="0.01"
                  placeholder="Amount (USD)"
                  className="border p-2 rounded"
                  required
                />
                <input type="hidden" name="intent" value="pay" />
                <button type="submit" className="rounded-md bg-black px-3 py-2 text-white">
                  Pay Now
                </button>
              </form>
              <div className="text-xs text-neutral-500">Or share this link with your client:</div>
              <CopyLink url={publicUrl} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
