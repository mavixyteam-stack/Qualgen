import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-pastel-lavender blur-3xl opacity-70" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full bg-pastel-mint blur-3xl opacity-70" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-xl font-black text-white">M</span>
          <span className="text-xl font-extrabold tracking-tight">Mavixy</span>
        </Link>
        <div className="card p-8">{children}</div>
      </div>
    </main>
  );
}
