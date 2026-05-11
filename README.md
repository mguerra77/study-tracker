# Study Tracker

App desktop/local minimalista para organizar estudio, trabajo y proyectos personales sin convertir el día en un tablero gigante.

## Stack

- React + TypeScript + Vite
- TailwindCSS
- Zustand
- Tauri 2
- SQLite local vía `rusqlite`

## Ejecutar

```bash
npm install
npm run tauri:dev
```

Si ejecutás desde VS Code instalado por Snap, `npm run tauri:dev` usa un wrapper que limpia variables `SNAP`, `GTK` y `GIO` antes de lanzar Tauri. Eso evita errores como `symbol lookup error: /snap/core20/.../libpthread.so.0`.

En Ubuntu 24.04, si Tauri falla buscando archivos `.pc` como `dbus-1.pc`, `pango.pc` o `gdk-pixbuf-2.0.pc`, instalá las dependencias nativas:

```bash
sudo apt install -y libdbus-1-dev pkg-config libpango1.0-dev libgdk-pixbuf-2.0-dev libgtk-3-dev libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev build-essential curl wget file
```

La base SQLite se crea automáticamente en el directorio de datos de la app de Tauri. En el primer arranque se cargan las áreas `Facultad`, `Trabajo` y `Personal`.

## MVP Incluido

- CRUD de áreas, proyectos, tareas, study items, sesiones, eventos y notas desde comandos Tauri.
- Dashboard con `Hoy`, `En foco`, tiempo registrado y calendario simple.
- Sidebar minimal por áreas y proyectos.
- Página de proyecto/materia con progreso, agrupación por semana, notas rápidas y drag and drop.
- Tema oscuro por defecto y UI compacta orientada a arrancar rápido.
