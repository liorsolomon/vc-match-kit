import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { stage, sector, geo } = body as {
    stage?: string;
    sector?: string;
    geo?: string;
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    select: "id,name,focus_sectors,stage_preference,geo_focus,check_size_min,check_size_max,notable_portfolio",
    limit: "5",
    order: "name.asc",
  });

  // PostgREST array overlap operator: ov.{value}
  if (stage) params.append("stage_preference", `ov.{${stage}}`);
  if (sector) params.append("focus_sectors", `ov.{"${sector}"}`);
  if (geo) params.append("geo_focus", `ov.{"${geo}"}`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/vcs?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[vc-search] Supabase error:", err);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const results = await res.json();
  return NextResponse.json({ results });
}
