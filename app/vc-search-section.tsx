"use client";

import { useState, useEffect, useRef } from "react";
import WaitlistForm from "./waitlist-form";

interface VcResult {
  id: string;
  name: string;
  focus_sectors: string[];
  stage_preference: string[];
  geo_focus: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  notable_portfolio: string[];
}

interface Options {
  stages: { value: string; label: string }[];
  sectors: string[];
  geos: string[];
}

function fmtCheck(min: number | null, max: number | null): string {
  if (!min && !max) return "Undisclosed";
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${n / 1_000_000}M` : `$${Math.round(n / 1_000)}K`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export default function VcSearchSection() {
  const [options, setOptions] = useState<Options>({ stages: [], sectors: [], geos: [] });
  const [stage, setStage] = useState("");
  const [sector, setSector] = useState("");
  const [geo, setGeo] = useState("");
  const [results, setResults] = useState<VcResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/vc-options")
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vc-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: stage || undefined,
          sector: sector || undefined,
          geo: geo || undefined,
        }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-6 py-16" style={{ background: "var(--color-bg-alt)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 text-white"
            style={{ background: "var(--color-accent)" }}
          >
            Live VC Matcher — 502 active funds
          </span>
          <h2
            className="font-black mb-3"
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              color: "var(--color-text-primary)",
              lineHeight: 1.1,
            }}
          >
            Find VCs that invest at your stage
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
            Filter 502 active funds by stage, sector, and geography.
            Top 5 matches shown free — full list + outreach templates unlocked after signup.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl p-6 border mb-8"
          style={{
            borderColor: "var(--color-border)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  background: "#FAFAFA",
                }}
              >
                <option value="">Any stage</option>
                {options.stages.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                Sector
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  background: "#FAFAFA",
                }}
              >
                <option value="">Any sector</option>
                {options.sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: "var(--color-text-muted)" }}
              >
                Geography
              </label>
              <select
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  background: "#FAFAFA",
                }}
              >
                <option value="">Any geography</option>
                {options.geos.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-colors"
            style={{
              background: loading ? "#6366F1" : "var(--color-accent)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Matching…" : "Find matching VCs →"}
          </button>
        </form>

        {/* Results */}
        {searched && (
          <div ref={resultsRef}>
            {results && results.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                  No exact matches found.
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Try broadening your filters — or leave all fields blank to browse top funds.
                </p>
              </div>
            ) : results && results.length > 0 ? (
              <>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                  Showing top {results.length} match{results.length !== 1 ? "es" : ""} from 502 funds
                </p>

                <div className="space-y-4 mb-8">
                  {results.map((vc, i) => (
                    <div
                      key={vc.id}
                      className="bg-white rounded-xl border p-5 relative overflow-hidden"
                      style={{
                        borderColor: "var(--color-border)",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                      }}
                    >
                      {/* Visible: name, stage tags, sectors */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div
                            className="font-bold text-base"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {vc.name}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {(vc.stage_preference ?? []).slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "#EEF2FF", color: "var(--color-accent)" }}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span
                          className="text-xs font-mono shrink-0 mt-0.5"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          #{i + 1}
                        </span>
                      </div>

                      <div className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                        <span
                          className="font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          Sectors:{" "}
                        </span>
                        {(vc.focus_sectors ?? []).slice(0, 5).join(", ")}
                      </div>

                      {/* Blurred: check size, portfolio, partner, outreach */}
                      <div className="relative rounded-lg overflow-hidden">
                        <div
                          className="space-y-1.5 px-4 py-3 rounded-lg"
                          style={{
                            filter: "blur(4px)",
                            userSelect: "none",
                            pointerEvents: "none",
                            background: "var(--color-bg-alt)",
                          }}
                          aria-hidden
                        >
                          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            <span className="font-medium">Check size:</span>{" "}
                            {fmtCheck(vc.check_size_min, vc.check_size_max)}
                          </div>
                          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            <span className="font-medium">Notable portfolio:</span>{" "}
                            {(vc.notable_portfolio ?? []).slice(0, 3).join(", ") || "Available after unlock"}
                          </div>
                          <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            <span className="font-medium">Lead partner:</span> Partner name &amp; contact
                          </div>
                          <div className="text-sm italic" style={{ color: "var(--color-accent)" }}>
                            AI outreach template — personalized to your pitch
                          </div>
                        </div>

                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              color: "var(--color-text-primary)",
                              border: "1px solid var(--color-border)",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            }}
                          >
                            🔒 Unlock to view
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email capture CTA */}
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: "linear-gradient(135deg, #0F1B2D 0%, #1a2d50 100%)",
                    border: "2px solid var(--color-accent)",
                  }}
                >
                  <div className="text-3xl mb-3">🔓</div>
                  <h3
                    className="text-white font-bold text-xl mb-2"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                  >
                    Unlock full VC list + AI-personalized outreach
                  </h3>
                  <p className="mb-6 text-sm" style={{ color: "#94A3B8", lineHeight: 1.6 }}>
                    Get partner contacts, check size ranges, portfolio insights, and a
                    personalized cold email for every matched investor.
                  </p>
                  <div className="flex justify-center">
                    <WaitlistForm
                      buttonText="Unlock full list →"
                      inputPlaceholder="you@startup.com"
                      dark
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
