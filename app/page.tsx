import WaitlistForm from "./waitlist-form";

const DELIVERABLES = [
  {
    icon: "🔍",
    title: "Competitor Landscape",
    description:
      "A mapped overview of the top 5–8 direct and indirect competitors in your niche — what they charge, how they position, and where the gaps are.",
  },
  {
    icon: "📈",
    title: "Demand Signals",
    description:
      "Search volume trends, community activity, and keyword data that show whether people are actively looking for what you want to build.",
  },
  {
    icon: "💰",
    title: "Pricing Benchmarks",
    description:
      "A clear pricing range across the market — from free to premium — so you can position and price with confidence from day one.",
  },
  {
    icon: "🎯",
    title: "ICP Profile",
    description:
      "A detailed Ideal Customer Profile: who they are, what they're struggling with, where they hang out, and what they'll pay for a solution.",
  },
  {
    icon: "⚡",
    title: "Opportunity Score",
    description:
      "A plain-English verdict on niche viability — high, medium, or low — with the reasoning behind it so you can decide whether to proceed.",
  },
  {
    icon: "📄",
    title: "Notion + PDF Bundle",
    description:
      "The full report in a clean, navigable Notion workspace plus a shareable PDF — ready to use as your research foundation or co-founder deck.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I spent two weeks doing this research manually for my last project and still felt uncertain. With this report I had a clear yes/no in 48 hours. Completely changed how I approach validation.",
    name: "— James K., Indie Hacker",
  },
  {
    quote:
      "The ICP profile alone was worth $49. I've been guessing at my target customer for months. This gave me a concrete profile I could actually write copy for.",
    name: "— Priya S., Solopreneur",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[var(--font-geist-sans)]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="font-bold text-lg tracking-tight">3vo Niche Reports</div>
        <a
          href="#order"
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors"
        >
          Validate My Niche
        </a>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-3xl mx-auto">
        <div className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
          AI-Powered · Delivered in 48 Hours · Starting at $49
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900">
          Validate Your Niche in 48 Hours{" "}
          <span className="text-indigo-600">— Not 48 Days</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed">
          Stop guessing. Get a structured market validation report for your niche —
          competitors, demand signals, pricing benchmarks, and an ICP profile —
          delivered as a Notion + PDF bundle. Starting at $49.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md">
          <WaitlistForm ctaLabel="Validate My Niche — Starting at $49" />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Enter your email to get early access · First reports shipping now
        </p>
      </section>

      {/* Social proof bar */}
      <section className="bg-gray-50 border-y border-gray-100 py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-8 text-center text-sm text-gray-500">
          <span>🧑‍💻 Built for indie founders &amp; solopreneurs</span>
          <span>⚡ AI-powered research, human-reviewed output</span>
          <span>📦 Delivered as Notion workspace + PDF</span>
        </div>
      </section>

      {/* What's in the report */}
      <section className="py-24 px-6 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need to decide — in one report
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Each report covers six key dimensions of niche viability. No fluff,
          no filler — just the research that actually drives decisions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {DELIVERABLES.map((d) => (
            <div
              key={d.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{d.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{d.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-indigo-50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-gray-600 mb-16 max-w-xl mx-auto">
            Three steps. 48 hours. A clear answer on whether your niche is worth
            building in.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-indigo-100">
              <div className="text-3xl font-bold text-indigo-500 mb-4">01</div>
              <h3 className="font-semibold text-lg mb-2">Submit your niche</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Tell us the niche you want to validate — one or two sentences is
                enough. We handle the rest.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-indigo-100">
              <div className="text-3xl font-bold text-indigo-500 mb-4">02</div>
              <h3 className="font-semibold text-lg mb-2">We research it</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our AI scans competitors, demand data, pricing, and buyer communities
                — then a human reviews the output for accuracy.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-indigo-100">
              <div className="text-3xl font-bold text-indigo-500 mb-4">03</div>
              <h3 className="font-semibold text-lg mb-2">You get your report</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                In 48 hours or less, your full report lands in your inbox as a
                Notion workspace link + PDF download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="bg-indigo-50 rounded-2xl p-8 shadow-sm border border-indigo-100"
            >
              <p className="text-gray-700 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="text-sm font-semibold text-gray-600">
                {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 max-w-2xl mx-auto text-center w-full">
        <h2 className="text-3xl font-bold mb-4">Simple, flat pricing</h2>
        <p className="text-gray-500 mb-12">
          Pay per report. No subscription, no lock-in.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-2xl p-8 text-left">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Solo Report
            </div>
            <div className="text-4xl font-bold mb-1">$49</div>
            <div className="text-gray-500 text-sm mb-6">per report</div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Full 6-section validation report</li>
              <li>✓ Notion workspace + PDF</li>
              <li>✓ Delivered in 48 hours</li>
              <li>✓ One niche per report</li>
            </ul>
          </div>
          <div className="border-2 border-indigo-500 rounded-2xl p-8 text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              BEST VALUE
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              3-Report Bundle
            </div>
            <div className="text-4xl font-bold mb-1">$119</div>
            <div className="text-gray-500 text-sm mb-6">3 reports · $40 each</div>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Everything in Solo</li>
              <li>✓ Test 3 niches in parallel</li>
              <li>✓ Side-by-side comparison guide</li>
              <li>✓ Priority delivery</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA / Order */}
      <section
        id="order"
        className="bg-gray-900 text-white py-24 px-6 text-center"
      >
        <h2 className="text-4xl font-bold mb-4">
          Stop second-guessing. Start validating.
        </h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          Get your structured market validation report in 48 hours — competitors,
          demand signals, pricing benchmarks, and ICP — delivered as a Notion +
          PDF bundle.
        </p>
        <div className="max-w-md mx-auto">
          <WaitlistForm ctaLabel="Validate My Niche — Starting at $49" dark />
        </div>
        <p className="text-gray-400 text-sm mt-4">
          No spam. Unsubscribe any time.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-500">
        <p>© 2026 3vo Niche Reports · AI-powered market validation for indie founders</p>
        <p className="mt-2">
          <a
            href="https://x.com/3voai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            Follow us on X @3voai
          </a>
        </p>
      </footer>
    </div>
  );
}
