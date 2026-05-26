#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT_PATH="${1:-"$ROOT_DIR/database-export.sql"}"

if ! command -v sqlite3 >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
  echo "No encuentro sqlite3 ni python3. Instalá alguno de los dos para importar la base." >&2
  exit 127
fi

if [[ ! -f "$INPUT_PATH" ]]; then
  echo "No existe el archivo SQL: $INPUT_PATH" >&2
  exit 1
fi

REAL_HOME="${SNAP_REAL_HOME:-"$HOME"}"
DATA_HOME="$REAL_HOME/.local/share"
SNAP_DATA_HOME="${XDG_DATA_HOME:-}"
DEFAULT_DB_PATH="$DATA_HOME/app.local.studytracker/study-tracker.sqlite3"

if [[ -n "${STUDY_TRACKER_DB:-}" ]]; then
  DB_PATH="$STUDY_TRACKER_DB"
else
  CANDIDATES=(
    "$DATA_HOME/app.local.studytracker/study-tracker.sqlite3"
    "$DATA_HOME/Study Tracker/study-tracker.sqlite3"
    "$DATA_HOME/study-tracker/study-tracker.sqlite3"
    "$REAL_HOME/.local/share/app.local.studytracker/study-tracker.sqlite3"
  )

  if [[ -n "$SNAP_DATA_HOME" && "$SNAP_DATA_HOME" != "$DATA_HOME" ]]; then
    CANDIDATES+=("$SNAP_DATA_HOME/app.local.studytracker/study-tracker.sqlite3")
  fi

  DB_PATH=""
  for candidate in "${CANDIDATES[@]}"; do
    if [[ -f "$candidate" ]]; then
      DB_PATH="$candidate"
      break
    fi
  done

  if [[ -z "$DB_PATH" ]]; then
    DB_PATH="$DEFAULT_DB_PATH"
  fi
fi

DB_DIR="$(dirname "$DB_PATH")"
mkdir -p "$DB_DIR"

TMP_DB="$(mktemp "$DB_DIR/import.tmp.XXXXXX.sqlite3")"
cleanup() {
  rm -f "$TMP_DB"
}
trap cleanup EXIT

if command -v sqlite3 >/dev/null 2>&1; then
  {
    echo ".bail on"
    cat "$INPUT_PATH"
  } | sqlite3 "$TMP_DB"
  QUICK_CHECK="$(sqlite3 "$TMP_DB" "PRAGMA quick_check;")"
else
  QUICK_CHECK="$(python3 - "$TMP_DB" "$INPUT_PATH" <<'PY'
import sqlite3
import sys
from pathlib import Path

db_path = sys.argv[1]
input_path = sys.argv[2]
sql = Path(input_path).read_text()

with sqlite3.connect(db_path) as conn:
    conn.executescript(sql)
    print(conn.execute("PRAGMA quick_check").fetchone()[0])
PY
)"
fi

if [[ "$QUICK_CHECK" != "ok" ]]; then
  echo "La base importada no pasó PRAGMA quick_check. No reemplazo la DB actual." >&2
  exit 1
fi

if [[ -f "$DB_PATH" ]]; then
  BACKUP_PATH="$DB_PATH.bak.$(date +%Y%m%d%H%M%S)"
  cp "$DB_PATH" "$BACKUP_PATH"
else
  BACKUP_PATH=""
fi

mv "$TMP_DB" "$DB_PATH"
trap - EXIT

echo "Importado:"
echo "  SQL: $INPUT_PATH"
echo "  DB:  $DB_PATH"
if [[ -n "$BACKUP_PATH" ]]; then
  echo "  Backup anterior: $BACKUP_PATH"
fi
