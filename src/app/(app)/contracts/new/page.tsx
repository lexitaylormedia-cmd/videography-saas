import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";

export default async function NewContractPage() {
  const ws = await requireOrg();
  const clients = await prisma.client.findMany({ where: { workspaceId: ws.id } });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">New Contract</h1>
      <form action="/api/contracts" method="post" className="space-y-3">
        <label className="block">
          <span className="text-sm">Client</span>
          <select name="clientId" className="border p-2 rounded w-full">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <input className="border p-2 rounded w-full" name="title" defaultValue="Service Agreement" />
        <textarea className="border p-2 rounded w-full h-48" name="body"><p>Agreement body...</p></textarea>
        <button className="rounded-md bg-black px-3 py-2 text-white">Create &amp; Send</button>
      </form>
    </div>
  );
}
