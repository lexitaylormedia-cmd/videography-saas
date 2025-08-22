"use client";
import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="rounded border px-3 py-2 text-sm"
      title={url}
    >
      {ok ? "Copied!" : "Copy Pay Link"}
    </button>
  );
}
