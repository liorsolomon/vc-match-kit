import WaitlistForm from "./waitlist-form";

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
          VC Match Kit
        </span>
        <div className="hidden sm:flex items-center gap-6 text-sm text-white/70">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a
            href="#cta"
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-4 py-1.5 rounded-full text-sm transition-colors"
          >
            Get Access →
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
            AI-Powered
          </span>
          <h1
            className="text-white font-black mb-6 leading-tight"
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              lineHeight: 1.1,
            }}
          >
            Stop Cold-Pitching<br />the Wrong VCs
          </h1>
          <p
            className="mb-10 max-w-xl mx-auto"
            style={{ color: "#CBD5E1", fontSize: "1.125rem", lineHeight: 1.65 }}
          >
            A curated database of pre-seed VCs — filtered by sector, stage, and check size —
            plus cold email templates that actually get replies.
          </p>

          <div className="flex justify-center">
            <WaitlistForm buttonText="Join the Waitlist (Free)" />
          </div>

          <p className="mt-5 text-sm" style={{ color: "#94A3B8" }}>
            <span style={{ color: "var(--color-success)" }}>✓</span>{" "}
            340+ pre-seed founders already on the waitlist
          </p>

          {/* Trust badges */}
          <div className="mt-10 flex items-center justify-center gap-8 opacity-40">
            {["Y-Comb.", "a16z", "Sequoia"].map((name) => (
              <span
                key={name}
                className="text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 border border-white/30 rounded"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="px-6 py-16"
        style={{ background: "var(--color-bg-alt)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-lg mb-12 max-w-2xl mx-auto"
            style={{ color: "var(--color-text-muted)" }}
          >
            &ldquo;Founders spend 40+ hours researching VCs for a single raise. Most of that research is wasted.&rdquo;
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: "12,000+", label: "VCs in database" },
              { stat: "94%", label: "match accuracy" },
              { stat: "3 hrs", label: "avg time saved" },
            ].map(({ stat, label }) => (
              <div
                key={label}
                className="bg-white rounded-xl p-8 border"
                style={{ borderColor: "var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="font-semibold mb-1"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "3rem",
                    color: "var(--color-accent)",
                    lineHeight: 1,
                  }}
                >
                  {stat}
                </div>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-20" style={{ background: "var(--color-bg)" }}>
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-center font-bold mb-12"
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "2.25rem",
              color: "var(--color-text-primary)",
            }}
          >
            Everything you need to land investor meetings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🎯",
                title: "Match",
                body: "AI-filters 12,000+ VCs by stage, sector, and check size — no wasted pitches to funds not investing at your stage.",
              },
              {
                icon: "✍️",
                title: "Outreach",
                body: "GPT-generated cold emails personalized per investor — plug in your metrics and send in minutes.",
              },
              {
                icon: "📊",
                title: "Track",
                body: "See who opened, replied, or passed — all in one dashboard so nothing falls through the cracks.",
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 border"
                style={{ borderColor: "var(--color-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-4"
                  style={{ background: "#EEF2FF" }}
                >
                  {icon}
                </div>
                <h3
                  className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1.375rem", color: "var(--color-text-primary)" }}
                >
                  {title}
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem", lineHeight: 1.6 }}>{body}</p>
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
            From startup idea to investor inbox in 3 steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { num: "01", title: "Describe your startup", body: "60-second intake: sector, stage, check size you need, and your traction." },
              { num: "02", title: "AI matches 20–50 VCs", body: "Curated to your exact profile — verified partner contacts, not generic inboxes." },
              { num: "03", title: "Send outreach in one click", body: "Personalized cold emails ready to send or export as CSV." },
            ].map(({ num, title, body }, i) => (
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

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20" style={{ background: "var(--color-bg)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-bold mb-3"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "2.25rem", color: "var(--color-text-primary)" }}
          >
            Simple pricing for indie founders
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "3rem" }}>
            No enterprise plans. No sales calls.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            {/* Free */}
            <div
              className="rounded-2xl p-8 border"
              style={{ background: "var(--color-bg-alt)", borderColor: "var(--color-border)" }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: "var(--color-text-muted)" }}
              >
                Free Preview
              </div>
              <div
                className="font-black mb-6"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "2.5rem", color: "var(--color-text-primary)" }}
              >
                $0
              </div>
              <ul className="space-y-3 text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
                {["10 VC matches", "1 outreach template"].map((item) => (
                  <li key={item} style={{ color: "var(--color-success)" }}>✓ <span style={{ color: "var(--color-text-muted)" }}>{item}</span></li>
                ))}
                {["Export CSV", "Full personalization"].map((item) => (
                  <li key={item} style={{ color: "var(--color-text-muted)" }}>✗ {item}</li>
                ))}
              </ul>
              <a
                href="#cta"
                className="block text-center font-semibold py-3 rounded-full border text-sm transition-colors hover:bg-white"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              >
                Try Free →
              </a>
            </div>

            {/* Paid */}
            <div
              className="rounded-2xl p-8 border-2 relative"
              style={{ background: "var(--color-primary)", borderColor: "var(--color-accent)" }}
            >
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: "var(--color-accent)" }}
              >
                Most Popular
              </span>
              <div className="text-xs font-semibold uppercase tracking-widest mb-4 text-white/60">
                Full Kit
              </div>
              <div
                className="font-black text-white mb-1"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "2.5rem" }}
              >
                $49
              </div>
              <div className="text-xs text-white/50 mb-6">one-time purchase</div>
              <ul className="space-y-3 text-sm mb-8 text-white">
                {[
                  "50 curated VCs matched to your profile",
                  "50 personalized cold emails",
                  "Export CSV",
                  "Tracking dashboard",
                ].map((item) => (
                  <li key={item} style={{ color: "var(--color-success)" }}>✓ <span className="text-white">{item}</span></li>
                ))}
              </ul>
              <a
                href="#cta"
                className="block text-center font-semibold py-3 rounded-full text-sm transition-colors"
                style={{ background: "var(--color-accent)", color: "white" }}
              >
                Get the Kit →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        id="cta"
        className="px-6 py-20 text-center"
        style={{ background: "var(--color-accent)" }}
      >
        <div className="max-w-2xl mx-auto">
          <h2
            className="font-black text-white mb-4"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Find the right VCs in minutes, not weeks
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join 340+ pre-seed founders already on the waitlist.
          </p>
          <div className="flex justify-center">
            <WaitlistForm buttonText="Get Early Access →" dark />
          </div>
          <p className="mt-4 text-white/60 text-xs">No spam. Unsubscribe any time.</p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-8 text-center text-sm"
        style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
      >
        <p>© 2026 VC Match Kit · AI-powered investor matching for pre-seed founders</p>
        <p className="mt-1">
          Built for indie founders. No enterprise fluff.
        </p>
      </footer>
    </div>
  );
}
