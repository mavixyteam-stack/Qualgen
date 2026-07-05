/**
 * Demo-mode intelligence. Everything in this file works with zero API keys
 * and zero cost. Output is deterministic per lead (seeded by id/email) so
 * demos are stable, but varied across leads so they feel real.
 */

import type { CoachCard, Enrichment, Icp, IntentResult, LeadInput, SequenceStep } from "./types";

/* ---------------------------------- RNG ---------------------------------- */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRng(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(rng: () => number, arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}

/* ----------------------------- ICP heuristics ----------------------------- */

const INDUSTRY_WORDS: Record<string, string[]> = {
  SaaS: ["saas", "software", "b2b software", "cloud"],
  Fintech: ["fintech", "finance", "payments", "banking", "lending"],
  "E-commerce": ["ecommerce", "e-commerce", "d2c", "retail", "marketplace"],
  Healthcare: ["health", "healthcare", "medtech", "clinic", "pharma"],
  EdTech: ["edtech", "education", "learning", "training"],
  "Real Estate": ["real estate", "proptech", "property"],
  Agency: ["agency", "agencies", "marketing agency", "consulting"],
  Logistics: ["logistics", "supply chain", "shipping", "freight"],
};

const TITLE_WORDS: Record<string, string[]> = {
  "Founder & CEO": ["founder", "ceo", "co-founder", "cofounder"],
  CTO: ["cto", "chief technology"],
  "VP of Sales": ["vp sales", "vp of sales", "sales leader", "sales vp"],
  "Head of Marketing": ["marketing", "cmo", "head of marketing", "growth"],
  "Head of Sales": ["head of sales", "sales head", "sales team"],
  "Revenue Operations Lead": ["revops", "revenue operations", "sales ops"],
};

const LOCATION_WORDS = [
  "Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Gurgaon",
  "San Francisco", "New York", "London", "Singapore", "Dubai", "Berlin",
];

export function parseIcpHeuristic(prompt: string): Icp {
  const p = prompt.toLowerCase();
  const industries = Object.keys(INDUSTRY_WORDS).filter((k) =>
    INDUSTRY_WORDS[k].some((w) => p.includes(w))
  );
  const titles = Object.keys(TITLE_WORDS).filter((k) =>
    TITLE_WORDS[k].some((w) => p.includes(w))
  );
  const locations = LOCATION_WORDS.filter((l) => p.includes(l.toLowerCase()));
  const sizeMatch = p.match(/(\d+)\s*(?:-|–|to)\s*(\d+)\s*(?:employees|people)?/);
  return {
    industries: industries.length ? industries : ["SaaS"],
    titles: titles.length ? titles : ["Founder & CEO"],
    locations: locations.length ? locations : ["Bangalore"],
    companySize: sizeMatch ? `${sizeMatch[1]}–${sizeMatch[2]} employees` : "11–50 employees",
    keywords: [],
  };
}

/* --------------------------- Sample lead factory --------------------------- */

const FIRST_NAMES = [
  "Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Karthik", "Meera",
  "Rohan", "Divya", "Aditya", "Kavya", "Nikhil", "Ishita", "Siddharth", "Tanvi",
  "Daniel", "Sarah", "Michael", "Emma", "James", "Olivia", "David", "Sophia",
];
const LAST_NAMES = [
  "Sharma", "Patel", "Reddy", "Iyer", "Mehta", "Nair", "Gupta", "Rao",
  "Krishnan", "Desai", "Malhotra", "Joshi", "Chen", "Miller", "Anderson",
  "Thompson", "Garcia", "Novak", "Fischer", "Kapoor",
];

const COMPANY_PARTS: Record<string, { pre: string[]; post: string[] }> = {
  SaaS: { pre: ["Cloud", "Stack", "Flow", "Pulse", "Nova", "Zen", "Metric", "Signal"], post: ["Labs", "HQ", "Works", "Base", "Desk", "Grid"] },
  Fintech: { pre: ["Pay", "Fin", "Ledger", "Mint", "Vault", "Credo"], post: ["Pay", "Fi", "Capital", "Money", "Works"] },
  "E-commerce": { pre: ["Cart", "Shop", "Swift", "Urban", "Prime"], post: ["Kart", "Bazaar", "Commerce", "Retail", "Store"] },
  Healthcare: { pre: ["Medi", "Care", "Vital", "Health", "Cura"], post: ["Care", "Health", "Clinic", "Life", "Med"] },
  EdTech: { pre: ["Learn", "Skill", "Bright", "Mentor", "Quiz"], post: ["Academy", "Learn", "Ed", "Campus", "Prep"] },
  "Real Estate": { pre: ["Nest", "Urban", "Brick", "Prop", "Habitat"], post: ["Homes", "Spaces", "Estates", "Realty", "Living"] },
  Agency: { pre: ["Spark", "Amplify", "North", "Bold", "Orbit"], post: ["Media", "Digital", "Collective", "Studio", "Partners"] },
  Logistics: { pre: ["Ship", "Fleet", "Cargo", "Route", "Swift"], post: ["Logistics", "Freight", "Chain", "Express", "Move"] },
};

export function generateSampleLeads(icp: Icp, count: number, seed: string): LeadInput[] {
  const rng = seededRng(seed);
  const leads: LeadInput[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (leads.length < count && guard++ < count * 20) {
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const industry = pick(rng, icp.industries);
    const parts = COMPANY_PARTS[industry] ?? COMPANY_PARTS.SaaS;
    const company = `${pick(rng, parts.pre)}${pick(rng, parts.post)}`;
    const key = `${first}-${last}-${company}`;
    if (used.has(key)) continue;
    used.add(key);
    const domain = `${company.toLowerCase()}.com`;
    leads.push({
      name: `${first} ${last}`,
      title: pick(rng, icp.titles),
      company,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
      linkedin_url: `https://linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${Math.floor(rng() * 900 + 100)}`,
      location: pick(rng, icp.locations),
      industry,
    });
  }
  return leads;
}

/* ------------------------------ Enrichment ------------------------------ */

const SIGNALS = [
  "Posted on LinkedIn about scaling outbound in the last 30 days",
  "Company listed 3 open SDR/BDR roles this quarter",
  "Recently announced a new funding round",
  "Engaged with content about sales automation tools",
  "Company website added a pricing page revamp recently",
  "Hiring aggressively across go-to-market roles",
  "Commented on a post about AI in sales workflows",
  "Company expanded to a second market this year",
  "Attended a SaaS growth conference last month",
  "Published a blog post about pipeline efficiency",
];

const PAIN_POINTS: Record<string, string[]> = {
  founder: [
    "Founder-led sales is hitting a ceiling — too many low-intent calls on the calendar",
    "No repeatable outbound process; every deal starts from scratch",
    "New sales hires ramp slowly without qualified pipeline to work",
    "Time split between product and pipeline means follow-ups slip",
  ],
  sales: [
    "SDR team spends most of the day on manual prospecting instead of conversations",
    "Reply rates on templated sequences have been declining quarter over quarter",
    "No reliable way to tell which leads are actually ready to buy",
    "Pipeline reviews are guesswork without intent data",
  ],
  marketing: [
    "MQLs hand-off to sales is leaky — most never get a timely follow-up",
    "Outbound and inbound messaging are inconsistent across channels",
    "Attribution on outbound touches is a black box",
    "Content engagement doesn't translate into booked meetings",
  ],
  tech: [
    "Evaluating tools but wary of heavy integrations and setup time",
    "Wants automation but needs guardrails on anything customer-facing",
    "Data quality across the stack is the recurring blocker",
    "Team bandwidth for go-to-market experiments is thin",
  ],
};

const STYLES = [
  "Direct and data-driven — leads with numbers, dislikes fluff",
  "Warm and conversational — responds to a personal, casual tone",
  "Skeptical and detail-oriented — wants specifics and proof",
  "Visionary and big-picture — engages with bold framing and outcomes",
  "Busy and to-the-point — short messages win, one clear ask",
];

function roleBucket(title: string | null | undefined): keyof typeof PAIN_POINTS {
  const t = (title || "").toLowerCase();
  if (/cto|engineer|tech|product/.test(t)) return "tech";
  if (/market|growth|cmo/.test(t)) return "marketing";
  if (/sales|revenue|revops|sdr|account/.test(t)) return "sales";
  return "founder";
}

export function enrichLeadDemo(lead: LeadInput & { id?: string }): Enrichment {
  const rng = seededRng(lead.id || lead.email || lead.name);
  const bucket = roleBucket(lead.title);
  const signals = pickN(rng, SIGNALS, 3);
  const pains = pickN(rng, PAIN_POINTS[bucket], 2);
  const style = pick(rng, STYLES);
  const readiness = Math.floor(rng() * 45 + 30); // 30–75
  const company = lead.company || "their company";
  const firstName = lead.name.split(" ")[0];

  const summary = `${firstName} is ${
    bucket === "founder" ? "a hands-on founder" :
    bucket === "sales" ? "a sales leader" :
    bucket === "marketing" ? "a growth-focused marketer" : "a technical decision-maker"
  } at ${company}${lead.location ? ` (${lead.location})` : ""}. ${signals[0]}. ${
    signals[1]
  }. Likely evaluating ways to make outbound more efficient without adding headcount.`;

  return {
    summary,
    painPoints: pains,
    hooks: [
      signals[0],
      `${company} is in ${lead.industry || "a competitive"} space where response speed wins deals`,
    ],
    bestChannel: pick(rng, ["Email", "Email, then LinkedIn", "LinkedIn, then email"]),
    style,
    signals,
    readiness,
  };
}

/* --------------------------- Sequence generation --------------------------- */

export function generateSequenceDemo(
  lead: LeadInput & { id?: string },
  enrichment: Enrichment | null,
  campaign: { goal: string; product?: string | null; senderName?: string | null }
): SequenceStep[] {
  const rng = seededRng((lead.id || lead.email || lead.name) + campaign.goal);
  const firstName = lead.name.split(" ")[0];
  const company = lead.company || "your team";
  const product = campaign.product || "Mavixy";
  const sender = campaign.senderName || "The Mavixy team";
  const hook = enrichment?.hooks?.[0] || `${company} is growing fast`;
  const pain = enrichment?.painPoints?.[0] ||
    "most teams lose hours every week on manual prospecting and unqualified calls";

  const opener = pick(rng, [
    `Noticed something while researching ${company}: ${hook.toLowerCase()}.`,
    `Came across ${company} this week — ${hook.toLowerCase()}.`,
    `Quick note after seeing that ${hook.toLowerCase()}.`,
  ]);

  const subject1 = pick(rng, [
    `${firstName} — a thought on ${company}'s outbound`,
    `Quick idea for ${company}`,
    `${company} + qualified pipeline`,
  ]);

  return [
    {
      step: 1,
      subject: subject1,
      body:
`Hi ${firstName},

${opener}

Teams at that stage usually run into the same wall: ${pain.toLowerCase()}.

${product} qualifies leads with AI before anyone on your team spends a minute on them — it enriches every prospect, personalizes the outreach, and only hands over the conversations that show real buying intent.

Worth a quick look? Happy to ${campaign.goal.toLowerCase().includes("demo") ? "show you a 15-minute demo" : "share how it would work for " + company}.

Best,
${sender}`,
    },
    {
      step: 2,
      subject: `Re: ${subject1}`,
      body:
`Hi ${firstName},

Following up on my last note — one number that usually gets attention: sales teams spend about 70% of their week on prospects who were never going to buy.

For ${company}, that's the gap ${product} closes. AI scores every reply for intent, so your team only talks to warm, qualified prospects.

If the timing's off, no stress — but if pipeline quality is on your radar this quarter, it's a 15-minute conversation.

Best,
${sender}`,
    },
    {
      step: 3,
      subject: `Last note, ${firstName}`,
      body:
`Hi ${firstName},

Closing the loop — I'll leave you with the short version:

• AI finds and enriches your ideal prospects
• Every message is personalized from real signals (like: ${hook.toLowerCase()})
• Only high-intent replies reach your team

If that's a problem worth solving at ${company}, reply "interested" and I'll send over details. Otherwise, I'll get out of your inbox.

Best,
${sender}`,
    },
  ];
}

/* ------------------------------ Reply pool ------------------------------ */

type DemoReply = { body: string; weight: number };

const REPLY_POOL: DemoReply[] = [
  { body: "This sounds interesting. What's the pricing like for a team of 5?", weight: 3 },
  { body: "We're actually evaluating tools like this right now. Can we set up a call this week?", weight: 2 },
  { body: "Interesting timing — we just hired two SDRs. Send me more details.", weight: 3 },
  { body: "Can you share a demo video or a deck? Want to loop in my co-founder.", weight: 3 },
  { body: "How is this different from Apollo or Instantly?", weight: 3 },
  { body: "Not a priority right now, but check back next quarter.", weight: 3 },
  { body: "Thanks, but we handle outbound in-house and it works fine.", weight: 2 },
  { body: "Not interested, please remove me from your list.", weight: 2 },
  { body: "Who gave you my email?", weight: 1 },
  { body: "What does onboarding look like? We got burned by a long setup last time.", weight: 2 },
  { body: "Price? And does it integrate with HubSpot?", weight: 2 },
  { body: "I'm not the right person for this — try our head of sales.", weight: 2 },
];

export function pickDemoReply(seed: string): string {
  const rng = seededRng(seed);
  const total = REPLY_POOL.reduce((s, r) => s + r.weight, 0);
  let roll = rng() * total;
  for (const r of REPLY_POOL) {
    roll -= r.weight;
    if (roll <= 0) return r.body;
  }
  return REPLY_POOL[0].body;
}

/* ---------------------------- Intent heuristics ---------------------------- */

const POSITIVE_STRONG = [
  "pricing", "price", "how much", "demo", "call this week", "set up a call",
  "book", "meeting", "trial", "evaluating", "send me more", "more details",
  "interested", "loop in", "integrate", "onboarding",
];
const POSITIVE_MILD = [
  "curious", "interesting", "tell me more", "deck", "video", "different from",
  "how is this", "what does",
];
const NEUTRAL_LATER = [
  "next quarter", "not a priority", "later", "busy", "check back", "not right now",
  "right person", "try our",
];
const NEGATIVE = [
  "not interested", "remove me", "unsubscribe", "no thanks", "stop emailing",
  "who gave you", "in-house and it works",
];

export function scoreReplyHeuristic(text: string): IntentResult {
  const t = text.toLowerCase();
  let score = 20;
  const matched: string[] = [];
  let strong = 0;
  let later = 0;
  for (const w of POSITIVE_STRONG) if (t.includes(w)) { strong++; score += 22; matched.push(`"${w}" (strong buying signal)`); }
  for (const w of POSITIVE_MILD) if (t.includes(w)) { score += 10; matched.push(`"${w}" (curiosity signal)`); }
  for (const w of NEUTRAL_LATER) if (t.includes(w)) { later++; score += 9; matched.push(`"${w}" (timing objection — interested, not now)`); }
  for (const w of NEGATIVE) if (t.includes(w)) { score -= 30; matched.push(`"${w}" (negative signal)`); }
  // Product/pricing questions are hot by definition (per the qualification rubric).
  if (strong >= 1) score = Math.max(score, 62);
  // Timing objections alone mean "warm, revisit later" — never hot.
  if (later > 0 && strong === 0) score = Math.min(score, 48);
  score = Math.max(2, Math.min(97, score));
  return {
    score,
    label: intentLabel(score),
    reasoning: matched.length
      ? `Detected ${matched.slice(0, 3).join(", ")}.`
      : "No strong intent signals detected in the reply.",
  };
}

export function intentLabel(score: number): "cold" | "warm" | "hot" | "ready" {
  if (score >= 86) return "ready";
  if (score >= 61) return "hot";
  if (score >= 31) return "warm";
  return "cold";
}

/* ------------------------------ Sales Coach ------------------------------ */

export function generateCoachDemo(
  lead: LeadInput & { id?: string; intent_score?: number | null; intent_label?: string | null },
  enrichment: Enrichment | null,
  lastReply: string | null
): CoachCard {
  const rng = seededRng((lead.id || lead.name) + "coach");
  const firstName = lead.name.split(" ")[0];
  const company = lead.company || "their company";
  const reply = (lastReply || "").toLowerCase();
  const pain = enrichment?.painPoints?.[0] || "making outbound efficient without adding headcount";
  const style = enrichment?.style || "Direct and to-the-point — one clear ask per message";

  const askedPricing = /pric|how much|cost|budget/.test(reply);
  const askedProof = /demo|deck|video|case|different|compare|apollo|instantly|evaluat/.test(reply);
  const askedTiming = /quarter|later|busy|not right now|next/.test(reply);
  const askedIntegration = /integrat|hubspot|crm|onboard|setup/.test(reply);
  const askedMeeting = /set up a call|book|meeting|talk this week|call this week|schedule/.test(reply);

  const objections: { objection: string; answer: string }[] = [];
  if (askedPricing) objections.push({
    objection: "Price sensitivity — they asked about cost before value was anchored",
    answer: `Anchor on outcome first: "teams like ${company} typically recover the cost with one closed deal." Then share the pack that fits their team size — never lead with the number.`,
  });
  if (askedProof) objections.push({
    objection: "Comparison shopping — they're evaluating against tools they know",
    answer: "Don't feature-battle. Position the difference: others stop at sending; we qualify intent and coach the close. Offer a 10-minute live walkthrough with their own leads.",
  });
  if (askedTiming) objections.push({
    objection: "Timing deflection — interested but protecting their calendar",
    answer: `Make it small: "totally get it — want me to send a 3-minute video now and a calendar link for early next quarter?" Keep the thread warm, don't push the meeting.`,
  });
  if (askedIntegration) objections.push({
    objection: "Setup anxiety — they've been burned by long onboardings",
    answer: `Lead with speed: first campaign live in under 15 minutes, no engineering needed. Offer to set it up together on the call.`,
  });
  if (!objections.length) objections.push({
    objection: "No explicit objection yet — the risk is losing momentum",
    answer: "Reply within the hour while interest is warm. Ask one concrete question about their current outbound process to open the conversation.",
  });

  const summary = lastReply
    ? `${firstName} at ${company} replied and is showing real interest${askedMeeting ? " — they asked for a call, which means the deal is theirs to lose, not yours to chase" : askedPricing ? " — they asked about pricing, which is a buying move, not a brush-off" : ""}${askedTiming ? " — timing is the friction, not desire" : ""}. Likely dealing with ${pain.toLowerCase()}. This conversation is winnable with a fast, specific follow-up.`
    : `${firstName} at ${company} hasn't replied yet, but their profile suggests ${pain.toLowerCase()}. The next touch should lead with their world, not our product.`;

  const wantToHear = [
    askedPricing
      ? "A clear, confident price anchored to an outcome — not a menu of plans"
      : "Proof this saves their team real hours in week one",
    `Something specific to ${company} — reference their space and stage, never generic praise`,
    pick(rng, [
      "That setup is instant and risk-free (free credits, no card)",
      "A number: what similar teams saw in reply-rate lift",
      "That they'll stay in control — AI drafts, humans approve",
    ]),
  ];

  const openingLine = lastReply
    ? pick(rng, [
        `"Great question — before numbers, can I ask how many deals ${company} loses to slow follow-up today?"`,
        `"Short answer: yes. Longer answer — worth 10 minutes with your own leads on screen?"`,
        `"Appreciate the reply! One question first: what does a good month of pipeline look like for ${company}?"`,
      ])
    : pick(rng, [
        `"Saw what ${company} is building — one idea specific to your outbound that takes 30 seconds to explain."`,
        `"Most ${lead.industry || "B2B"} teams your size lose 20 hours a week to prospecting — is that true at ${company}?"`,
      ]);

  const nextAction = askedMeeting
    ? "They asked for the call — reply within the hour with two concrete time slots (not a calendar link alone). Confirm today, meet this week."
    : askedPricing
    ? "Send pricing WITH a 15-minute call slot in the same message — pricing alone closes threads, pricing + conversation opens them."
    : askedProof
    ? "Send a 3-minute personalized demo video (their leads on screen) and offer a live walkthrough this week."
    : askedTiming
    ? "Book the future meeting now and set a light nurture touch in 3 weeks — do not chase weekly."
    : "Call or reply within the hour. Speed is the whole game on warm leads.";

  return { dealSummary: summary, wantToHear, objections: objections.slice(0, 2), openingLine, nextAction, styleTip: style };
}
