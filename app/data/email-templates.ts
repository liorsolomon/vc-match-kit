export interface EmailTemplate {
  id: string;
  stageKey: string;
  sectorKey: string;
  stageLabel: string;
  sectorLabel: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "b2b-saas-pre-seed",
    stageKey: "pre-seed",
    sectorKey: "B2B SaaS",
    stageLabel: "Pre-Seed",
    sectorLabel: "B2B SaaS",
    subject: "Pre-Seed intro — [Your Company] / B2B SaaS, $750K",
    body: `Hi [Partner Name],

I'm [Your Name], co-founder of [Your Company] — we're building [one-line description] for [target customer].

I came across [Fund Name] through your investment in [Portfolio Co] and thought you'd be a natural fit given your focus on early B2B SaaS at the pre-seed stage.

Three things I think will resonate with you:

1. **Traction:** [X] paying customers, $[ARR] ARR, growing [X]% MoM.
2. **Team:** [Co-founder 1] (prev. [Relevant Experience]) and [Co-founder 2] (prev. [Relevant Experience]).
3. **Why now:** [One sentence on the market shift or regulatory change that makes this the right moment.]

We're raising a $750K pre-seed to [specific milestone — e.g., hire 2 engineers and hit $20K MRR].

Happy to share a 1-page brief or deck. Would a 20-minute call work this week or next?

Best,
[Your Name]`,
  },
  {
    id: "fintech-seed",
    stageKey: "seed",
    sectorKey: "Fintech",
    stageLabel: "Seed",
    sectorLabel: "Fintech",
    subject: "Seed round — [Your Company] / Fintech, $2.5M",
    body: `Hi [Partner Name],

I'm [Your Name], founder of [Your Company] — we're [one-line description] for [target market].

[Fund Name]'s investment in [Portfolio Co] stood out to me as a signal that you understand the [specific Fintech niche — payments, lending, banking infra] space well. We're building in that same territory.

Where we are today:
- **$[GMV/Revenue]** processed to date, [X]% MoM growth
- **[X] active customers** — primarily [customer profile]
- **Regulatory path:** [brief note on licenses, compliance posture, or regulatory moat]

Our seed round ($2.5M) will fund [key milestones — e.g., state money-transmitter licenses in 12 states and first enterprise contract].

The macro context: [One compelling sentence about regulatory change, incumbent weakness, or market unlock driving urgency].

I'd love 25 minutes to walk you through the numbers and our go-to-market thesis. Open to a call or happy to send a deck first — your call.

Thanks,
[Your Name]`,
  },
  {
    id: "healthtech-series-a",
    stageKey: "series-a",
    sectorKey: "Health Tech",
    stageLabel: "Series A",
    sectorLabel: "Health Tech",
    subject: "Series A — [Your Company] / Digital Health, $8M",
    body: `Hi [Partner Name],

I'm [Your Name], CEO of [Your Company]. We help [target user] [core value proposition] — and we've reached the scale where a Series A makes sense.

I've been following [Fund Name] closely since your investment in [Portfolio Co]. Your focus on clinical-grade digital health at Series A is exactly the category we're playing in.

Current metrics:
- **$[ARR]** annual recurring revenue, [X]% YoY growth
- **[X] health systems / providers** contracted
- **Clinical validation:** [brief note — e.g., published outcomes data, IRB study, FDA clearance]
- **NPS:** [X] — driven by [key product differentiation]

We're raising $8M to [specific milestone — e.g., expand into 3 new health system networks and complete our FDA 510(k) submission].

The tailwind: [One sentence on regulatory shift, payer reimbursement change, or post-pandemic behavioral shift driving adoption].

I'd welcome a conversation. Happy to share our clinical data and deck ahead of any call.

Best,
[Your Name]`,
  },
  {
    id: "ai-pre-seed",
    stageKey: "pre-seed",
    sectorKey: "AI",
    stageLabel: "Pre-Seed",
    sectorLabel: "AI",
    subject: "Pre-Seed — [Your Company] / AI, $1M",
    body: `Hi [Partner Name],

I'm [Your Name], building [Your Company] — [one-line description of what the AI does and for whom].

[Fund Name] appeared on my shortlist after I looked closely at [Portfolio Co] — the thesis there maps well to what we're doing: AI that [shared thesis element].

Why we're worth a call:

- **Differentiated approach:** [One sentence on your technical moat — e.g., fine-tuned on proprietary data, novel architecture, defensible data flywheel].
- **Early validation:** [X] design partners, [X] weekly active users, or [X] LOIs from [target customer type].
- **Team:** [Co-founder 1] (prev. [Relevant AI/ML Experience]) and [Co-founder 2] (prev. [Domain Expertise]).

We're raising $1M to [specific milestone — e.g., ship v1, onboard 10 paying customers, and demonstrate the data flywheel].

The timing: foundation models have dropped the cost of [specific task] by 10×, creating a window to build something defensible before the incumbents react.

15 minutes? Happy to share a technical brief or live demo.

Thanks,
[Your Name]`,
  },
  {
    id: "climatetech-seed",
    stageKey: "seed",
    sectorKey: "Climate Tech",
    stageLabel: "Seed",
    sectorLabel: "Climate Tech",
    subject: "Seed intro — [Your Company] / Climate Tech, $3M",
    body: `Hi [Partner Name],

I'm [Your Name], co-founder of [Your Company] — we're [one-line description] targeting the [specific climate segment: grid, transport, carbon, built environment, etc.] market.

I've admired [Fund Name]'s portfolio since your investment in [Portfolio Co] — you clearly have conviction around [specific climate thesis element] and we're building directly in that path.

Current state:
- **Pilot results:** [Quantified outcome — e.g., 40% reduction in emissions, $X in cost savings per customer/year].
- **Commercial traction:** [X] signed pilots / [X] LOIs / $[Revenue] contracted ARR.
- **Unit economics:** [LTV/CAC or payback period — even if early].
- **Policy tailwind:** [IRA provision / EU regulation / state mandate] directly improves our CAC by [X].

We're raising $3M to [specific milestone — e.g., deploy 5 commercial sites and achieve project-level profitability].

I'd welcome a conversation to share our technical approach and go-to-market roadmap.

Best,
[Your Name]`,
  },
];

