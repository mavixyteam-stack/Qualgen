"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui";

export function TopupButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function topup() {
    setBusy(true);
    await fetch("/api/credits/topup", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={topup} disabled={busy} className="btn-secondary btn-md">
      {busy && <Spinner />}
      ⚡ Add 500 demo credits
    </button>
  );
}
