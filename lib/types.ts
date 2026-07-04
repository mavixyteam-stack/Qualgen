export type Icp = {
  industries: string[];
  titles: string[];
  locations: string[];
  companySize: string;
  keywords: string[];
};

export type LeadInput = {
  name: string;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  location?: string | null;
  industry?: string | null;
};

export type Enrichment = {
  summary: string;
  painPoints: string[];
  hooks: string[];
  bestChannel: string;
  style: string;
  signals: string[];
  readiness: number; // 0-100 pre-engagement buying readiness estimate
};

export type SequenceStep = {
  step: number;
  subject: string;
  body: string;
};

export type IntentResult = {
  score: number; // 0-100
  label: "cold" | "warm" | "hot" | "ready";
  reasoning: string;
};

export const INTENT_META: Record<
  IntentResult["label"],
  { name: string; range: string }
> = {
  cold: { name: "Cold", range: "0–30" },
  warm: { name: "Warm", range: "31–60" },
  hot: { name: "Hot", range: "61–85" },
  ready: { name: "Sales Ready", range: "86–100" },
};
