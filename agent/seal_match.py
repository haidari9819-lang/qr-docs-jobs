"""
SHA-256-Versiegelung für Match-Ergebnisse in MilanSQL.
Gleiche Logik wie seal_invoice im QR-Docs-Hauptrepo,
aber eigenständig ohne Supabase-Abhängigkeit.

Gehashed wird: match_id + bewerber_id + stelle_id + score + provenienz + created_at
Nach dem Versiegeln sind die kritischen Felder logisch unveränderbar.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from milansql_client import query


def _ensure_columns() -> None:
    """Fügt sealed/checksum-Spalten hinzu, falls noch nicht vorhanden."""
    # ALTER TABLE ADD COLUMN ist idempotent bei MilanSQL wenn Spalte schon existiert
    for stmt in [
        "ALTER TABLE match_objekte ADD COLUMN sealed INT DEFAULT 0",
        "ALTER TABLE match_objekte ADD COLUMN sealed_at TEXT",
        "ALTER TABLE match_objekte ADD COLUMN checksum TEXT",
    ]:
        try:
            query(stmt)
        except RuntimeError as e:
            # Spalte existiert bereits — kein Fehler
            if "already exists" in str(e).lower() or "existiert" in str(e).lower():
                pass
            else:
                raise


def seal_match(match_id: int) -> dict:
    """
    Versiegelt ein Match-Ergebnis per SHA-256.

    Returns:
        {"success": True, "checksum": "ab12...", "sealed_at": "..."}
    """
    _ensure_columns()

    # Match laden
    result = query("SELECT * FROM match_objekte WHERE id = ?", [match_id])
    if not result.rows:
        return {"success": False, "error": "not_found"}

    row = dict(zip(result.columns, result.rows[0]))

    # Bereits versiegelt?
    if row.get("sealed") and int(row["sealed"]) == 1:
        return {
            "success": False,
            "error": "already_sealed",
            "checksum": row.get("checksum", ""),
        }

    # SHA-256 berechnen (gleiche Felder-Konkatenation wie seal_invoice)
    data = (
        str(row["id"])
        + str(row["bewerber_id"])
        + str(row["stelle_id"])
        + str(row["score"])
        + str(row.get("provenienz", ""))
        + str(row.get("created_at", ""))
    )
    checksum = hashlib.sha256(data.encode("utf-8")).hexdigest()

    # Versiegeln
    sealed_at = datetime.now(timezone.utc).isoformat()
    query(
        "UPDATE match_objekte SET sealed = ?, sealed_at = ?, checksum = ? WHERE id = ?",
        [1, sealed_at, checksum, match_id],
    )

    return {"success": True, "checksum": checksum, "sealed_at": sealed_at}


def verify_match(match_id: int) -> dict:
    """
    Prüft ob das Siegel eines Match-Ergebnisses noch gültig ist.
    Berechnet die Checksum neu und vergleicht mit der gespeicherten.

    Returns:
        {"valid": True/False, "stored": "...", "computed": "..."}
    """
    result = query("SELECT * FROM match_objekte WHERE id = ?", [match_id])
    if not result.rows:
        return {"valid": False, "error": "not_found"}

    row = dict(zip(result.columns, result.rows[0]))

    if not row.get("sealed") or int(row["sealed"]) != 1:
        return {"valid": False, "error": "not_sealed"}

    stored = row.get("checksum", "")

    data = (
        str(row["id"])
        + str(row["bewerber_id"])
        + str(row["stelle_id"])
        + str(row["score"])
        + str(row.get("provenienz", ""))
        + str(row.get("created_at", ""))
    )
    computed = hashlib.sha256(data.encode("utf-8")).hexdigest()

    return {
        "valid": stored == computed,
        "stored": stored,
        "computed": computed,
    }


if __name__ == "__main__":
    import sys

    match_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1

    print(f"=== Match {match_id} versiegeln ===\n")
    result = seal_match(match_id)
    print(f"Ergebnis: {json.dumps(result, indent=2)}")

    if result.get("success"):
        print(f"\nVerifikation...")
        verify = verify_match(match_id)
        print(f"Ergebnis: {json.dumps(verify, indent=2)}")
