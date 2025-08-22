import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const ws = await requireOrg();
  const settings = (ws.settingsJson as any) || { taxRate: 0, invoicePrefix: "INV-" };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <form action="/api/settings" method="post" className="rounded border bg-white p-4 space-y-3 text-sm">
        <label className="block">
          <span className="text-neutral-600">Invoice prefix</span>
          <input
            name="invoicePrefix"
            defaultValue={settings.invoicePrefix}
            className="mt-1 w-full rounded border p-2"
            placeholder="INV-"
          />
        </label>

        <label className="block">
          <span className="text-neutral-600">Tax rate (%)</span>
          <input
            name="taxRate"
            type="number"
            step="0.01"
            defaultValue={settings.taxRate ?? 0}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <button className="rounded-md bg-black px-3 py-2 text-white">Save</button>
      </form>

      <div className="rounded border bg-white p-4">
        <div className="text-xs text-neutral-600 mb-2">Raw settings (debug)</div>
        <pre className="bg-neutral-50 rounded p-2 text-xs overflow-auto">
{JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
}
