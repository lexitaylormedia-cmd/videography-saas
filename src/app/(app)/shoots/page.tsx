import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import ShootsCalendar from "./calendar";

export default async function ShootsPage() {
  const ws = await requireOrg();
  const [clients, shoots] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: ws.id } }),
    prisma.shoot.findMany({
      where: { workspaceId: ws.id },
      include: { client: true },
      orderBy: { start: "asc" },
    }),
  ]);

  const events = shoots.map((s) => ({
    id: s.id,
    title: s.title + (s.client?.name ? ` — ${s.client.name}` : ""),
    start: s.start.toISOString(),
    end: s.end.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Shoots</h1>

      {/* Calendar */}
      <ShootsCalendar events={events} />

      {/* Add form */}
      <form action="/api/shoots" method="post" className="rounded border bg-white p-4 grid md:grid-cols-6 gap-2 text-sm">
        <input name="title" className="border p-2 rounded md:col-span-2" placeholder="Title (e.g. Wedding)" required />
        <input name="location" className="border p-2 rounded md:col-span-2" placeholder="Location" />
        <select name="clientId" className="border p-2 rounded md:col-span-2">
          <option value="">(No client)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="md:col-span-3">
          <span className="block text-xs text-neutral-500">Start</span>
          <input type="datetime-local" name="start" className="border p-2 rounded w-full" required />
        </label>
        <label className="md:col-span-3">
          <span className="block text-xs text-neutral-500">End</span>
          <input type="datetime-local" name="end" className="border p-2 rounded w-full" required />
        </label>
        <textarea name="notes" className="border p-2 rounded md:col-span-6" placeholder="Notes" />
        <div className="md:col-span-6">
          <button className="rounded-md bg-black px-3 py-2 text-white">Add Shoot</button>
        </div>
      </form>

      {/* List */}
      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 text-left">
              <th className="p-3">When</th>
              <th className="p-3">Title</th>
              <th className="p-3">Client</th>
              <th className="p-3">Location</th>
            </tr>
          </thead>
          <tbody>
            {shoots.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3">{new Date(s.start).toLocaleString()} – {new Date(s.end).toLocaleString()}</td>
                <td className="p-3">{s.title}</td>
                <td className="p-3">{s.client?.name || ""}</td>
                <td className="p-3">{s.location || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
