import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create account — Mavixy" };

export default async function SignupPage() {
  if (await getSession()) redirect("/app");
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Create your workspace</h1>
      <p className="mb-6 mt-1.5 text-sm text-ink-muted">
        Starts with <span className="font-semibold text-brand-600">500 free credits</span> — enough for a full test campaign.
      </p>
      <AuthForm mode="signup" />
    </>
  );
}
