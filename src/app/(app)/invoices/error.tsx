"use client";

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-red-600 mb-2">Invoices crashed</h1>
      <p className="text-sm text-neutral-700 mb-3">
        You can try again. If it persists, share the message below.
      </p>
      <pre className="text-xs bg-neutral-50 border rounded p-3 overflow-auto">
{error?.message || String(error)}
      </pre>
      <button
        onClick={() => reset()}
        className="mt-3 rounded bg-black px-3 py-2 text-white text-sm"
      >
        Try again
      </button>
    </div>
  );
}
