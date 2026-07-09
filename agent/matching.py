"""
Test-Matching: Ein Bewerber + eine Stelle einfügen,
TF-IDF-Vektoren (128-dim) berechnen, Cosine Similarity als Score speichern.
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from datetime import datetime, timezone

from milansql_client import query, insert
from drafter import draft
from reviewer import review


# ─── TF-IDF (reine Python-Implementierung) ──────────────────

EMBEDDING_DIM = 128  # wie SEO/include/milansql/core.hpp:33


def _tokenize(text: str) -> list[str]:
    """Lowercased Wort-Tokens + Character-N-Gramme (3-5) für Teilwort-Matching.
    'Elektroinstallation' erzeugt u.a. 'ele', 'elek', 'elekt', 'lek', ...
    So matchen 'Elektroinstallation' und 'Elektroniker' über gemeinsame N-Gramme.
    """
    words = re.findall(r"[a-zäöüß]+", text.lower())
    tokens = list(words)  # ganze Wörter behalten
    for word in words:
        for n in (3, 4, 5):
            for i in range(len(word) - n + 1):
                tokens.append(word[i : i + n])
    return tokens


def _tf_vector(tokens: list[str]) -> Counter:
    """Term-Frequency als Counter."""
    return Counter(tokens)


def _build_idf(documents: list[list[str]]) -> dict[str, float]:
    """IDF über alle Dokumente: log(N / df)."""
    n = len(documents)
    df: Counter = Counter()
    for doc in documents:
        df.update(set(doc))
    return {term: math.log(1 + n / count) for term, count in df.items()}


def _tfidf_to_fixed_dim(
    tf: Counter, idf: dict[str, float], dim: int = EMBEDDING_DIM
) -> list[float]:
    """
    TF-IDF-Werte auf einen festen dim-dimensionalen Vektor abbilden.
    Jeder Term wird per Hash auf einen Bucket gemappt (Feature-Hashing).
    """
    vec = [0.0] * dim
    for term, count in tf.items():
        weight = count * idf.get(term, 0.0)
        bucket = hash(term) % dim
        vec[bucket] += weight
    return vec


def _normalize(vec: list[float]) -> list[float]:
    """L2-Normalisierung."""
    norm = math.sqrt(sum(x * x for x in vec))
    if norm == 0:
        return vec
    return [x / norm for x in vec]


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine Similarity zweier gleich langer Vektoren."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def compute_vectors(
    text_a: str, text_b: str
) -> tuple[list[float], list[float]]:
    """Berechnet normalisierte 128-dim TF-IDF-Vektoren für zwei Texte."""
    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)

    idf = _build_idf([tokens_a, tokens_b])

    vec_a = _normalize(_tfidf_to_fixed_dim(_tf_vector(tokens_a), idf))
    vec_b = _normalize(_tfidf_to_fixed_dim(_tf_vector(tokens_b), idf))
    return vec_a, vec_b


# ─── Main ───────────────────────────────────────────────────

def main() -> None:
    now = datetime.now(timezone.utc).isoformat()

    # --- Testdaten ---
    bewerber_skills = (
        "Elektroinstallation, Schaltschrankbau, SPS-Programmierung"
    )
    stelle_anforderungen = (
        "Elektroniker für Betriebstechnik, SPS-Kenntnisse von Vorteil"
    )

    print("=== QR-Docs-Jobs: Test-Matching ===\n")

    # 0. Alte Testdaten bereinigen (gleicher Prozess = gleicher Token)
    print("Cleanup alte Testdaten...")
    for table in ["match_objekte", "stellen_anzeigen", "bewerber_profile"]:
        query(f"DELETE FROM {table} WHERE id = ?", [1])
    for table in ["bewerber_profile", "stellen_anzeigen", "match_objekte"]:
        query(
            "UPDATE id_counters SET next_id = ? WHERE table_name = ?",
            [1, table],
        )
    print("Cleanup OK.\n")

    # 1. TF-IDF-Vektoren berechnen
    print("TF-IDF-Vektoren berechnen (128-dim)...")
    vec_bewerber, vec_stelle = compute_vectors(
        bewerber_skills, stelle_anforderungen
    )

    vec_bewerber_json = json.dumps(
        [round(x, 6) for x in vec_bewerber]
    )
    vec_stelle_json = json.dumps(
        [round(x, 6) for x in vec_stelle]
    )

    # 2. Bewerber einfügen
    print("Bewerber einfügen...")
    b = insert("bewerber_profile", {
        "user_id": 1,
        "name": "Test-Bewerber Elektro",
        "skills_text": bewerber_skills,
        "skill_vector": vec_bewerber_json,
        "erfahrung_jahre": 5,
        "quelle": "test-script",
        "status": "aktiv",
        "created_at": now,
    })
    bewerber_id = b.row_count  # insert() gibt die vergebene ID zurück
    print(f"  -> bewerber_profile ID={bewerber_id}")

    # 3. Stelle einfügen
    print("Stelle einfügen...")
    s = insert("stellen_anzeigen", {
        "user_id": 1,
        "titel": "Elektroniker Betriebstechnik",
        "anforderungen_text": stelle_anforderungen,
        "anforderungs_vector": vec_stelle_json,
        "status": "aktiv",
        "created_at": now,
    })
    stelle_id = s.row_count
    print(f"  -> stellen_anzeigen ID={stelle_id}")

    # 4. Cosine Similarity berechnen
    similarity = _cosine_similarity(vec_bewerber, vec_stelle)
    score = int(similarity * 10000)
    print(f"\nCosine Similarity: {similarity:.4f}")
    print(f"Score (×10000):    {score}")

    # 5. Match-Objekt einfügen
    print("\nMatch-Objekt einfügen...")
    m = insert("match_objekte", {
        "bewerber_id": bewerber_id,
        "stelle_id": stelle_id,
        "score": score,
        "keyword_overlap": json.dumps(
            sorted(
                set(_tokenize(bewerber_skills))
                & set(_tokenize(stelle_anforderungen))
            )
        ),
        "review_status": "auto",
        "provenienz": "tfidf-128-test",
        "created_at": now,
    })
    match_id = m.row_count
    print(f"  -> match_objekte ID={match_id}")

    # 6. Drafter → Reviewer Pipeline
    overlap = sorted(
        set(_tokenize(bewerber_skills))
        & set(_tokenize(stelle_anforderungen))
    )

    print("\n--- Drafter ---")
    drafter_output = draft(
        skills_text=bewerber_skills,
        anforderungen_text=stelle_anforderungen,
        score=score,
        keyword_overlap=overlap,
    )
    print(f"  Begründung: {drafter_output.get('begruendung', '???')}")
    print(f"  Begriffe:   {drafter_output.get('genutzte_begriffe', [])}")

    print("\n--- Reviewer ---")
    review_result = review(
        drafter_output=drafter_output,
        skills_text=bewerber_skills,
        anforderungen_text=stelle_anforderungen,
        score=score,
        keyword_overlap=overlap,
    )
    print(f"  Freigegeben:    {review_result.get('freigegeben', False)}")
    print(f"  Beanstandungen: {review_result.get('beanstandungen', [])}")

    # Bei Ablehnung: einmal mit Feedback an Drafter, dann Abbruch
    if not review_result.get("freigegeben", False):
        feedback = "; ".join(review_result.get("beanstandungen", []))
        print(f"\n--- Drafter (Korrektur) ---")
        drafter_output = draft(
            skills_text=bewerber_skills,
            anforderungen_text=stelle_anforderungen,
            score=score,
            keyword_overlap=overlap,
            feedback=feedback,
        )
        print(f"  Begründung: {drafter_output.get('begruendung', '???')}")
        print(f"  Begriffe:   {drafter_output.get('genutzte_begriffe', [])}")

        print("\n--- Reviewer (2. Runde) ---")
        review_result = review(
            drafter_output=drafter_output,
            skills_text=bewerber_skills,
            anforderungen_text=stelle_anforderungen,
            score=score,
            keyword_overlap=overlap,
        )
        print(f"  Freigegeben:    {review_result.get('freigegeben', False)}")
        print(f"  Beanstandungen: {review_result.get('beanstandungen', [])}")

        if not review_result.get("freigegeben", False):
            print("\n[!] Begruendung braucht menschliche Pruefung -- "
                  "2 automatische Versuche gescheitert.")

    # 7. Begründung in match_objekte.provenienz speichern
    provenienz_data = {
        "methode": "tfidf-128 + groq-drafter-reviewer",
        "begruendung": drafter_output.get("begruendung", ""),
        "genutzte_begriffe": drafter_output.get("genutzte_begriffe", []),
        "review_freigegeben": review_result.get("freigegeben", False),
        "review_beanstandungen": review_result.get("beanstandungen", []),
    }
    final_status = "freigegeben" if review_result.get("freigegeben", False) else "menschliche_pruefung"
    query(
        "UPDATE match_objekte SET provenienz = ?, review_status = ? WHERE id = ?",
        [json.dumps(provenienz_data, ensure_ascii=False), final_status, match_id],
    )
    print(f"\n  -> provenienz in match_objekte ID={match_id} gespeichert.")

    # 8. Zusammenfassung
    print("\n" + "=" * 50)
    print("ERGEBNIS")
    print("=" * 50)
    print(f"Bewerber (ID={bewerber_id}):")
    print(f"  Skills: {bewerber_skills}")
    print(f"Stelle   (ID={stelle_id}):")
    print(f"  Anforderungen: {stelle_anforderungen}")
    print(f"Match    (ID={match_id}):")
    print(f"  Score: {score}/10000  (Cosine Similarity: {similarity:.4f})")
    print(f"  Keyword-Overlap: {overlap}")
    print(f"  Begründung: {drafter_output.get('begruendung', '???')}")
    print(f"  Review: {'FREIGEGEBEN' if review_result.get('freigegeben') else 'MENSCHLICHE PRÜFUNG NÖTIG'}")
    print()


if __name__ == "__main__":
    main()
