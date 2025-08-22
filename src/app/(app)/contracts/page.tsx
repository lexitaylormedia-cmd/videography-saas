import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/auth";
import Link from "next/link";

export default async function ContractsPage() {
  const ws = await requireOrg();
  const contracts = await prisma.contract.findMany({
    where: { workspaceId: ws.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contracts</h1>
        <Link className="rounded-md bg-black px-3 py-2 text-white" href="/contracts/new">
          New Contract
        </Link>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 text-left">
              <th className="p-3">Title</th>
              <th className="p-3">Client</th>
              <th className="p-3">Status</th>
              <th className="p-3">Share</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3">{c.title}</td>
                <td className="p-3">{c.client?.name}</td>
                <td className="p-3">{c.status}</td>
                <td className="p-3">
                  <Link className="underline" href={`/sign/${c.signToken}`}>open signer link</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
