"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui";

export function SeedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/demo/seed", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Seeding failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={seed} disabled={busy} className="btn-primary btn-md">
        {busy && <Spinner />}
        {busy ? "Building your sample workspace…" : "⚡ Load sample workspace"}
      </button>
      {error && <p className="text-xs font-medium text-accent-pink">{error}</p>}
    </div>
  );
}
