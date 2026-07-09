/**
 * Erstellt die drei Job-Tabellen in MilanSQL unter dem qrdocs.job-Account.
 *
 * Nutzung:
 *   npx tsx scripts/create-jobs-tables.ts
 *
 * Env-Vars (oder direkt hier gesetzt):
 *   MILANSQL_URL      – z.B. http://178.105.206.36:8080
 *   MILANSQL_USER     – qrdocs.job
 *   MILANSQL_PASSWORD  – (aus .env.local)
 */

// .env.local laden (kein Next.js-Kontext in standalone Scripts)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const envPath = resolve(import.meta.dirname ?? ".", "..", ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // .env.local nicht vorhanden — Env-Vars müssen extern gesetzt sein
}

const MILANSQL_URL = process.env.MILANSQL_URL ?? "http://178.105.206.36:8080";
const MILANSQL_USER = process.env.MILANSQL_USER ?? "qrdocs.job";
const MILANSQL_PASSWORD = process.env.MILANSQL_PASSWORD;

if (!MILANSQL_PASSWORD) {
  console.error("Fehler: MILANSQL_PASSWORD ist nicht gesetzt.");
  console.error("Setze es via .env.local oder direkt als Env-Variable.");
  process.exit(1);
}

// ─── MilanSQL HTTP-Client (minimal) ─────────────────────────

async function login(): Promise<string> {
  const res = await fetch(new URL("/auth/login", MILANSQL_URL).href, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: MILANSQL_USER, password: MILANSQL_PASSWORD }),
  });

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const wait = (body as { retry_after?: number }).retry_after ?? 60;
    throw new Error(`Rate-limited — warte ${wait}s und versuche es erneut.`);
  }
  if (!res.ok) {
    throw new Error(`Login fehlgeschlagen (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

async function query(
  token: string,
  sql: string,
  params: unknown[] = [],
): Promise<{ columns: string[]; rows: unknown[][]; rowCount: number }> {
  const res = await fetch(new URL("/api/query", MILANSQL_URL).href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Query fehlgeschlagen (${res.status}): ${text}\nSQL: ${sql}`);
  }

  return res.json() as Promise<{ columns: string[]; rows: unknown[][]; rowCount: number }>;
}

async function queryRaw(
  token: string,
  sql: string,
  params: unknown[] = [],
): Promise<Record<string, unknown>> {
  const res = await fetch(new URL("/api/query", MILANSQL_URL).href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sql, params }),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Tabellen-Definitionen ──────────────────────────────────

const TABLES = [
  {
    name: "bewerber_profile",
    drop: "DROP TABLE IF EXISTS bewerber_profile",
    create: `CREATE TABLE IF NOT EXISTS bewerber_profile (
  id INT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT,
  skills_text TEXT,
  skill_vector TEXT,
  erfahrung_jahre INT,
  quelle TEXT,
  status TEXT DEFAULT 'aktiv',
  created_at TEXT
)`,
  },
  {
    name: "stellen_anzeigen",
    drop: "DROP TABLE IF EXISTS stellen_anzeigen",
    create: `CREATE TABLE IF NOT EXISTS stellen_anzeigen (
  id INT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  titel TEXT,
  anforderungen_text TEXT,
  anforderungs_vector TEXT,
  status TEXT DEFAULT 'entwurf',
  created_at TEXT
)`,
  },
  {
    name: "match_objekte",
    drop: "DROP TABLE IF EXISTS match_objekte",
    create: `CREATE TABLE IF NOT EXISTS match_objekte (
  id INT PRIMARY KEY,
  bewerber_id INTEGER NOT NULL,
  stelle_id INTEGER NOT NULL,
  score INTEGER,
  keyword_overlap TEXT,
  review_status TEXT DEFAULT 'entwurf',
  provenienz TEXT,
  created_at TEXT
)`,
  },
];

// ─── id_counters registrieren ───────────────────────────────

async function seedCounters(token: string) {
  // id_counters anlegen falls noch nicht vorhanden (eigener Account-Scope)
  await query(token, `CREATE TABLE IF NOT EXISTS id_counters (
    id INT PRIMARY KEY,
    table_name TEXT,
    next_id INT
  )`);
  console.log("  id_counters-Tabelle sichergestellt.");

  let nextCounterId = 1;

  for (const table of TABLES) {
    const existing = await queryRaw(
      token,
      "SELECT * FROM id_counters WHERE table_name = ?",
      [table.name],
    );

    if (existing.success && existing.rows && existing.rows.length > 0) {
      console.log(`  ${table.name}: Counter existiert bereits, übersprungen.`);
      continue;
    }

    await query(
      token,
      "INSERT INTO id_counters (id, table_name, next_id) VALUES (?, ?, ?)",
      [nextCounterId++, table.name, 1],
    );
    console.log(`  ${table.name}: Counter angelegt (next_id = 1).`);
  }
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log("=== QR-Docs-Jobs: Tabellen erstellen ===\n");
  console.log(`Server:  ${MILANSQL_URL}`);
  console.log(`Account: ${MILANSQL_USER}\n`);

  console.log("Login...");
  const token = await login();
  console.log("Login OK.\n");

  for (const table of TABLES) {
    // 1. Drop (kaputte Version entfernen)
    console.log(`[${table.name}] DROP TABLE IF EXISTS...`);
    await query(token, table.drop);

    // 2. Create (saubere Version)
    console.log(`[${table.name}] CREATE TABLE...`);
    await query(token, table.create);

    // 3. Verifizieren
    const check = await query(token, `SELECT * FROM ${table.name}`);
    console.log(`[${table.name}] OK — Spalten: [${check.columns.join(", ")}]\n`);
  }

  // 4. Counter seeden
  console.log("id_counters seeden...");
  await seedCounters(token);

  console.log("\nFertig — alle drei Tabellen sauber angelegt.");
}

main().catch((err) => {
  console.error("\nFehler:", err.message);
  process.exit(1);
});
