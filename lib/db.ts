import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/qualgen";

const isLocal = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
const hasSslMode = /sslmode=/.test(DATABASE_URL);

declare global {
  // eslint-disable-next-line no-var
  var __qgSql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __qgMigrated: Promise<void> | undefined;
}

export const sql =
  globalThis.__qgSql ??
  postgres(DATABASE_URL, {
    prepare: false, // required for Supabase transaction pooler (pgbouncer)
    max: 4,
    idle_timeout: 20,
    ...(isLocal || hasSslMode ? {} : { ssl: "require" as const }),
  });

globalThis.__qgSql = sql;

const SCHEMA = /* sql */ `
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null default 500,
  demo_seeded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  title text,
  company text,
  email text,
  linkedin_url text,
  location text,
  industry text,
  source text not null default 'csv',
  status text not null default 'new',
  intent_score integer,
  intent_label text,
  enrichment jsonb,
  enriched_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists leads_org_idx on leads(org_id, created_at desc);
alter table leads add column if not exists coach jsonb;
alter table leads add column if not exists coach_at timestamptz;

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  goal text not null,
  product text,
  sender_name text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  launched_at timestamptz
);
create index if not exists campaigns_org_idx on campaigns(org_id, created_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  step integer not null default 1,
  subject text not null,
  body text not null,
  status text not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  sim_open_at timestamptz,
  sim_reply_at timestamptz,
  provider_id text,
  created_at timestamptz not null default now()
);
create index if not exists messages_campaign_idx on messages(campaign_id, lead_id, step);
create index if not exists messages_due_idx on messages(org_id, status, scheduled_at);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  body text not null,
  intent_score integer,
  intent_label text,
  reasoning text,
  created_at timestamptz not null default now()
);
create index if not exists replies_org_idx on replies(org_id, created_at desc);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  action text not null,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists tx_org_idx on credit_transactions(org_id, created_at desc);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists events_org_idx on events(org_id, created_at desc);
`;

export function ensureSchema(): Promise<void> {
  if (!globalThis.__qgMigrated) {
    globalThis.__qgMigrated = sql.unsafe(SCHEMA).then(() => undefined);
  }
  return globalThis.__qgMigrated;
}

export async function logEvent(
  orgId: string,
  type: string,
  description: string,
  opts: { campaignId?: string | null; leadId?: string | null } = {}
) {
  await sql`insert into events (org_id, campaign_id, lead_id, type, description)
    values (${orgId}, ${opts.campaignId ?? null}, ${opts.leadId ?? null}, ${type}, ${description})`;
}
