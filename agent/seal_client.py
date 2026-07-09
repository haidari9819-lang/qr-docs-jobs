"""
Client für den externen Siegel-Endpoint im QR-Docs-Hauptrepo.
Ruft POST /api/external/seal auf, um eine Rechnung zu versiegeln.
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

SEAL_API_URL = os.environ.get("SEAL_API_URL", "")
SEAL_API_KEY = os.environ.get("SEAL_API_KEY", "")


# ─── Öffentliche API ────────────────────────────────────────

def seal_invoice(invoice_id: str) -> dict:
    """
    Versiegelt eine Rechnung über den externen Siegel-Endpoint.

    Args:
        invoice_id: UUID der Rechnung

    Returns:
        {"success": true, "checksum": "ab12...", "sealed_at": "..."}
        oder {"error": "..."} bei Fehler
    """
    if not SEAL_API_URL:
        raise RuntimeError(
            "SEAL_API_URL nicht gesetzt — prüfe .env.local "
            "(z.B. https://www.qr-docs.de/api/external/seal)"
        )
    if not SEAL_API_KEY:
        raise RuntimeError("SEAL_API_KEY nicht gesetzt — prüfe .env.local")

    body = json.dumps({"invoice_id": invoice_id}).encode("utf-8")

    req = Request(SEAL_API_URL, data=body, method="POST", headers={
        "Content-Type": "application/json",
        "X-API-Key": SEAL_API_KEY,
        "User-Agent": "qr-docs-jobs/1.0",
    })

    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        try:
            return json.loads(error_body)
        except json.JSONDecodeError:
            return {"error": f"HTTP {e.code}: {error_body}"}
