import WaitlistForm from "./waitlist-form";

const FEATURES = [
  {
    icon: "👤",
    title: "Client Hub",
    description:
      "Track every client, contact, and conversation in one place. Never lose context between calls again.",
  },
  {
    icon: "📋",
    title: "Project Command Center",
    description:
      "Kanban boards, task lists, and deadlines for all your active projects — linked directly to each client.",
  },
  {
    icon: "🧾",
    title: "Invoice & Income Tracker",
    description:
      "Log sent invoices, track payment status, and see your monthly income at a glance.",
  },
  {
    icon: "🎯",
    title: "Goals & OKRs",
    description:
      "Set quarterly goals and track progress weekly. Your business grows when you measure what matters.",
  },
  {
    icon: "📅",
    title: "Weekly Review System",
    description:
      "Built-in review templates to reflect on wins, catch blockers, and plan the week ahead.",
  },
  {
    icon: "⚡",
    title: "Quick Capture",
    description:
      "Dump ideas, tasks, and notes instantly. The system routes them to the right place automatically.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I used to have clients in Notion, invoices in a spreadsheet, and tasks in Todoist. Now everything is in one place and I actually feel in control.",
    name: "— Alex R., UX Freelancer",
  },
  {
    quote:
      "This replaced 4 different tools for me. I set it up in an afternoon and haven't looked back.",
    name: "— Maria T., Independent Consultant",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[var(--font-geist-sans)]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="font-bold text-lg tracking-tight">
          Notion Template OS
        </div>
        <a
          href="#waitlist"
          className="bg-black text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          Join Waitlist
        </a>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-3xl mx-auto">
        <div className="inline-block bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
          Coming soon — join the waitlist
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900">
          Your freelance business,
          <br />
          <span className="text-amber-500">finally organized.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed">
          Stop juggling clients, projects, invoices, and goals across 5
          different apps. Notion Template OS brings everything together in one
          beautifully structured workspace — built for freelancers with 1–10
          active clients.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full max-w-md">
          <WaitlistForm />
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Early access · One-time price $39–79 · No subscription
        </p>
      </section>

      {/* Social proof bar */}
      <section className="bg-gray-50 border-y border-gray-100 py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-8 text-center text-sm text-gray-500">
          <span>🧑‍💻 Built for freelancers &amp; solopreneurs</span>
          <span>⭐ Designed around real workflows</span>
          <span>🔒 Your data stays in Notion — always</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need, nothing you don&apos;t
        </h2>
        <p className="text-gray-500 text-center mb-16 max-w-xl mx-auto">
          Six interconnected systems that work together as one. No plugins, no
          code, no monthly fees.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-amber-50 py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="bg-white rounded-2xl p-8 shadow-sm border border-amber-100"
            >
              <p className="text-gray-700 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="text-sm font-semibold text-gray-500">
                {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 max-w-2xl mx-auto text-center w-full">
        <h2 className="text-3xl font-bold mb-4">Simple, one-time pricing</h2>
        <p className="text-gray-500 mb-12">
          Pay once, use forever. No subscription, no lock-in.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-2xl p-8">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Solo
            </div>
            <div className="text-4xl font-bold mb-1">$39</div>
            <div className="text-gray-400 text-sm mb-6">one-time</div>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>✓ Core template suite</li>
              <li>✓ Lifetime access</li>
              <li>✓ Setup guide included</li>
              <li>✓ Free updates</li>
            </ul>
          </div>
          <div className="border-2 border-amber-400 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Pro Bundle
            </div>
            <div className="text-4xl font-bold mb-1">$79</div>
            <div className="text-gray-400 text-sm mb-6">one-time</div>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>✓ Everything in Solo</li>
              <li>✓ Advanced dashboards</li>
              <li>✓ Proposal &amp; contract templates</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA / Waitlist */}
      <section
        id="waitlist"
        className="bg-gray-900 text-white py-24 px-6 text-center"
      >
        <h2 className="text-4xl font-bold mb-4">
          Be first when it launches.
        </h2>
        <p className="text-gray-400 mb-10 max-w-md mx-auto">
          Join the waitlist and get early-bird pricing + a free bonus template
          on launch day.
        </p>
        <div className="max-w-md mx-auto">
          <WaitlistForm dark />
        </div>
        <p className="text-gray-500 text-sm mt-4">
          No spam. Unsubscribe any time.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <p>© 2026 Notion Template OS · Built for freelancers, by freelancers</p>
      </footer>
    </div>
  );
}
