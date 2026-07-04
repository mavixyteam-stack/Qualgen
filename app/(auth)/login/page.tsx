import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in — Mavixy" };

export default async function LoginPage() {
  if (await getSession()) redirect("/app");
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-muted">Sign in to your Mavixy workspace.</p>
      <AuthForm mode="login" />
    </>
  );
}
