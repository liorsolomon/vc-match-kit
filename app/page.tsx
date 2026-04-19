import WaitlistForm from "./waitlist-form";

const WHY = [
  {
    title: "Curated, not scraped.",
    description: "We filter by active investment activity, not just who has \"investor\" in their LinkedIn bio.",
  },
  {
    title: "One-time fee.",
    description: "Foundersuite charges $528/yr. You pay once and own the list.",
  },
  {
    title: "Sector-specific.",
    description: "You tell us your stage and category; we deliver the relevant slice — not 10,000 names you have to sort yourself.",
  },
];

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Tell us your criteria",
    body: "Share your stage (pre-seed, seed, Series A), sector, and check size range.",
  },
  {
    num: "02",
    title: "We build your list",
    body: "We curate your investor list within 48 hours — filtered by active investment activity.",
  },
  {
    num: "03",
    title: "You get a structured spreadsheet",
    body: "Contact info, recent investments, and thesis notes. Yours to keep.",
  },
];

const FAQS = [
  {
    q: "How many investors are on the list?",
    a: "Typically 30–75 actively investing names, filtered to your criteria. Quality over quantity.",
  },
  {
    q: "Is this public data?",
    a: "Yes — all info is from public sources (Crunchbase, LinkedIn, firm websites, press). We save you the research time.",
  },
  {
    q: "Can I use this for angels, not just VCs?",
    a: "Yes. Specify what you're looking for and we include both.",
  },
  {
    q: "How is this different from a tool like Foundersuite or Landscape?",
    a: "We do the filtering for you and charge once. No monthly fee, no DIY database browsing.",
  },
  {
    q: "What if I'm pre-product?",
    a: "Tell us. Pre-seed and pre-product investors exist — your list will reflect that reality.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-inter), sans-serif" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-0"
        style={{ background: "var(--color-primary)", height: "60px" }}
      >
        <span
          className="text-white font-bold text-lg tracking-tight"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          vc.3vo.ai
        </span>
        <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a
            href="#get-it"
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-4 py-1.5 rounded-full text-sm transition-colors"
          >
            Get it — $147
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative px-6 pt-24 pb-32 text-center"
        style={{
          background: `linear-gradient(160deg, var(--color-primary) 0%, var(--color-primary) 55%, #FAFAFA 100%)`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <span
            className="inline-block text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
            style={{ background: "var(--color-accent)" }}
          >
            Curated · Delivered in 48 hours · $147 one-time
          </span>
          <h1
            className="text-white font-black mb-6 leading-tight"
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              lineHeight: 1.1,
            }}
          >
            Stop pitching cold.<br />Get in front of investors who are actually writing checks.
          </h1>
          <p
            className="mb-10 max-w-xl mx-auto"
            style={{ color: "#CBD5E1", fontSize: "1.125rem", lineHeight: 1.65 }}
          >
            A curated VC and angel investor list — filtered by stage, check size, sector, and recent
            deals. Not a database subscription. One-time. Yours to keep.
          </p>

          <div className="flex justify-center" id="get-it">
            <WaitlistForm buttonText="Get it — $147" />
          </div>

          <p className="mt-5 text-sm" style={{ color: "#94A3B8" }}>
            $147 — one-time · No subscription · Delivered in 48 hours
          </p>
        </div>
      </section>

      {/* Why vc.3vo.ai */}
      <section
        className="px-6 py-20"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-center font-bold mb-12"
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "2.25rem",
              color: "var(--color-text-primary)",
            }}
          >
            Why vc.3vo.ai
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {WHY.map(({ title, description }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 border"
                style={{ borderColor: "var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <h3
                  className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1.125rem", color: "var(--color-text-primary)" }}
                >
                  {title}
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="px-6 py-20"
        style={{ background: "var(--color-primary)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-bold text-white mb-16"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "2.25rem" }}
          >
            From criteria to investor inbox in 3 steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ num, title, body }, i) => (
              <div key={num} className="relative">
                {i < 2 && (
                  <div
                    className="hidden sm:block absolute top-8 left-full w-full h-px"
                    style={{ borderTop: "1px dashed rgba(79,70,229,0.4)", width: "calc(100% - 2rem)", left: "calc(50% + 2rem)" }}
                  />
                )}
                <div
                  className="font-semibold mb-3 block"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "4rem",
                    color: "rgba(79,70,229,0.35)",
                    lineHeight: 1,
                  }}
                >
                  {num}
                </div>
                <h3
                  className="font-bold text-white mb-2"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1.125rem" }}
                >
                  {title}
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "0.9375rem", lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market context */}
      <section className="px-6 py-16" style={{ background: "var(--color-bg-alt)" }}>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
          <div
            className="bg-white rounded-xl p-8 border"
            style={{ borderColor: "var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <div
              className="font-semibold mb-2"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "3rem",
                color: "var(--color-accent)",
                lineHeight: 1,
              }}
            >
              50+
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              investors the average founder contacts before closing a seed round
            </p>
          </div>
          <div
            className="bg-white rounded-xl p-8 border"
            style={{ borderColor: "var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
          >
            <div
              className="font-semibold mb-2"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "3rem",
                color: "var(--color-accent)",
                lineHeight: 1,
              }}
            >
              Weeks
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              wasted cold-pitching the wrong investor — plus credibility burned
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-20" style={{ background: "var(--color-bg)" }}>
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-bold text-center mb-12"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "2.25rem", color: "var(--color-text-primary)" }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl overflow-hidden"
                style={{ border: `1px solid var(--color-border)` }}
              >
                <summary
                  className="flex items-center justify-between px-6 py-4 cursor-pointer font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {faq.q}
                  <span className="ml-4 text-lg font-light group-open:rotate-45 transition-transform duration-200" style={{ color: "var(--color-accent)" }}>+</span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        id="get-it"
        className="px-6 py-20 text-center"
        style={{ background: "var(--color-accent)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Stop pitching cold. Start pitching right.
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Get your curated investor list — filtered to your stage, sector, and check size — in 48 hours.
          </p>
          <div className="flex justify-center">
            <WaitlistForm buttonText="Get it — $147" dark />
          </div>
          <p className="mt-4 text-white/60 text-xs">$147 — one-time · No subscription · Yours to keep</p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-8 text-center text-sm"
        style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
      >
        <p>© 2026 vc.3vo.ai</p>
        <p className="mt-1">— The 3vo.ai team</p>
      </footer>
    </div>
  );
}
