-- Migration: Create vcs table for VC Match Kit
-- Stores VC firm profiles powering the vcmatch.3vo.ai search simulator

CREATE TABLE IF NOT EXISTS public.vcs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  website text,
  description text,
  focus_sectors text[] DEFAULT '{}',
  stage_preference text[] DEFAULT '{}',
  check_size_min integer,            -- in USD thousands
  check_size_max integer,            -- in USD thousands
  geo_focus text[] DEFAULT '{}',
  notable_portfolio text[] DEFAULT '{}',
  linkedin_url text,
  twitter_url text,
  source_url text,
  source text,                       -- 'curated' | 'signal_nfx' | 'crunchbase'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT vcs_name_unique UNIQUE (name)
);

-- GIN indexes for array filtering (sector, stage, geo search)
CREATE INDEX IF NOT EXISTS vcs_focus_sectors_idx    ON public.vcs USING GIN(focus_sectors);
CREATE INDEX IF NOT EXISTS vcs_stage_preference_idx ON public.vcs USING GIN(stage_preference);
CREATE INDEX IF NOT EXISTS vcs_geo_focus_idx        ON public.vcs USING GIN(geo_focus);

-- Row Level Security: public read, service_role write
ALTER TABLE public.vcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_vcs"    ON public.vcs FOR SELECT TO anon         USING (true);
CREATE POLICY "service_write_vcs"  ON public.vcs FOR ALL    TO service_role  USING (true);
