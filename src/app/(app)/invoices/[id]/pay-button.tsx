"use client";
import { useState } from "react";

export default function PayButton({
  invoiceId,
  allowAmountEntry = false,
}: {
  invoiceId: string;
  allowAmountEntry?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>("");

  async function pay() {
    try {
      setLoading(true);
      const payload: Record<string, unknown> = {};
      if (allowAmountEntry) {
        const dollars = parseFloat(amount || "0");
        const cents = Math.round((isNaN(dollars) ? 0 : dollars) * 100);
        if (!cents || cents < 50) {
          alert("Please enter an amount of at least $0.50");
          return;
        }
        payload.amountCents = cents;
      }

      const res = await fetch(`/api/invoices/${invoiceId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(payload).length ? JSON.stringify(payload) : undefined,
      });

      const data = await res.json();
      if (data?.url) window.location.href = data.url as string;
      else alert(data?.error || "Unable to start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {allowAmountEntry && (
        <input
          type="number"
          min="0.50"
          step="0.01"
          placeholder="Amount (USD)"
          className="border p-2 rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      )}
      <button
        onClick={pay}
        className="rounded-md bg-black px-3 py-2 text-white"
        disabled={loading}
      >
        {loading ? "Redirecting…" : "Pay Now"}
      </button>
    </div>
  );
}
