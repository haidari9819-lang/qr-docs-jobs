"""
Minimaler Sync-Server — nimmt Webhooks von den Next.js API-Routen entgegen
und schreibt Bewerber/Stellen in MilanSQL.

Endpunkte:
  POST /sync/bewerbung  → sync_bewerbung()
  POST /sync/stelle     → sync_stelle()

Start:
  py sync_server.py              # Port 8090
  py sync_server.py --port 9000  # anderer Port
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import os

from flask import Flask, request, jsonify

from sync import sync_bewerbung, sync_stelle

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

SYNC_SERVER_KEY = os.environ.get("SYNC_SERVER_KEY", "")

# ─── Auth ───────────────────────────────────────────────────

def _check_sync_key():
    """Prüft X-Sync-Key Header — /health bleibt offen."""
    if request.path == "/health":
        return None  # kein Auth nötig
    if not SYNC_SERVER_KEY:
        return None  # kein Key konfiguriert → alles erlauben (Dev-Modus)
    key = request.headers.get("X-Sync-Key", "")
    if key != SYNC_SERVER_KEY:
        log.warning("401 — ungültiger X-Sync-Key von %s", request.remote_addr)
        return jsonify({"success": False, "error": "unauthorized"}), 401

# ─── Logging ─────────────────────────────────────────────────

LOG_FILE = Path(__file__).resolve().parent / "sync_server.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("sync_server")

# ─── Flask App ───────────────────────────────────────────────

app = Flask(__name__)
app.before_request(_check_sync_key)


@app.route("/sync/bewerbung", methods=["POST"])
def handle_bewerbung():
    try:
        data = request.get_json(force=True)
        log.info("POST /sync/bewerbung — %s", json.dumps(data, ensure_ascii=False)[:300])

        result = sync_bewerbung(
            job_id=data.get("job_id", ""),
            name=data.get("name", ""),
            anschreiben=data.get("anschreiben"),
            telefon=data.get("telefon"),
            email=data.get("email"),
            lebenslauf_url=data.get("lebenslauf_url"),
            supabase_bewerbung_id=data.get("bewerbung_id"),
        )

        log.info("sync_bewerbung OK — %s", json.dumps(result, ensure_ascii=False)[:300])
        return jsonify(result), 200 if result.get("success") else 400

    except Exception as e:
        log.exception("sync_bewerbung FEHLER")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/sync/stelle", methods=["POST"])
def handle_stelle():
    try:
        data = request.get_json(force=True)
        log.info("POST /sync/stelle — %s", json.dumps(data, ensure_ascii=False)[:300])

        result = sync_stelle(
            titel=data.get("titel", ""),
            beschreibung=data.get("beschreibung", ""),
            skills=data.get("skills"),
            branche=data.get("branche"),
            standort=data.get("standort"),
            user_id=data.get("user_id"),
            supabase_job_id=data.get("job_id"),
        )

        log.info("sync_stelle OK — %s", json.dumps(result, ensure_ascii=False)[:300])
        return jsonify(result), 200 if result.get("success") else 400

    except Exception as e:
        log.exception("sync_stelle FEHLER")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/begruenden", methods=["POST"])
def handle_begruenden():
    try:
        data = request.get_json(force=True)
        log.info("POST /begruenden — match_id=%s", data.get("match_id"))

        from drafter import draft
        from reviewer import review
        from milansql_client import query as msql_query

        match_id = data.get("match_id")
        skills_text = data.get("skills_text", "")
        anforderungen_text = data.get("anforderungen_text", "")
        score = data.get("score", 0)
        keyword_overlap = data.get("keyword_overlap", "[]")

        if isinstance(keyword_overlap, str):
            import json as _json
            keyword_overlap = _json.loads(keyword_overlap)

        score_float = score / 10000 if isinstance(score, int) and score > 100 else score

        # Drafter
        drafter_result = draft(
            skills_text=skills_text,
            anforderungen_text=anforderungen_text,
            score=score_float,
            keyword_overlap=keyword_overlap,
        )
        begruendung = drafter_result.get("begruendung", "")

        # Reviewer (1 Retry)
        review_status = "menschliche_pruefung"
        for attempt in range(2):
            reviewer_result = review(
                drafter_output=drafter_result,
                skills_text=skills_text,
                anforderungen_text=anforderungen_text,
                score=score_float,
                keyword_overlap=keyword_overlap,
            )
            if reviewer_result.get("freigegeben"):
                review_status = "freigegeben"
                break
            elif attempt == 0:
                # Retry mit Feedback
                drafter_result = draft(
                    skills_text=skills_text,
                    anforderungen_text=anforderungen_text,
                    score=score_float,
                    keyword_overlap=keyword_overlap,
                    feedback=reviewer_result.get("beanstandungen", []),
                )
                begruendung = drafter_result.get("begruendung", "")

        # Provenienz in MilanSQL speichern
        provenienz = json.dumps({
            "begruendung": begruendung,
            "genutzte_begriffe": drafter_result.get("genutzte_begriffe", []),
            "review_status": review_status,
            "beanstandungen": reviewer_result.get("beanstandungen", []),
        }, ensure_ascii=False)

        msql_query(
            "UPDATE match_objekte SET provenienz = ?, review_status = ? WHERE id = ?",
            [provenienz, review_status, match_id],
        )

        log.info("begruenden OK — match_id=%s, status=%s", match_id, review_status)
        return jsonify({
            "success": True,
            "match_id": match_id,
            "begruendung": begruendung,
            "review_status": review_status,
        })

    except Exception as e:
        log.exception("begruenden FEHLER")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.now(timezone.utc).isoformat()})


# ─── Main ────────────────────────────────────────────────────

if __name__ == "__main__":
    port = 8090
    if "--port" in sys.argv:
        idx = sys.argv.index("--port")
        port = int(sys.argv[idx + 1])

    log.info("Sync-Server startet auf Port %d", port)
    app.run(host="0.0.0.0", port=port)
