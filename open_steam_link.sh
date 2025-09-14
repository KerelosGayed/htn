#!/usr/bin/env bash
# Launch Steam Link on Raspberry Pi
# Tries native steamlink binary, then Flatpak, then snaps if available.
# Exits 0 on success; non-zero on failure with message.

set -euo pipefail

log() { echo "[steamlink] $*"; }
err() { echo "[steamlink][ERROR] $*" 1>&2; }

# Prefer native package
if command -v steamlink >/dev/null 2>&1; then
  log "Launching native steamlink"
  exec steamlink "$@"
fi

# Flatpak variant
if command -v flatpak >/dev/null 2>&1; then
  if flatpak info com.valvesoftware.SteamLink >/dev/null 2>&1; then
    log "Launching Flatpak com.valvesoftware.SteamLink"
    exec flatpak run com.valvesoftware.SteamLink "$@"
  else
    log "Flatpak is installed but Steam Link is not. You can install with:"
    log "  flatpak install flathub com.valvesoftware.SteamLink"
  fi
fi

# Snap (less common on RPi OS)
if command -v snap >/dev/null 2>&1; then
  if snap list steamlink >/dev/null 2>&1; then
    log "Launching Snap steamlink"
    exec snap run steamlink "$@"
  fi
fi

err "Steam Link not found. Install via:"
err "  sudo apt install steamlink    # Raspberry Pi OS"
err "  or flatpak install flathub com.valvesoftware.SteamLink"
exit 127
