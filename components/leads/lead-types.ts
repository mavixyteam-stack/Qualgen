import type { Enrichment } from "@/lib/types";

/** Serialized lead row passed from server pages to client components. */
export type LeadRow = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  linkedin_url: string | null;
  location: string | null;
  industry: string | null;
  source: string;
  status: string;
  intent_score: number | null;
  intent_label: string | null;
  enrichment: Enrichment | null;
  outcome: string | null;
  created_at: string;
};
