# Hermes (Electron + React + Tailwind)

A sleek, console-style UI for the Hermes handheld streaming device. Backend is intentionally not wired yet; this is a frontend shell ready to plug in.

## Features
- Home: Start Streaming, Settings, Library, Sleep/Shutdown stub
- Start Streaming: Steam Link, Moonlight, Parsec cards (60% width responsive)
- Library: responsive box-art grid (placeholder)
- Settings: Wi‑Fi, Bluetooth, Volume, System stats (static for now)
- Smooth transitions (Framer Motion), gamepad-friendly focus
- Leaf green theme with futuristic dark palette

## Dev on Windows
1. Install Node.js 18+.
2. In PowerShell:

```powershell
cd .\hermes-desktop
npm install
npm run dev
```

This starts Vite and Electron. The UI is responsive; no backend calls are made.

## Build
```powershell
npm run build
```
Artifacts will be in `dist/` and packaged by electron-builder.

## Raspberry Pi notes
- Electron on ARM works; keep versions pinned in `package.json`.
- Use the same `npm ci` for reproducible installs.
- Backend scripts (Steam Link, Wi‑Fi, volume) exist in the repo root but are not yet integrated.

## Wiring later
- Use `preload.js` with contextBridge to expose safe APIs (IPC) for launching Steam Link, managing Wi‑Fi, etc.
- Map gamepad inputs via `useGamepad` hook to drive focus/selection.
