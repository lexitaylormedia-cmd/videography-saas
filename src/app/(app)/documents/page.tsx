import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic"; // always show latest uploads

export default async function DocumentsPage() {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  let files: string[] = [];
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    files = (await fs.readdir(uploadDir)).sort().reverse();
  } catch {}

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Documents</h1>
      </div>

      <form action="/api/uploads" method="post" encType="multipart/form-data"
            className="rounded border bg-white p-4 space-y-3 text-sm">
        <input type="file" name="file" className="block w-full" required />
        <button className="rounded-md bg-black px-3 py-2 text-white">Upload</button>
      </form>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 text-left">
              <th className="p-3">File</th>
              <th className="p-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f} className="border-b last:border-0">
                <td className="p-3">{f}</td>
                <td className="p-3">
                  <a className="underline" href={`/uploads/${encodeURIComponent(f)}`} target="_blank" rel="noreferrer">view</a>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr><td className="p-3 text-neutral-500" colSpan={2}>No files yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
