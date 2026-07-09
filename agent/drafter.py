"""
Drafter: Generiert eine strukturierte Begründung für einen Match
via Groq (llama-3.1-8b-instant).

Eingabe:  skills_text, anforderungen_text, score, keyword_overlap
Ausgabe:  {"begruendung": "...", "genutzte_begriffe": [...]}
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
GROQ_MODEL = "llama-3.1-8b-instant"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


# ─── Groq-Aufruf ────────────────────────────────────────────

def _groq_chat(messages: list[dict], temperature: float = 0.3,
               max_tokens: int = 400) -> str:
    """Sendet Messages an Groq, gibt den Content-String zurück."""
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
    """Extrahiert JSON aus der Groq-Antwort (ggf. in Markdown-Codeblock)."""
    clean = raw.strip()
    clean = clean.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


# ─── Öffentliche API ────────────────────────────────────────

def draft(
    skills_text: str,
    anforderungen_text: str,
    score: int,
    keyword_overlap: list[str],
    feedback: str | None = None,
) -> dict:
    """
    Generiert eine strukturierte Begründung.

    Returns:
        {"begruendung": "...", "genutzte_begriffe": [...]}
    """
    prompt = f"""Du bist ein HR-Analyst. Formuliere in 2-3 Sätzen auf Deutsch,
warum dieser Bewerber zu dieser Stelle passt oder nicht passt.
Nutze ausschließlich Informationen aus den beiden Texten, erfinde nichts.

Bewerber-Skills: {skills_text}
Stellen-Anforderungen: {anforderungen_text}
Matching-Score: {score}/10000
Gemeinsame Keywords: {', '.join(keyword_overlap) if keyword_overlap else 'keine'}

Antworte NUR mit validem JSON (kein Markdown, kein Text davor/danach):
{{"begruendung": "2-3 Sätze auf Deutsch", "genutzte_begriffe": ["begriff1", "begriff2"]}}"""

    if feedback:
        prompt += f"""

WICHTIG — Vorherige Version wurde beanstandet:
{feedback}
Korrigiere die Begründung entsprechend. Verwende nur Begriffe, die in den
Eingabetexten vorkommen."""

    raw = _groq_chat([{"role": "user", "content": prompt}])
    return _parse_json_response(raw)
