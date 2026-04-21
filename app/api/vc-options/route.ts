import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export const revalidate = 3600;

const STAGES = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
];

const GEOS = ["US", "Europe", "Israel", "India", "SE Asia", "LATAM", "Africa", "ANZ", "Canada"];

const FALLBACK_SECTORS = [
  "AI",
  "B2B SaaS",
  "Fintech",
  "Health Tech",
  "Dev Tools",
  "Consumer",
  "Crypto / Web3",
  "Deep Tech",
  "Climate Tech",
  "EdTech",
  "Enterprise",
  "Security",
  "Marketplace",
  "Infrastructure",
];

export async function GET() {
  let sectors: string[] = [];

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vcs?select=focus_sectors`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const rows: { focus_sectors: string[] }[] = await res.json();
        const freq: Record<string, number> = {};
        for (const row of rows) {
          for (const s of row.focus_sectors ?? []) {
            freq[s] = (freq[s] ?? 0) + 1;
          }
        }
        sectors = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([s]) => s)
          .sort();
      }
    } catch {
      // use fallback
    }
  }

  if (sectors.length === 0) {
    sectors = FALLBACK_SECTORS;
  }

  return NextResponse.json({ stages: STAGES, sectors, geos: GEOS });
}
