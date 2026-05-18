#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_PATH="${1:-"$ROOT_DIR/database-export.sql"}"

if ! command -v sqlite3 >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
  echo "No encuentro sqlite3 ni python3. Instalá alguno de los dos para exportar la base." >&2
  exit 127
fi

if [[ -n "${STUDY_TRACKER_DB:-}" ]]; then
  DB_PATH="$STUDY_TRACKER_DB"
else
  DATA_HOME="${XDG_DATA_HOME:-"$HOME/.local/share"}"
  CANDIDATES=(
    "$DATA_HOME/app.local.studytracker/study-tracker.sqlite3"
    "$DATA_HOME/Study Tracker/study-tracker.sqlite3"
    "$DATA_HOME/study-tracker/study-tracker.sqlite3"
    "$HOME/.local/share/app.local.studytracker/study-tracker.sqlite3"
  )

  DB_PATH=""
  for candidate in "${CANDIDATES[@]}"; do
    if [[ -f "$candidate" ]]; then
      DB_PATH="$candidate"
      break
    fi
  done
fi

if [[ -z "${DB_PATH:-}" || ! -f "$DB_PATH" ]]; then
  cat >&2 <<EOF
No pude encontrar la base SQLite local.

Probá indicando la ruta manualmente:
  STUDY_TRACKER_DB=/ruta/a/study-tracker.sqlite3 npm run db:export

El script buscó las ubicaciones típicas de Tauri en Linux.
EOF
  exit 1
fi

if command -v sqlite3 >/dev/null 2>&1; then
  QUICK_CHECK="$(sqlite3 "$DB_PATH" "PRAGMA quick_check;")"
else
  QUICK_CHECK="$(python3 - "$DB_PATH" <<'PY'
import sqlite3
import sys

with sqlite3.connect(sys.argv[1]) as conn:
    print(conn.execute("PRAGMA quick_check").fetchone()[0])
PY
)"
fi

if [[ "$QUICK_CHECK" != "ok" ]]; then
  echo "La base no pasó PRAGMA quick_check. No exporto para evitar guardar un dump inválido." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"
TMP_PATH="$(mktemp "${OUTPUT_PATH}.tmp.XXXXXX")"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" <<SQL > "$TMP_PATH"
.bail on
.dump
SQL
else
  python3 - "$DB_PATH" > "$TMP_PATH" <<'PY'
import sqlite3
import sys

db_path = sys.argv[1]

with sqlite3.connect(db_path) as conn:
    print("PRAGMA foreign_keys=OFF;")
    for line in conn.iterdump():
        print(line)
PY
fi

mv "$TMP_PATH" "$OUTPUT_PATH"

echo "Exportado:"
echo "  DB:  $DB_PATH"
echo "  SQL: $OUTPUT_PATH"
