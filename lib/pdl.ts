/**
 * People Data Labs connector — real B2B lead discovery. Used when
 * PDL_API_KEY is set; otherwise the demo sample-lead factory supplies
 * results so the flow always works with zero spend.
 *
 * PDL's free tier is 100 person lookups/month, so we keep search sizes
 * modest and only ever count what PDL actually returns.
 */

import type { Icp, LeadInput } from "./types";

export function pdlLive(): boolean {
  return !!process.env.PDL_API_KEY;
}

/** Strip anything that could break the SQL string we build. */
function clean(s: string): string {
  return s.replace(/['"\\;%]/g, "").trim();
}

/** Maps our ICP into a PDL SQL query. PDL stores locations as lowercase names. */
function buildSql(icp: Icp, size: number): string {
  const conds: string[] = [];

  const titleWords = icp.titles.flatMap((t) =>
    clean(t).toLowerCase().split(/\s*&\s*|\s*,\s*|\//).map((w) => w.trim()).filter(Boolean)
  );
  if (titleWords.length) {
    const likes = [...new Set(titleWords)].slice(0, 6).map((w) => `job_title LIKE '%${w}%'`);
    conds.push(`(${likes.join(" OR ")})`);
  }

  // Locations can be cities or countries — match against locality or country.
  const locs = icp.locations.map((l) => clean(l).toLowerCase()).filter(Boolean);
  if (locs.length) {
    const parts = locs.slice(0, 6).flatMap((l) => [
      `location_locality='${l}'`,
      `location_country='${l}'`,
      `location_region='${l}'`,
    ]);
    conds.push(`(${parts.join(" OR ")})`);
  }

  const industries = icp.industries.map((i) => clean(i).toLowerCase()).filter(Boolean);
  if (industries.length) {
    const parts = industries.slice(0, 4).map((i) => `job_company_industry LIKE '%${i}%'`);
    conds.push(`(${parts.join(" OR ")})`);
  }

  const where = conds.length ? conds.join(" AND ") : "job_title IS NOT NULL";
  return `SELECT * FROM person WHERE ${where}`;
}

type PdlRecord = {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  job_company_name?: string;
  work_email?: string;
  recommended_personal_email?: string;
  emails?: { address?: string }[];
  linkedin_url?: string;
  location_name?: string;
  job_company_industry?: string;
};

function toLead(p: PdlRecord): LeadInput {
  const email =
    p.work_email ||
    p.emails?.find((e) => e.address)?.address ||
    p.recommended_personal_email ||
    null;
  const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown";
  return {
    name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
    title: p.job_title ?? null,
    company: p.job_company_name ?? null,
    email: email ? email.toLowerCase() : null,
    linkedin_url: p.linkedin_url ? (p.linkedin_url.startsWith("http") ? p.linkedin_url : `https://${p.linkedin_url}`) : null,
    location: p.location_name ?? null,
    industry: p.job_company_industry ?? null,
  };
}

export async function searchPDL(icp: Icp, count: number): Promise<LeadInput[]> {
  const size = Math.max(1, Math.min(count, 25)); // guard the free-tier budget
  const res = await fetch("https://api.peopledatalabs.com/v5/person/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.PDL_API_KEY!,
    },
    body: JSON.stringify({ sql: buildSql(icp, size), size, pretty: false }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 404 || res.status === 402) return []; // no matches / quota — caller handles
    throw new Error(`PDL ${res.status}: ${body?.error?.message || "search failed"}`);
  }
  const data = await res.json();
  const records: PdlRecord[] = data.data ?? [];
  return records.map(toLead);
}
