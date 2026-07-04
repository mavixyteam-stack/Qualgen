# Mavixy — AI Lead Qualification & Outreach Platform (POC)

**Turn cold outbound into personalized, intent-aware conversations that generate warm
opportunities — automatically.**

This is the demo-ready proof of concept covering the full POC scope from the execution plan:

| POC feature | Status |
|---|---|
| User authentication (signup / login / organization) | ✅ |
| Lead import from CSV (column mapping, validation, dedup) | ✅ |
| AI lead search from a plain-English ICP prompt | ✅ |
| AI enrichment + prospect intelligence cards | ✅ |
| AI-generated personalized 3-touch email sequences | ✅ |
| Email campaigns that actually send (Resend) with open tracking | ✅ |
| Intent scoring of replies (0–100, Cold/Warm/Hot/Sales Ready) | ✅ |
| Dashboard: sends, opens, replies, intent pipeline, live activity | ✅ |
| Credit wallet: deduction per action + transaction log | ✅ |

## The zero-budget trick: Demo Mode

The app runs perfectly with **no API keys and no spend**. Every AI/email engine has two
implementations behind one interface:

- **Demo engine (default)** — built-in intelligence generates enrichment cards, personalized
  sequences and intent scores; email sends are simulated with realistic opens & replies that
  stream in live during a demo. Deterministic, free, never breaks mid-pitch.
- **Live engine** — set an environment variable and that engine flips to the real thing.
  No code changes.

| Env var | What goes live |
|---|---|
| `ANTHROPIC_API_KEY` | Claude writes enrichment, sequences, intent scores |
| `RESEND_API_KEY` | Emails really send, opens tracked via pixel |
| `APOLLO_API_KEY` | AI search pulls real prospects from Apollo.io |

The header badges always show which mode each engine is in — honest for demos.

## Deploying (no coding needed)

Follow **[SETUP.md](./SETUP.md)** — a step-by-step guide to put this live on Supabase (free
database) + Vercel (free hosting) in about 15 minutes, written for non-developers.

## Running locally (for developers)

```bash
npm install
# point DATABASE_URL at any Postgres — tables are created automatically on first request
DATABASE_URL=postgres://postgres:postgres@localhost:5432/qualgen \
SESSION_SECRET=dev-secret \
npm run dev
```

## Architecture

- **Next.js 15 (App Router) + Tailwind CSS** — UI and API routes in one deployable unit
- **Postgres** (Supabase) — schema auto-migrates on boot (`lib/db.ts`)
- **Cookie-session auth** (JWT via `jose`, bcrypt password hashing) — `lib/auth.ts`
- **Credit wallet** with atomic deductions and a full ledger — `lib/credits.ts`
- **AI layer** with Claude + deterministic fallback — `lib/ai.ts`, `lib/demo.ts`
- **Outreach engine** — scheduled sends, open pixel, reply capture, intent scoring —
  `lib/process.ts`, polled by the app shell every 15s while the dashboard is open
- **Sample workspace seeder** for instant demos — `lib/seed.ts`

### Credit costs (as per the plan)

| Action | Credits |
|---|---|
| Lead discovery (AI search) | 1 / lead |
| AI enrichment | 3 / lead |
| AI sequence generation | 3 / lead |
| Email send | 1 / email |
| Intent scoring | 1 / reply |
| CSV import | free |

New workspaces start with **500 free credits**.

## What's next (MVP phase)

Stripe credit purchases · team invites & roles · conditional sequence branching · admin
panel · click/bounce tracking · low-credit alerts — see the execution plan.
