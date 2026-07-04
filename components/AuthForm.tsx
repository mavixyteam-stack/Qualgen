"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <>
          <div>
            <label className="label" htmlFor="fullName">Your name</label>
            <input id="fullName" name="fullName" className="input" placeholder="Priya Sharma" required />
          </div>
          <div>
            <label className="label" htmlFor="orgName">Company / workspace</label>
            <input id="orgName" name="orgName" className="input" placeholder="Acme Inc" required />
          </div>
        </>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="you@company.com" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input"
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
        />
      </div>

      {error && (
        <p className="rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">{error}</p>
      )}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy && <Spinner />}
        {mode === "signup" ? "Create my workspace" : "Sign in"}
      </button>

      <p className="pt-2 text-center text-sm text-ink-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link className="font-semibold text-brand-600 hover:underline" href="/login">Sign in</Link></>
        ) : (
          <>New to Mavixy? <Link className="font-semibold text-brand-600 hover:underline" href="/signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
