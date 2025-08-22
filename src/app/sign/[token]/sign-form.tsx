"use client";
import { useState } from "react";

export default function SignForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function submit() {
    await fetch("/api/contracts/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, email }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-6 rounded border p-4 bg-white">
      <h2 className="font-medium mb-2">Sign Contract</h2>
      <label className="block text-sm mb-1">Your full name</label>
      <input className="border p-2 rounded w-full mb-2" value={name} onChange={e=>setName(e.target.value)} />
      <label className="block text-sm mb-1">Email</label>
      <input className="border p-2 rounded w-full mb-2" value={email} onChange={e=>setEmail(e.target.value)} />
      <div className="text-xs text-neutral-600 mb-2">By clicking Sign, you agree to electronic records and signatures.</div>
      <button className="rounded-md bg-black px-3 py-2 text-white" onClick={submit}>Sign</button>
    </div>
  );
}
