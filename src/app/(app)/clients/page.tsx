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
                <td className="p-3">{(c.tagsCsv || "").split(",").filter(Boolean).join(", ")}</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
