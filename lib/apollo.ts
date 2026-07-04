/**
 * Apollo.io lead search. Used when APOLLO_API_KEY is set; otherwise the demo
 * sample-lead factory supplies results so the flow works with zero spend.
 */

import type { Icp, LeadInput } from "./types";

export function apolloLive(): boolean {
  return !!process.env.APOLLO_API_KEY;
}

export async function searchApollo(icp: Icp, count: number): Promise<LeadInput[]> {
  const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.APOLLO_API_KEY!,
    },
    body: JSON.stringify({
      person_titles: icp.titles,
      person_locations: icp.locations,
      q_keywords: [...icp.industries, ...icp.keywords].join(" "),
      per_page: Math.min(count, 100),
      page: 1,
    }),
  });
  if (!res.ok) throw new Error(`Apollo search failed (${res.status})`);
  const data = await res.json();
  const people: Record<string, unknown>[] = data.people ?? [];
  return people.slice(0, count).map((p) => {
    const org = (p.organization ?? {}) as Record<string, unknown>;
    return {
      name: String(p.name ?? (`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unknown")),
      title: (p.title as string) ?? null,
      company: (org.name as string) ?? null,
      email: (p.email as string) ?? null,
      linkedin_url: (p.linkedin_url as string) ?? null,
      location: [p.city, p.country].filter(Boolean).join(", ") || null,
      industry: (org.industry as string) ?? null,
    };
  });
}
