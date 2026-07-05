import { sql } from "./db";

/** Credit cost per action — mirrors the Mavixy execution plan. */
export const COSTS = {
  discover: 1, // per lead found via AI search
  enrich: 3, // per lead enriched
  personalize: 3, // per lead sequence generated
  email_send: 1, // per email sent
  intent_score: 1, // per reply scored
  coach: 2, // per AI sales-coach playbook
} as const;

export const SIGNUP_CREDITS = 500;

export class InsufficientCreditsError extends Error {
  constructor(public needed: number) {
    super(`Not enough credits (needs ${needed})`);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Atomically deducts credits; throws InsufficientCreditsError when the
 * balance can't cover it. Records a transaction with the balance after.
 */
export async function spendCredits(
  orgId: string,
  amount: number,
  action: keyof typeof COSTS | string,
  description: string
): Promise<number> {
  if (amount <= 0) throw new Error("amount must be positive");
  const rows = await sql`
    update orgs set credits = credits - ${amount}
    where id = ${orgId} and credits >= ${amount}
    returning credits`;
  if (!rows.length) throw new InsufficientCreditsError(amount);
  const balance = rows[0].credits as number;
  await sql`insert into credit_transactions (org_id, delta, balance_after, action, description)
    values (${orgId}, ${-amount}, ${balance}, ${action}, ${description})`;
  return balance;
}

export async function addCredits(
  orgId: string,
  amount: number,
  action: string,
  description: string
): Promise<number> {
  const rows = await sql`
    update orgs set credits = credits + ${amount}
    where id = ${orgId}
    returning credits`;
  const balance = rows[0].credits as number;
  await sql`insert into credit_transactions (org_id, delta, balance_after, action, description)
    values (${orgId}, ${amount}, ${balance}, ${action}, ${description})`;
  return balance;
}

export function creditError(err: unknown): Response | null {
  if (err instanceof InsufficientCreditsError) {
    return Response.json(
      { error: "Not enough credits for this action. Top up in the Credits page.", code: "insufficient_credits" },
      { status: 402 }
    );
  }
  return null;
}
