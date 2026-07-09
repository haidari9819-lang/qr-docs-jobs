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

from flask import Flask, request, jsonify

from sync import sync_bewerbung, sync_stelle

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
