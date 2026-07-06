/**
 * Provider governance: the COGS ledger (what each external call costs us)
 * and runtime kill-switches the admin can flip without a redeploy.
 */

import { sql } from "./db";

/** Estimated cost per unit, in ₹ — the numbers behind the margin dashboard. */
export const PROVIDER_UNIT_COST: Record<string, number> = {
  pdl: 24.0, // per matched person ($0.28)
  resend: 0.09, // per email sent
  groq: 0, // free daily tier
  anthropic: 0.6, // per AI call, rough haiku-class estimate
  ipinfo: 0, // free tier
};

export async function recordCost(
  orgId: string | null,
  provider: string,
  action: string,
  units: number,
  reference?: string
) {
  const cost = (PROVIDER_UNIT_COST[provider] ?? 0) * units;
  try {
    await sql`insert into provider_costs (org_id, provider, action, units, cost_inr, reference)
      values (${orgId}, ${provider}, ${action}, ${units}, ${cost}, ${reference ?? null})`;
  } catch (err) {
    console.error("cost ledger write failed", err); // never block the action itself
  }
}

/* ------------------------- runtime kill-switches ------------------------- */

let switchCache: { at: number; map: Record<string, boolean> } | null = null;

/** Admin-controlled enable/disable per provider, cached ~20s per instance. */
export async function providerEnabled(provider: string): Promise<boolean> {
  try {
    if (!switchCache || Date.now() - switchCache.at > 20_000) {
      const rows = await sql`select provider, enabled from provider_settings`;
      switchCache = {
        at: Date.now(),
        map: Object.fromEntries(rows.map((r) => [r.provider, r.enabled])),
      };
    }
    return switchCache.map[provider] ?? true; // default: enabled
  } catch {
    return true;
  }
}

export function invalidateProviderCache() {
  switchCache = null;
}

/** Org workspace mode: demo workspaces never touch paid providers. */
export async function orgMode(orgId: string): Promise<"demo" | "live"> {
  const rows = await sql`select mode from orgs where id = ${orgId}`;
  return rows[0]?.mode === "demo" ? "demo" : "live";
}
