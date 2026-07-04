import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const FEATURES = [
  {
    emoji: "🔍",
    bg: "bg-pastel-sky",
    title: "AI Lead Discovery",
    body: "Describe your ideal customer in plain English. Mavixy finds matching prospects — or import your own CSV in seconds.",
  },
  {
    emoji: "🧠",
    bg: "bg-pastel-lavender",
    title: "Prospect Intelligence",
    body: "Every lead gets an AI-built intelligence card: pain points, buying signals, communication style, and personalization hooks.",
  },
  {
    emoji: "✍️",
    bg: "bg-pastel-peach",
    title: "Personalized Sequences",
    body: "3-touch email sequences written per prospect from real signals — never a template blast.",
  },
  {
    emoji: "🚀",
    bg: "bg-pastel-mint",
    title: "Campaigns That Send",
    body: "Launch in one click. Opens and replies tracked in real time while the sequence runs itself.",
  },
  {
    emoji: "🌡️",
    bg: "bg-pastel-lemon",
    title: "Intent Qualification",
    body: "AI reads every reply and scores buying intent 0–100. Cold, Warm, Hot, Sales Ready — automatically.",
  },
  {
    emoji: "🪙",
    bg: "bg-pastel-pink",
    title: "Pay Per Action",
    body: "Credits, not subscriptions. Every search, enrichment and send is metered — you pay for outcomes, not seats.",
  },
];

const STEPS = [
  { n: "01", title: "Find your prospects", body: "AI search or CSV import builds your lead list." },
  { n: "02", title: "Enrich & understand", body: "Intelligence cards reveal pain points and buying readiness." },
  { n: "03", title: "Launch the sequence", body: "Personalized 3-touch emails send on schedule." },
  { n: "04", title: "Close warm leads", body: "AI scores every reply — you only talk to high-intent prospects." },
];

const PACKS = [
  { name: "Starter", credits: "500", price: "₹599", note: "Solo founders testing the platform", featured: false },
  { name: "Growth", credits: "2,000", price: "₹1,999", note: "Small sales teams (2–5 people)", featured: true },
  { name: "Scale", credits: "5,000", price: "₹4,499", note: "Active sales teams (5–15 people)", featured: false },
];

export default async function Landing() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <main className="relative overflow-hidden">
      {/* pastel backdrop blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-pastel-lavender blur-3xl opacity-70" />
      <div aria-hidden className="pointer-events-none absolute top-24 -right-40 h-[420px] w-[420px] rounded-full bg-pastel-sky blur-3xl opacity-70" />
      <div aria-hidden className="pointer-events-none absolute top-[52rem] -left-40 h-[400px] w-[400px] rounded-full bg-pastel-mint blur-3xl opacity-60" />

      {/* nav */}
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500 text-lg font-black text-white">M</div>
          <span className="text-lg font-extrabold tracking-tight">Mavixy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost btn-md">Sign in</Link>
          <Link href="/signup" className="btn-primary btn-md">Get started free</Link>
        </div>
      </nav>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <span className="chip mx-auto bg-white text-brand-600 shadow-soft">
          ✨ AI SDR + Qualification Engine + Outreach Automation
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          Cold outbound in.
          <br />
          <span className="text-brand-500">Warm conversations</span> out.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">
          Mavixy discovers your ideal prospects, understands them deeply, writes outreach that
          references real signals — and hands your team only the leads that are ready to buy.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link href="/signup" className="btn-primary btn-lg">Start with 500 free credits</Link>
          <Link href="/login" className="btn-secondary btn-lg">See the demo</Link>
        </div>
        <p className="mt-4 text-sm text-ink-muted">No credit card. Demo-ready in 60 seconds.</p>
      </section>

      {/* features */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-7 transition hover:shadow-lift">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${f.bg}`}>
                {f.emoji}
              </div>
              <h3 className="text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          From cold list to closed deal
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card p-6">
              <div className="text-sm font-black text-brand-400">{s.n}</div>
              <h3 className="mt-2 font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pricing */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Simple, usage-based pricing</h2>
        <p className="mx-auto mt-3 max-w-md text-center text-ink-muted">
          Buy credits, spend them on actions. Signup includes <strong className="text-ink">500 free credits</strong> to run your first campaign.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PACKS.map((p) => (
            <div
              key={p.name}
              className={`card p-7 text-center ${p.featured ? "ring-2 ring-brand-400 shadow-lift" : ""}`}
            >
              {p.featured && <span className="chip mx-auto mb-3 bg-pastel-lavender text-brand-700">Most popular</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <div className="mt-3 text-4xl font-black tracking-tight">{p.price}</div>
              <div className="mt-1 text-sm font-semibold text-brand-500">{p.credits} credits</div>
              <p className="mt-3 text-sm text-ink-muted">{p.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="card overflow-hidden bg-brand-500 p-12 text-center text-white">
          <h2 className="text-3xl font-extrabold tracking-tight">Your next 10 warm leads are waiting.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Sign up, load the sample workspace, and see a full campaign — sends, opens, replies and
            intent scores — in under a minute.
          </p>
          <Link href="/signup" className="btn btn-lg mt-8 bg-white text-brand-600 hover:bg-brand-50">
            Get started free
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-ink/5 py-8 text-center text-sm text-ink-muted">
        Mavixy — AI Qualification & Outreach Platform · POC
      </footer>
    </main>
  );
}
