#!/usr/bin/env python3
"""
Curses-based volume controller for Raspberry Pi using ALSA (amixer).
- Up/Right: volume +5%
- Down/Left: volume -5%
- M: mute toggle
- Q or Enter: exit

Displays a horizontal bar with current volume and mute state.
Requires: alsa-utils (amixer)
"""
import curses
import os
import re
import shutil
import subprocess
from typing import Tuple

STEP = int(os.environ.get("VOLUME_STEP", "5"))
CHANNEL = os.environ.get("VOLUME_CHANNEL", "Master")

AMIXER = shutil.which("amixer")

vol_re = re.compile(r"(\d+)%")
muted_re = re.compile(r"\[(on|off)\]", re.IGNORECASE)


def get_volume() -> Tuple[int, bool]:
    """Return (volume_percent, muted) for CHANNEL using amixer."""
    if not AMIXER:
        raise RuntimeError("amixer not found. Install with 'sudo apt install alsa-utils'.")
    out = subprocess.check_output([AMIXER, "get", CHANNEL], text=True)
    # Find last line with [%]
    vol = 0
    muted = False
    for line in out.splitlines():
        if "%]" in line:
            m = vol_re.search(line)
            if m:
                vol = int(m.group(1))
            m2 = muted_re.findall(line)
            if m2:
                muted = (m2[-1].lower() == "off")
    return vol, muted


def set_volume(delta: int = 0, absolute: int | None = None):
    if absolute is not None:
        val = max(0, min(100, int(absolute)))
        subprocess.run([AMIXER, "set", CHANNEL, f"{val}%"], check=True)
    else:
        sign = "+" if delta >= 0 else "-"
        amt = abs(delta)
        subprocess.run([AMIXER, "set", CHANNEL, f"{amt}%{sign}"], check=True)


def toggle_mute():
    subprocess.run([AMIXER, "set", CHANNEL, "toggle"], check=True)

def set_mute(mute: bool):
    subprocess.run([AMIXER, "set", CHANNEL, "mute" if mute else "unmute"], check=True)


def draw_bar(stdscr, vol: int, muted: bool):
    stdscr.clear()
    h, w = stdscr.getmaxyx()
    title = "Volume Control"
    help_text = "Arrows=Adj 5%  M=Mute  Enter/Q=Exit"
    status = f"{vol}% {'(MUTED)' if muted else ''}"

    stdscr.attron(curses.A_BOLD)
    stdscr.addstr(1, max(0, (w - len(title)) // 2), title)
    stdscr.attroff(curses.A_BOLD)

    # Bar dimensions
    bar_w = min(w - 4, 60)
    bar_x = (w - bar_w) // 2
    bar_y = h // 2

    # Outline
    stdscr.addstr(bar_y - 1, bar_x, "[" + (" " * (bar_w - 2)) + "]")
    fill_w = int((bar_w - 2) * vol / 100)
    bar_fill = "#" * fill_w
    stdscr.addstr(bar_y - 1, bar_x + 1, bar_fill)

    stdscr.addstr(bar_y + 1, max(0, (w - len(status)) // 2), status)
    stdscr.addstr(h - 2, max(0, (w - len(help_text)) // 2), help_text)
    stdscr.refresh()


def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(False)
    stdscr.keypad(True)

    vol, muted = get_volume()
    draw_bar(stdscr, vol, muted)

    while True:
        ch = stdscr.getch()
        if ch in (curses.KEY_UP, curses.KEY_RIGHT):
            set_volume(delta=STEP)
        elif ch in (curses.KEY_DOWN, curses.KEY_LEFT):
            set_volume(delta=-STEP)
        elif ch in (ord('m'), ord('M')):
            toggle_mute()
        elif ch in (ord('q'), ord('Q'), curses.KEY_ENTER, 10, 13):
            break
        vol, muted = get_volume()
        draw_bar(stdscr, vol, muted)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Volume control (TUI or one-shot CLI)")
    g = parser.add_mutually_exclusive_group()
    g.add_argument("--get", action="store_true", help="Print current volume percentage and mute state")
    g.add_argument("--set", type=int, metavar="PCT", help="Set absolute volume (0-100)")
    g.add_argument("--inc", type=int, metavar="STEP", help="Increase volume by STEP percent")
    g.add_argument("--dec", type=int, metavar="STEP", help="Decrease volume by STEP percent")
    parser.add_argument("--mute", action="store_true", help="Mute output")
    parser.add_argument("--unmute", action="store_true", help="Unmute output")
    args = parser.parse_args()

    if args.get:
        v, m = get_volume()
        print(f"{v}% {'muted' if m else 'on'}")
    elif args.set is not None:
        set_volume(absolute=args.set)
    elif args.inc is not None:
        set_volume(delta=abs(args.inc))
    elif args.dec is not None:
        set_volume(delta=-abs(args.dec))
    elif args.mute:
        set_mute(True)
    elif args.unmute:
        set_mute(False)
    else:
        curses.wrapper(main)
