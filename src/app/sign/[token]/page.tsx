import { prisma } from "@/lib/prisma";
import SignForm from "./sign-form";

export default async function SignPage({ params }: { params: { token: string } }) {
  const contract = await prisma.contract.findUnique({ where: { signToken: params.token } });
  if (!contract) return <div className="p-8">Invalid link.</div>;
  if (contract.status === "signed") return <div className="p-8">Already signed. Thanks!</div>;
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">{contract.title}</h1>
      <div className="prose max-w-none bg-white p-4 border rounded" dangerouslySetInnerHTML={{ __html: contract.compiledHtml }} />
      <SignForm token={params.token} />
    </div>
  );
}
