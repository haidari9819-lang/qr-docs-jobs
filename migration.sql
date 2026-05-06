-- ── QR-Docs Jobs: DB Migration ──────────────────────────────────────────────
-- Einmalig im Supabase SQL-Editor ausführen

-- 1. job_listings
CREATE TABLE IF NOT EXISTS job_listings (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firma_id        uuid NOT NULL REFERENCES firmen_profile(id) ON DELETE CASCADE,
  titel           text NOT NULL,
  stellenart      text NOT NULL DEFAULT 'Vollzeit',
  branche         text NOT NULL DEFAULT '',
  standort        text NOT NULL DEFAULT '',
  beschreibung    text NOT NULL DEFAULT '',
  gehalt_min      integer,
  gehalt_max      integer,
  skills          text[] DEFAULT '{}',
  is_active       boolean DEFAULT true,
  is_featured     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. job_bewerbungen
CREATE TABLE IF NOT EXISTS job_bewerbungen (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id          uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  name            text NOT NULL,
  email           text NOT NULL,
  telefon         text,
  anschreiben     text,
  lebenslauf_url  text,
  status          text DEFAULT 'neu',
  created_at      timestamptz DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE job_listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_bewerbungen ENABLE ROW LEVEL SECURITY;

-- job_listings: public read, authenticated write own rows
CREATE POLICY "Öffentliche Jobs lesen"
  ON job_listings FOR SELECT USING (is_active = true);

CREATE POLICY "Firma kann eigene Jobs verwalten"
  ON job_listings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypass (for API routes using admin client)
CREATE POLICY "Service role full access jobs"
  ON job_listings FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access bewerbungen"
  ON job_bewerbungen FOR ALL USING (true)
  WITH CHECK (true);

-- 4. Index für Performance
CREATE INDEX IF NOT EXISTS idx_job_listings_firma    ON job_listings(firma_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_active   ON job_listings(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_bewerbungen_job   ON job_bewerbungen(job_id);

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_listings_updated_at
  BEFORE UPDATE ON job_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