const DEFAULT_TEMPLATE: EmailTemplate = {
  id: "default",
  stageKey: "",
  sectorKey: "",
  stageLabel: "",
  sectorLabel: "",
  subject: "Intro — [Your Company] / Fundraising",
  body: `Hi [Partner Name],

I'm [Your Name], founder of [Your Company] — [one sentence on what you do and who you do it for].

I came across [Fund Name] through [referral / portfolio research / thesis alignment] and believe you'd be a strong fit for our raise given [specific reason tied to their thesis or portfolio].

Where we are:
- **Stage:** [Current stage — pre-seed, seed, Series A]
- **Traction:** [Key metric — revenue, users, GMV, or pilot results]
- **Team:** [Brief team credibility — prior exits, domain expertise, or operator background]
- **Ask:** Raising $[X] to [specific milestone]

The timing is right because [one sentence on market shift, regulatory change, or competitive window].

Happy to share a deck or jump on a call — whatever works best for you.

Thanks,
[Your Name]`,
};

export function pickTemplate(stage: string | undefined, sector: string | undefined): EmailTemplate {
  if (!stage && !sector) return DEFAULT_TEMPLATE;

  const normalizedStage = (stage ?? "").toLowerCase().trim();
  const normalizedSector = (sector ?? "").toLowerCase().trim();

  // Exact stage + sector match
  const exact = EMAIL_TEMPLATES.find(
    (t) =>
      t.stageKey.toLowerCase() === normalizedStage &&
      t.sectorKey.toLowerCase() === normalizedSector
  );
  if (exact) return exact;

  // Sector-only match (prefer higher stage specificity)
  if (sector) {
    const bySector = EMAIL_TEMPLATES.find(
      (t) => t.sectorKey.toLowerCase() === normalizedSector
    );
    if (bySector) return bySector;
  }

  // Stage-only match
  if (stage) {
    const byStage = EMAIL_TEMPLATES.find(
      (t) => t.stageKey.toLowerCase() === normalizedStage
    );
    if (byStage) return byStage;
  }

  return DEFAULT_TEMPLATE;
}
