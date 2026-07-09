"""
Dünner HTTP-Client für MilanSQL.
Muster: builder/src/lib/milansql.ts — Login + JWT-Cache + Query.
Keine Business-Logik, nur Lesen/Schreiben.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
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
            key, val = line[:eq], line[eq + 1 :]
            if key not in os.environ:
                os.environ[key] = val


_load_env_local()


# ─── Konfiguration ──────────────────────────────────────────

MILANSQL_URL = os.environ.get("MILANSQL_URL", "http://178.105.206.36:8080")
MILANSQL_USER = os.environ.get("MILANSQL_USER", "qrdocs.job")
MILANSQL_PASSWORD = os.environ.get("MILANSQL_PASSWORD", "")


# ─── Datenklassen ───────────────────────────────────────────

@dataclass
class QueryResult:
    success: bool
    columns: list[str] = field(default_factory=list)
    rows: list[list] = field(default_factory=list)
    row_count: int = 0
    message: str = ""


# ─── HTTP-Helfer ─────────────────────────────────────────────

def _post_json(url: str, body: dict, headers: dict | None = None) -> dict:
    """POST mit JSON-Body, gibt geparste JSON-Antwort zurück."""
    data = json.dumps(body).encode("utf-8")
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    req = Request(url, data=data, headers=hdrs, method="POST")
    try:
        with urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        if e.code == 429:
            retry_after = json.loads(body_text).get("retry_after", 60)
            raise RuntimeError(
                f"MilanSQL rate-limited — warte {retry_after}s und versuche es erneut."
            ) from e
        raise RuntimeError(
            f"MilanSQL HTTP {e.code}: {body_text}"
        ) from e


# ─── Token-Cache (In-Memory + Datei, überlebt Prozess-Neustarts) ──

_cached_token: str | None = None
_token_expires: float = 0.0
_TOKEN_TTL = 20 * 60  # 20 Minuten, wie im Builder
_TOKEN_FILE = Path(__file__).resolve().parent / ".milansql_token"


def _read_token_file() -> tuple[str | None, float]:
    """Liest Token + Ablaufzeit aus Datei."""
    try:
        data = json.loads(_TOKEN_FILE.read_text(encoding="utf-8"))
        return data.get("token"), data.get("expires", 0.0)
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return None, 0.0


def _write_token_file(token: str, expires: float) -> None:
    """Persistiert Token + Ablaufzeit in Datei."""
    try:
        _TOKEN_FILE.write_text(
            json.dumps({"token": token, "expires": expires}),
            encoding="utf-8",
        )
    except OSError:
        pass  # Nicht schreibbar → nur In-Memory


def _login() -> str:
    """Loggt sich ein und gibt den JWT-Token zurück."""
    if not MILANSQL_PASSWORD:
        raise RuntimeError(
            "MILANSQL_PASSWORD nicht gesetzt — prüfe .env.local"
        )
    result = _post_json(
        f"{MILANSQL_URL}/auth/login",
        {"username": MILANSQL_USER, "password": MILANSQL_PASSWORD},
    )
    token = result.get("token")
    if not token:
        raise RuntimeError(f"Login fehlgeschlagen: {result}")
    return token


def _get_token() -> str:
    """Gibt gecachten Token zurück (Memory → Datei → Login)."""
    global _cached_token, _token_expires
    now = time.time()

    # 1. In-Memory-Cache
    if _cached_token and now < _token_expires:
        return _cached_token

    # 2. Datei-Cache (überlebt Prozess-Neustarts)
    file_token, file_expires = _read_token_file()
    if file_token and now < file_expires:
        _cached_token = file_token
        _token_expires = file_expires
        return _cached_token

    # 3. Frisch einloggen
    _cached_token = _login()
    _token_expires = now + _TOKEN_TTL
    _write_token_file(_cached_token, _token_expires)
    return _cached_token


def _invalidate_token() -> None:
    global _cached_token, _token_expires
    _cached_token = None
    _token_expires = 0.0
    try:
        _TOKEN_FILE.unlink(missing_ok=True)
    except OSError:
        pass


# ─── Öffentliche API ────────────────────────────────────────

def query(sql: str, params: list | None = None) -> QueryResult:
    """Führt ein SQL-Statement gegen MilanSQL aus."""
    token = _get_token()
    body = {"sql": sql, "params": params or []}

    try:
        raw = _post_json(
            f"{MILANSQL_URL}/api/query",
            body,
            headers={"Authorization": f"Bearer {token}"},
        )
    except RuntimeError as e:
        if "401" in str(e):
            # Token abgelaufen — einmal neu einloggen
            _invalidate_token()
            token = _get_token()
            raw = _post_json(
                f"{MILANSQL_URL}/api/query",
                body,
                headers={"Authorization": f"Bearer {token}"},
            )
        else:
            raise

    return QueryResult(
        success=raw.get("success", False),
        columns=raw.get("columns", []),
        rows=raw.get("rows", []),
        row_count=raw.get("rowCount", 0),
        message=raw.get("message", ""),
    )


def insert(table: str, data: dict) -> QueryResult:
    """Convenience: INSERT mit auto-ID aus id_counters."""
    # Nächste ID holen
    counter = query(
        "SELECT next_id FROM id_counters WHERE table_name = ?", [table]
    )
    if not counter.rows:
        raise RuntimeError(f"Kein id_counter für Tabelle '{table}' gefunden.")
    next_id = int(counter.rows[0][0])

    # Counter hochzählen
    query(
        "UPDATE id_counters SET next_id = ? WHERE table_name = ?",
        [next_id + 1, table],
    )

    # INSERT bauen
    data_with_id = {"id": next_id, **data}
    cols = ", ".join(data_with_id.keys())
    placeholders = ", ".join("?" for _ in data_with_id)
    values = list(data_with_id.values())

    result = query(
        f"INSERT INTO {table} ({cols}) VALUES ({placeholders})",
        values,
    )
    result.row_count = next_id  # ID zurückgeben via row_count
    return result
