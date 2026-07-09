"""
Reviewer: Prüft eine Drafter-Begründung auf Faktengenauigkeit.
Unabhängiger Groq-Call (kein Chatverlauf vom Drafter).

Eingabe:  drafter_output, skills_text, anforderungen_text
Ausgabe:  {"freigegeben": true/false, "beanstandungen": [...]}
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError


# ─── .env.local laden ────────────────────────────────────────

def _load_env_local() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        eq = line.find("=")
        if eq > 0:
            key, val = line[:eq], line[eq + 1:]
            if key not in os.environ:
                os.environ[key] = val


_load_env_local()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


# ─── Groq-Aufruf ────────────────────────────────────────────

def _groq_chat(messages: list[dict], temperature: float = 0.1,
               max_tokens: int = 500) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY nicht gesetzt — prüfe .env.local")

    body = json.dumps({
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode("utf-8")

    req = Request(GROQ_URL, data=body, method="POST", headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "User-Agent": "qr-docs-jobs/1.0",
    })

    try:
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except HTTPError as e:
        raise RuntimeError(
            f"Groq HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}"
        ) from e


def _parse_json_response(raw: str) -> dict:
    clean = raw.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


# ─── Öffentliche API ────────────────────────────────────────

def review(
    drafter_output: dict,
    skills_text: str,
    anforderungen_text: str,
    score: int | None = None,
    keyword_overlap: list[str] | None = None,
) -> dict:
    """
    Prüft die Begründung auf Faktengenauigkeit.

    Returns:
        {"freigegeben": true/false, "beanstandungen": [...]}
    """
    begruendung = drafter_output.get("begruendung", "")
    genutzte = drafter_output.get("genutzte_begriffe", [])

    score_info = ""
    if score is not None:
        score_info = f"\nQUELLE 3 — Matching-Score:\n{score}/10000"
    overlap_info = ""
    if keyword_overlap:
        overlap_info = (
            f"\nQUELLE 4 — Keyword-Overlap:\n{', '.join(keyword_overlap)}"
        )

    erlaubte_fakten = f"""Folgende Fakten sind ERLAUBT (korrekt, keine Beanstandung):
- Alles was woertlich in den Bewerber-Skills steht: "{skills_text}"
- Alles was woertlich in den Stellen-Anforderungen steht: "{anforderungen_text}"
- Begriffe die sinngemäss das Gleiche meinen (z.B. "SPS-Programmierung" und "SPS-Kenntnisse" sind verwandt)"""

    if score is not None:
        erlaubte_fakten += f"\n- Aussagen ueber den Matching-Score: der Score ist {score}/10000"
    if keyword_overlap:
        erlaubte_fakten += f"\n- Aussagen ueber gemeinsame Keywords: {', '.join(keyword_overlap)}"

    prompt = f"""Pruefe diese Begruendung auf erfundene Fakten.

BEGRUENDUNG:
{begruendung}

{erlaubte_fakten}

Aufgabe: Pruefe NUR ob die Begruendung Faehigkeiten, Begriffe oder Fakten
ERFINDET die in keiner Quelle stehen. Beispiel fuer eine Beanstandung:
"Bewerber hat Erfahrung mit Robotik" — wenn Robotik nirgends vorkommt.

KEINE Beanstandung sind:
- Bewertungen wie "passt gut", "gute Uebereinstimmung" — das sind erlaubte Schlussfolgerungen
- Umschreibungen wie "hoher Score" fuer den Zahlenwert aus den Quellen
- Zusammenfassungen der Quellinhalte in eigenen Worten

Antworte NUR mit validem JSON:
- Wenn keine erfundenen Fakten: {{"freigegeben": true, "beanstandungen": []}}
- Wenn erfundene Fakten: {{"freigegeben": false, "beanstandungen": ["Was erfunden wurde"]}}"""

    raw = _groq_chat([{"role": "user", "content": prompt}])
    return _parse_json_response(raw)
