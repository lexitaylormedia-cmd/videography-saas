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
