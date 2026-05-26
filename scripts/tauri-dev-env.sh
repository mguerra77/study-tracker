#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_BIN="$ROOT_DIR/node_modules/.bin/tauri"
REAL_HOME="${SNAP_REAL_HOME:-"$HOME"}"

# VS Code instalado por Snap contamina procesos hijos con rutas GTK/GIO del
# runtime de Snap. Tauri/WebKit necesita resolver las librerias del sistema.
for name in $(env | cut -d= -f1 | grep -E '^(SNAP|SNAP_|GTK_|GIO_)'); do
  unset "$name"
done

unset LD_LIBRARY_PATH
unset LD_PRELOAD

export HOME="$REAL_HOME"
export XDG_DATA_HOME="$REAL_HOME/.local/share"

if [[ -n "${XDG_DATA_DIRS_VSCODE_SNAP_ORIG:-}" ]]; then
  export XDG_DATA_DIRS="$XDG_DATA_DIRS_VSCODE_SNAP_ORIG"
fi

if [[ -n "${XDG_CONFIG_DIRS_VSCODE_SNAP_ORIG:-}" ]]; then
  export XDG_CONFIG_DIRS="$XDG_CONFIG_DIRS_VSCODE_SNAP_ORIG"
fi

if [[ ! -x "$TAURI_BIN" ]]; then
  echo "No encuentro $TAURI_BIN. Ejecuta npm install primero." >&2
  exit 127
fi

exec "$TAURI_BIN" dev "$@"
