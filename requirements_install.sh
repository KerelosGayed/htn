#!/usr/bin/env bash
# Install optional dependencies for Hermes Studio backend scripts on Raspberry Pi OS
# - Steam Link (native)
# - ALSA utilities (amixer)
# - NetworkManager (recommended) or fallback tools

set -euo pipefail

echo "This will install packages using apt on Raspberry Pi OS:"
echo "  - steamlink (Steam Link client)"
echo "  - alsa-utils (for amixer volume control)"
echo "  - network-manager (preferred Wi-Fi management)"
echo "  - wpasupplicant rfkill wireless-tools (fallback Wi-Fi tools)"
read -r -p "Proceed with installation? [y/N] " ans
case "${ans:-N}" in
  y|Y)
    ;;
  *)
    echo "Aborted."; exit 0 ;;
esac

sudo apt update
sudo apt install -y steamlink alsa-utils || true
sudo apt install -y network-manager || true
sudo apt install -y wpasupplicant rfkill wireless-tools || true

echo "Done. You may need to reboot if NetworkManager was newly installed."