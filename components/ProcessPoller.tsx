"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the workspace alive: ticks the outreach engine every 15 seconds while
 * the app is open (sends due emails, materializes demo opens/replies) and
 * refreshes the UI when anything changed.
 */
export function ProcessPoller() {
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    async function tick() {
      if (busy.current || document.hidden) return;
      busy.current = true;
      try {
        const res = await fetch("/api/process", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.changed > 0) router.refresh();
        }
      } catch {
        // network hiccup — next tick will retry
      } finally {
        busy.current = false;
      }
    }
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
