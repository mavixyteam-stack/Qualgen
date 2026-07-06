import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/app");

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
