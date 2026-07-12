import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Explain instead of silently bouncing — "the page won't open" usually just
  // means "you're signed in as the wrong account on this domain".
  if (user.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card pop-in w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-pastel-lemon text-2xl">🛡️</div>
          <h1 className="text-xl font-extrabold tracking-tight">Admins only in here</h1>
          <p className="mt-2 text-sm text-ink-muted">
            You&rsquo;re signed in as <span className="font-bold text-ink">{user.email}</span>
            {" "}({user.role}). The control tower needs the{" "}
            <span className="font-bold text-ink">admin@mavixy.ai</span> account —
            sign out, then sign back in with it <em>on this same domain</em>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-primary btn-md">Switch account</Link>
            <Link href="/app" className="btn-secondary btn-md">Back to my workspace</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppNav orgName={user.orgName} userName={user.fullName} isAdmin />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 px-8 pb-2 pt-5">
          <span className="chip mr-auto bg-ink text-white">🛡️ Control tower — Mavixy internal</span>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-8 pb-10 pt-3">{children}</main>
      </div>
    </div>
  );
}
