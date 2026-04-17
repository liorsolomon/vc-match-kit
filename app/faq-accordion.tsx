'use client';

import { useState } from 'react';

const FAQS = [
  {
    q: "How is this different from Crunchbase or LinkedIn?",
    a: "Those are databases. This is a filtered match based on your specific stage, sector, and check size — plus outreach copy written for your profile. You don't browse, you get a list.",
  },
  {
    q: "How many VCs will I be matched with?",
    a: "Avg. 47 matched investors per search, filtered by stage, sector, and check size. You get verified partner contacts, not generic fund inboxes.",
  },
  {
    q: "Are the outreach templates personalizable?",
    a: "Yes — templates use [brackets] for custom details. Fill in your traction, round size, and thesis in under 10 minutes.",
  },
  {
    q: "Is this a one-time purchase?",
    a: "Yes. No subscription. Pay once, use it for your raise.",
  },
  {
    q: "Is this US-only?",
    a: "No — the database includes US, European, and emerging market investors across all major tech sectors.",
  },
  {
    q: "Do you guarantee VC responses?",
    a: "No. We guarantee matched contacts and tested outreach copy. Results depend on your pitch, traction, and timing — we give you the best possible starting point.",
  },
  {
    q: "What is your refund policy?",
    a: "30-day full refund, no questions asked. If the kit does not work for your raise, we will give you your money back.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg-alt)" }}
        >
          <button
            className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-white/5"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{faq.q}</span>
            <span className="shrink-0 text-xl font-bold" style={{ color: "var(--color-accent)" }}>
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
