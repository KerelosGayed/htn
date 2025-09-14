# Hermes (Electron + React + Tailwind)

A sleek, console-style UI for the Hermes handheld streaming device with **full Xbox 360 controller support**.

## Features
- **Home**: Start Streaming, Settings, Library, Sleep/Shutdown stub
- **Start Streaming**: Steam Link, Moonlight, Parsec cards (60% width responsive)
- **Library**: responsive box-art grid (placeholder games)
- **Settings**: Wi‑Fi, Bluetooth, Volume, System stats (ready for backend integration)
- **Complete Gamepad Navigation**: Seamless Xbox 360 controller support
- **Visual Focus System**: Clear focus indicators with smooth transitions
- **Intuitive Controls**: A=Select, B=Back, D-Pad/Left Stick=Navigate

## Xbox 360 Controller Support

### Navigation Controls
- **D-Pad** or **Left Stick**: Navigate between menu items
- **A Button**: Select/Activate focused item
- **B Button**: Go back to previous screen
- **Start Button**: (reserved for future menu access)
- **Back Button**: (reserved for future quick settings)

### Focus System
- Clear visual focus indicators with green rings
- Smooth animations when moving between items
- Auto-scroll for off-screen items
- Context-aware navigation (grid vs linear layouts)

### Per-Screen Navigation
- **Home**: Navigate tiles and action buttons
- **Start Streaming**: Navigate provider cards and back button
- **Settings**: Navigate panels and back button (A opens detailed settings)
- **Library**: Navigate game grid and back button (A launches games)

## Dev on Windows
1. Install Node.js 18+.
2. Connect your Xbox 360 controller (wired or wireless)
3. In PowerShell:

```powershell
cd .\hermes-desktop
npm install
npm run dev
```

This starts Vite and Electron with full gamepad support. Connect your controller and start navigating!

## Build
```powershell
npm run build
```
Artifacts will be in `dist/` and packaged by electron-builder.

## Raspberry Pi notes
- Electron on ARM works; keep versions pinned in `package.json`
- Use the same `npm ci` for reproducible installs
- Backend scripts (Steam Link, Wi‑Fi, volume) exist in the repo root and are **fully integrated** via IPC
- Xbox controllers work great on Raspberry Pi OS with proper USB/Bluetooth setup

## Technical Architecture

### Gamepad System
- **useGamepadNavigation**: Polls `navigator.getGamepads()` at 60fps
- **useFocus/FocusProvider**: Context-based focus management
- **useFocusable**: Hook for making components gamepad-navigable
- **Xbox 360 Button Mapping**: Industry-standard controller layout

### Navigation Flow
1. Controller input → gamepad hook
2. Focus system processes navigation
3. Visual focus updates with smooth transitions
4. A/B buttons trigger actions or screen changes

### Backend Integration
The backend is **fully wired** via Electron IPC:
- **Steam Link**: Launch via `window.hermes.steamlinkLaunch()`
- **Volume Control**: Get/set via `window.hermes.volume.*`
- **Wi-Fi Management**: Connect/status via `window.hermes.wifi.*`
- **Bluetooth**: Pair/connect via `window.hermes.bt.*`

All backend calls work on Raspberry Pi with graceful Windows fallbacks.

## Usage Tips
1. **First Time**: Connect controller before launching
2. **Navigation**: Use D-pad or left stick to move around
3. **Selection**: Press A to select items, B to go back
4. **Visual Cues**: Green focus ring shows current selection
5. **Smooth Movement**: Focus animations help track your position
