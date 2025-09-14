#!/usr/bin/env bash
# Simple Wi-Fi manager for Raspberry Pi.
# Usage:
#  wifi_manage.sh list
#  wifi_manage.sh connect <SSID> [PASSWORD]
#  wifi_manage.sh status
#  wifi_manage.sh disconnect
#  wifi_manage.sh on|off
#
# Prefers NetworkManager (nmcli). Falls back to wpa_cli and rfkill if available.

set -euo pipefail

log() { echo "[wifi] $*"; }
err() { echo "[wifi][ERROR] $*" 1>&2; }

have() { command -v "$1" >/dev/null 2>&1; }

use_nmcli=false
if have nmcli; then
  use_nmcli=true
fi

# Determine wireless interface name (wlan0, wlan1, etc.)
detect_iface() {
  local ifc
  if have nmcli; then
    ifc=$(nmcli -t -f DEVICE,TYPE device | awk -F: '$2=="wifi"{print $1; exit}')
    if [ -n "${ifc:-}" ]; then echo "$ifc"; return 0; fi
  fi
  if have iw; then
    ifc=$(iw dev | awk '/Interface/ {print $2; exit}')
    if [ -n "${ifc:-}" ]; then echo "$ifc"; return 0; fi
  fi
  # Common default
  echo "wlan0"
}

WIFI_IFACE=${WIFI_IFACE:-$(detect_iface)}

wifi_list_nmcli() {
  nmcli -t -f IN-USE,SSID,BSSID,CHAN,SIGNAL,SECURITY dev wifi | awk -F: '{printf "%s\t%-32s\tch%-3s\t%3s%%\t%s\n", ($1=="*"?"*":" "), $2, $4, $5, $6}'
}

wifi_connect_nmcli() {
  local ssid="$1"; shift || true
  local pass="${1:-}"
  if [ -n "$pass" ]; then
    nmcli dev wifi connect "$ssid" password "$pass"
  else
    nmcli dev wifi connect "$ssid"
  fi
}

wifi_status_nmcli() {
  log "Device status:"
  nmcli -t -f DEVICE,TYPE,STATE device | sed 's/:/\t/g'
  log "Active connection:"
  nmcli -t -f NAME,UUID,TYPE,DEVICE connection show --active | sed 's/:/\t/g'
  log "IP (IPv4):"
  nmcli -t -f IP4.ADDRESS dev show "$WIFI_IFACE" | sed 's/:/\t/g' || true
}

wifi_disconnect_nmcli() {
  [ -n "$WIFI_IFACE" ] && nmcli device disconnect "$WIFI_IFACE" || { err "Wi-Fi device not found"; exit 1; }
}

wifi_onoff_nmcli() {
  local arg="$1"
  if [ "$arg" = on ]; then
    nmcli radio wifi on
  else
    nmcli radio wifi off
  fi
}

wifi_list_wpa() {
  if have iwlist; then
    sudo iwlist "$WIFI_IFACE" scan | awk -F: '/ESSID/ {print "SSID\t" $2} /Quality/ {print $0} /Encryption key/ {print $0}' | sed 's/\t//g'
  else
    err "iwlist not found for scanning. Install wireless-tools or use nmcli."
    exit 127
  fi
}

wifi_connect_wpa() {
  local ssid="$1"; shift || true
  local pass="${1:-}"
  if ! have wpa_cli; then err "wpa_cli not found"; exit 127; fi
  local id
  id=$(wpa_cli -i "$WIFI_IFACE" add_network | tail -1)
  # Properly quote SSID/PSK for wpa_supplicant
  wpa_cli -i "$WIFI_IFACE" set_network "$id" ssid '"'"$ssid"'"'
  if [ -n "$pass" ]; then
    wpa_cli -i "$WIFI_IFACE" set_network "$id" psk '"'"$pass"'"'
  else
    wpa_cli -i "$WIFI_IFACE" set_network "$id" key_mgmt NONE
  fi
  wpa_cli -i "$WIFI_IFACE" enable_network "$id"
  wpa_cli -i "$WIFI_IFACE" select_network "$id" || true
  wpa_cli -i "$WIFI_IFACE" save_config > /dev/null
}

wifi_status_wpa() {
  if have wpa_cli; then
    wpa_cli -i "$WIFI_IFACE" status
    ip -4 addr show dev "$WIFI_IFACE" | awk '/inet /{print "IPv4\t" $2}' || true
  else
    err "wpa_cli not found"
    exit 127
  fi
}

wifi_disconnect_wpa() {
  if have wpa_cli; then
    wpa_cli -i "$WIFI_IFACE" disconnect
  else
    err "wpa_cli not found"
    exit 127
  fi
}

wifi_onoff_wpa() {
  local arg="$1"
  if have rfkill; then
    if [ "$arg" = on ]; then
      sudo rfkill unblock wifi
    else
      sudo rfkill block wifi
    fi
  else
    err "rfkill not found to toggle Wi‑Fi"
    exit 127
  fi
}

usage() { sed -n '1,40p' "$0"; }

cmd="${1:-}"
case "$cmd" in
  list)
    if $use_nmcli; then wifi_list_nmcli; else wifi_list_wpa; fi ;;
  connect)
    ssid="${2:-}"; pass="${3:-}"
    if [ -z "$ssid" ]; then err "SSID required"; exit 2; fi
    if $use_nmcli; then wifi_connect_nmcli "$ssid" "$pass"; else wifi_connect_wpa "$ssid" "$pass"; fi ;;
  status)
    if $use_nmcli; then wifi_status_nmcli; else wifi_status_wpa; fi ;;
  disconnect)
    if $use_nmcli; then wifi_disconnect_nmcli; else wifi_disconnect_wpa; fi ;;
  on|off)
    if $use_nmcli; then wifi_onoff_nmcli "$cmd"; else wifi_onoff_wpa "$cmd"; fi ;;
  -h|--help|help|"")
    usage ;;
  *)
    err "Unknown command: $cmd"; usage; exit 2 ;;
esac
