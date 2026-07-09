"""
Sync: Supabase-Ereignisse → MilanSQL-Profiltabellen.

sync_bewerbung(): Neue Bewerbung → bewerber_profile in MilanSQL
sync_stelle():    Neue Stellenanzeige → stellen_anzeigen in MilanSQL

Aufruf aus den API-Routen heraus (noch nicht automatisch getriggert).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from milansql_client import insert, query
from tfidf import compute_single_vector, cosine_similarity, tokenize


def _keyword_overlap(text_a: str, text_b: str) -> list[str]:
    """Gemeinsame Wörter (>= 4 Zeichen) zwischen zwei Texten."""
    words_a = set(w for w in tokenize(text_a) if len(w) >= 4)
    words_b = set(w for w in tokenize(text_b) if len(w) >= 4)
    return sorted(words_a & words_b)[:20]


def _save_top_matches(
    bewerber_id: int,
    bewerber_vec: list[float],
    bewerber_text: str,
    stelle_id: int,
    stelle_vec: list[float],
    stelle_text: str,
    score: float,
    now: str,
) -> dict:
    """Speichert ein Match-Objekt in MilanSQL."""
    overlap = _keyword_overlap(bewerber_text, stelle_text)
    result = insert("match_objekte", {
        "bewerber_id": bewerber_id,
        "stelle_id": stelle_id,
        "score": int(round(score * 10000)),
        "keyword_overlap": json.dumps(overlap),
        "review_status": "entwurf",
        "provenienz": "",
        "created_at": now,
    })
    return {"match_id": result.row_count, "score": score, "overlap_count": len(overlap)}


def _match_bewerber_gegen_stellen(
    bewerber_id: int, bewerber_vec: list[float], bewerber_text: str
) -> list[dict]:
    """Matcht einen Bewerber gegen alle aktiven Stellen, speichert Top 5."""
    now = datetime.now(timezone.utc).isoformat()
    rows = query(
        "SELECT id, anforderungs_vector, anforderungen_text FROM stellen_anzeigen WHERE status = 'aktiv'"
    )
    if not rows.rows:
        return []

    scores = []
    for row in rows.rows:
        sid = int(row[0])
        try:
            svec = json.loads(row[1])
        except (json.JSONDecodeError, TypeError):
            continue
        stext = row[2] or ""
        score = cosine_similarity(bewerber_vec, svec)
        scores.append((sid, svec, stext, score))

    scores.sort(key=lambda x: x[3], reverse=True)
    matches = []
    for sid, svec, stext, score in scores[:5]:
        m = _save_top_matches(bewerber_id, bewerber_vec, bewerber_text, sid, svec, stext, score, now)
        matches.append(m)
    return matches


def _match_stelle_gegen_bewerber(
    stelle_id: int, stelle_vec: list[float], stelle_text: str
) -> list[dict]:
    """Matcht eine Stelle gegen alle aktiven Bewerber, speichert Top 5."""
    now = datetime.now(timezone.utc).isoformat()
    rows = query(
        "SELECT id, skill_vector, skills_text FROM bewerber_profile WHERE status = 'aktiv'"
    )
    if not rows.rows:
        return []

    scores = []
    for row in rows.rows:
        bid = int(row[0])
        try:
            bvec = json.loads(row[1])
        except (json.JSONDecodeError, TypeError):
            continue
        btext = row[2] or ""
        score = cosine_similarity(bvec, stelle_vec)
        scores.append((bid, bvec, btext, score))

    scores.sort(key=lambda x: x[3], reverse=True)
    matches = []
    for bid, bvec, btext, score in scores[:5]:
        m = _save_top_matches(bid, bvec, btext, stelle_id, stelle_vec, stelle_text, score, now)
        matches.append(m)
    return matches


def sync_bewerbung(
    job_id: str,
    name: str,
    anschreiben: str | None = None,
    telefon: str | None = None,
    email: str | None = None,
    lebenslauf_url: str | None = None,
    supabase_bewerbung_id: str | None = None,
) -> dict:
    """
    Legt ein bewerber_profile in MilanSQL an, basierend auf einer
    neuen Bewerbung aus Supabase.

    Skills werden aus dem Anschreiben extrahiert (Freitext → TF-IDF-Vektor).
    Falls kein Anschreiben vorhanden, wird der Name als minimaler Text genutzt.

    Returns:
        {"success": True, "bewerber_id": 1, "skills_text": "...", "vector_dim": 128}
    """
    now = datetime.now(timezone.utc).isoformat()

    # Skills-Text zusammenbauen aus verfügbaren Feldern
    text_parts = []
    if anschreiben:
        text_parts.append(anschreiben)
    if name:
        text_parts.append(name)
    skills_text = ". ".join(text_parts) if text_parts else ""

    if not skills_text.strip():
        return {
            "success": False,
            "error": "no_text",
            "message": "Kein Anschreiben und kein Name vorhanden — "
                       "kann kein Profil anlegen.",
        }

    # TF-IDF-Vektor berechnen
    vec = compute_single_vector(skills_text)
    vec_json = json.dumps([round(x, 6) for x in vec])

    # In MilanSQL einfügen
    result = insert("bewerber_profile", {
        "user_id": 0,  # kein User-Account, Bewerbung ist anonym
        "name": name or "Unbekannt",
        "skills_text": skills_text,
        "skill_vector": vec_json,
        "erfahrung_jahre": 0,  # nicht aus Bewerbung ableitbar
        "quelle": f"supabase:job_bewerbungen:{supabase_bewerbung_id or job_id}",
        "status": "aktiv",
        "created_at": now,
    })
    bewerber_id = result.row_count  # insert() gibt vergebene ID zurück

    # Top-5-Matches gegen aktive Stellen berechnen
    matches = _match_bewerber_gegen_stellen(bewerber_id, vec, skills_text)

    return {
        "success": True,
        "bewerber_id": bewerber_id,
        "skills_text": skills_text[:200],
        "vector_dim": len(vec),
        "matches": matches,
    }


def sync_stelle(
    titel: str,
    beschreibung: str,
    skills: list[str] | None = None,
    branche: str | None = None,
    standort: str | None = None,
    user_id: str | None = None,
    supabase_job_id: str | None = None,
) -> dict:
    """
    Legt eine stellen_anzeige in MilanSQL an, basierend auf einer
    neuen Stellenanzeige aus Supabase.

    Anforderungstext = Titel + Beschreibung + Skills (kommasepariert).

    Returns:
        {"success": True, "stelle_id": 1, "anforderungen_text": "...", "vector_dim": 128}
    """
    now = datetime.now(timezone.utc).isoformat()

    # Anforderungstext zusammenbauen
    text_parts = [titel]
    if beschreibung:
        text_parts.append(beschreibung)
    if skills:
        text_parts.append(", ".join(skills))
    if branche:
        text_parts.append(f"Branche: {branche}")
    anforderungen_text = ". ".join(text_parts)

    # TF-IDF-Vektor berechnen
    vec = compute_single_vector(anforderungen_text)
    vec_json = json.dumps([round(x, 6) for x in vec])

    # In MilanSQL einfügen
    result = insert("stellen_anzeigen", {
        "user_id": 0,  # wird später ggf. mit echtem User verknüpft
        "titel": titel,
        "anforderungen_text": anforderungen_text,
        "anforderungs_vector": vec_json,
        "status": "aktiv",
        "created_at": now,
    })
    stelle_id = result.row_count

    # Top-5-Matches gegen aktive Bewerber berechnen
    matches = _match_stelle_gegen_bewerber(stelle_id, vec, anforderungen_text)

    return {
        "success": True,
        "stelle_id": stelle_id,
        "anforderungen_text": anforderungen_text[:200],
        "vector_dim": len(vec),
        "matches": matches,
    }


# ─── Test ────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Sync-Test ===\n")

    # Simulierte Bewerbung (wie aus app/api/bewerbung/route.ts)
    print("--- sync_bewerbung ---")
    b = sync_bewerbung(
        job_id="test-job-123",
        name="Max Mustermann",
        anschreiben=(
            "Sehr geehrte Damen und Herren, ich bewerbe mich als "
            "Elektroniker. Ich habe 3 Jahre Erfahrung in der "
            "Elektroinstallation und SPS-Programmierung. "
            "Schaltschrankbau beherrsche ich ebenfalls."
        ),
        telefon="0171-1234567",
        email="max@example.com",
    )
    print(json.dumps(b, indent=2, ensure_ascii=False))

    # Simulierte Stellenanzeige (wie aus app/api/jobs/route.ts)
    print("\n--- sync_stelle ---")
    s = sync_stelle(
        titel="Elektroniker fuer Betriebstechnik",
        beschreibung=(
            "Wir suchen einen erfahrenen Elektroniker fuer die "
            "Wartung und Instandhaltung unserer Produktionsanlagen. "
            "SPS-Kenntnisse sind von Vorteil."
        ),
        skills=["Elektroinstallation", "SPS", "Schaltschrankbau"],
        branche="Industrie",
        standort="Berlin",
        supabase_job_id="test-stelle-456",
    )
    print(json.dumps(s, indent=2, ensure_ascii=False))
