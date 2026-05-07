-- ── QR-Docs Jobs: Migration v2 ──────────────────────────────────────────────
-- Im Supabase SQL-Editor ausführen

-- 1. Neue Spalten für job_listings
ALTER TABLE job_listings
  ADD COLUMN IF NOT EXISTS preis_typ         text DEFAULT 'kostenlos',
  ADD COLUMN IF NOT EXISTS stripe_payment_id text;

-- 2. Neue Spalten für firmen_profile
ALTER TABLE firmen_profile
  ADD COLUMN IF NOT EXISTS verified    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS steuernummer text;

-- 3. Job-Alerts Tabelle
CREATE TABLE IF NOT EXISTS job_alerts (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text NOT NULL,
  region      text,
  branche     text,
  stellenart  text,
  bestaetigt  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access job_alerts"
  ON job_alerts FOR ALL USING (true) WITH CHECK (true);

-- 4. job_bewerbungen: E-Mail optional machen
ALTER TABLE job_bewerbungen
  ALTER COLUMN email DROP NOT NULL;

-- ── Demo-Firma anlegen ────────────────────────────────────────────────────────
-- WICHTIG: Ersetze 'DEINE_USER_ID' mit deiner echten auth.users ID
-- (zu finden unter Authentication > Users im Supabase Dashboard)

DO $$
DECLARE
  demo_firma_id uuid;
  demo_user_id  uuid := '00000000-0000-0000-0000-000000000001'; -- PLACEHOLDER
BEGIN

  -- Demo-Firma einfügen (nur wenn noch nicht vorhanden)
  INSERT INTO firmen_profile (id, user_id, firmenname, branche, standort, plan, verified)
  VALUES (
    gen_random_uuid(),
    demo_user_id,
    'QR-Docs Demo GmbH',
    'Handwerk',
    'München',
    'business',
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO demo_firma_id;

  -- Falls die Firma schon existiert, ID holen
  IF demo_firma_id IS NULL THEN
    SELECT id INTO demo_firma_id
    FROM firmen_profile
    WHERE firmenname = 'QR-Docs Demo GmbH'
    LIMIT 1;
  END IF;

  -- Demo-Stellen einfügen (nur wenn Firma gefunden)
  IF demo_firma_id IS NOT NULL THEN
    INSERT INTO job_listings
      (user_id, firma_id, titel, stellenart, branche, standort, beschreibung, gehalt_min, gehalt_max, is_active, is_featured, preis_typ)
    VALUES
      (demo_user_id, demo_firma_id,
       'Elektriker (m/w/d)', 'Vollzeit', 'Handwerk', 'München',
       'Wir suchen einen erfahrenen Elektriker für Installation und Wartung von Elektroanlagen im Wohnungs- und Gewerbebau. Führerschein Klasse B von Vorteil.',
       2800, 3400, true, true, 'premium'),

      (demo_user_id, demo_firma_id,
       'Lagerleiter', 'Vollzeit', 'Logistik', 'Nürnberg',
       'Verantwortung für das gesamte Lager mit 12 Mitarbeitern. Erfahrung mit Warenwirtschaftssystemen und Führungserfahrung erforderlich.',
       3000, 3800, true, true, 'premium'),

      (demo_user_id, demo_firma_id,
       'Ausbildung Fachlagerist', 'Ausbildung', 'Logistik', 'Hamburg',
       'Starte deine Ausbildung zum Fachlageristen in unserem modernen Logistikzentrum. Guter Hauptschulabschluss erwünscht. Übernahme nach Ausbildung möglich.',
       650, 850, true, false, 'kostenlos'),

      (demo_user_id, demo_firma_id,
       'Servicetechniker', 'Vollzeit', 'Handwerk', 'Berlin',
       'Wartung und Reparatur von Klimaanlagen und Lüftungssystemen bei Gewerbekunden. Ausbildung als Kälte-/Klimatechniker oder vergleichbar.',
       2600, 3200, true, false, 'kostenlos'),

      (demo_user_id, demo_firma_id,
       'Buchhalter Teilzeit', 'Teilzeit', 'Dienstleistungen', 'Köln',
       'Selbstständige Buchhaltung bis zur Bilanz, Lohnabrechnung für 20 Mitarbeiter. DATEV-Kenntnisse erforderlich. 20–25 Stunden/Woche.',
       NULL, NULL, true, false, 'kostenlos'),

      (demo_user_id, demo_firma_id,
       'KFZ-Mechatroniker', 'Vollzeit', 'Automotive', 'Frankfurt',
       'Diagnose und Reparatur aller Fahrzeugmarken. Neueste Diagnosegeräte vorhanden. Leistungsgerechte Bezahlung + Prämien.',
       NULL, NULL, true, false, 'kostenlos'),

      (demo_user_id, demo_firma_id,
       'Reinigungskraft Minijob', 'Minijob', 'Reinigung', 'Essen',
       'Büroreinigung Mo–Fr 06:00–09:00 Uhr. Erfahrung erwünscht aber nicht erforderlich. Sofortiger Einstieg möglich.',
       NULL, NULL, true, false, 'kostenlos'),

      (demo_user_id, demo_firma_id,
       'Praktikum IT-Support', 'Praktikum', 'IT & Tech', 'Düsseldorf',
       'Pflichtpraktikum oder freiwilliges Praktikum im IT-Support. Grundkenntnisse Windows und Netzwerke. Dauer 3–6 Monate.',
       NULL, NULL, true, false, 'kostenlos');

    RAISE NOTICE 'Demo-Stellen erfolgreich eingefügt für Firma-ID: %', demo_firma_id;
  ELSE
    RAISE WARNING 'Demo-Firma nicht gefunden — bitte user_id anpassen und erneut ausführen.';
  END IF;

END $$;
