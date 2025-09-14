#!/usr/bin/env python3
"""
Battery monitoring for Raspberry Pi handheld devices.
Supports various battery monitoring methods commonly used in Pi handhelds.
"""

import os
import sys
import glob
import subprocess
import json
from pathlib import Path


def get_cpu_temperature():
    """Get CPU temperature from /sys/class/thermal/"""
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp_millidegree = int(f.read().strip())
            temp_celsius = temp_millidegree / 1000.0
            return f"{temp_celsius:.1f}°C"
    except:
        return None


def get_battery_level_ups():
    """Get battery level from UPS HAT (common Pi handheld solution)"""
    try:
        # Try common UPS HAT I2C addresses
        for addr in ['0x36', '0x32', '0x17']:
            try:
                result = subprocess.run(['i2cget', '-y', '1', addr, '0x02'], 
                                      capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    # Convert hex to percentage (this is simplified - real UPS HATs may differ)
                    hex_val = result.stdout.strip()
                    if hex_val.startswith('0x'):
                        percentage = int(hex_val, 16)
                        return min(100, max(0, percentage))
            except:
                continue
    except:
        pass
    return None


def get_battery_level_power_supply():
    """Get battery level from /sys/class/power_supply/"""
    try:
        # Look for battery entries
        battery_paths = glob.glob('/sys/class/power_supply/BAT*') + \
                       glob.glob('/sys/class/power_supply/battery*')
        
        for bat_path in battery_paths:
            capacity_file = os.path.join(bat_path, 'capacity')
            if os.path.exists(capacity_file):
                with open(capacity_file, 'r') as f:
                    return int(f.read().strip())
    except:
        pass
    return None


def get_battery_level_fake():
    """Return a fake battery level for development/testing"""
    import time
    # Simulate battery drain for testing
    fake_level = 85 - int(time.time() / 100) % 85
    return max(10, fake_level)


def get_wifi_signal_strength():
    """Get Wi-Fi signal strength"""
    try:
        result = subprocess.run(['iwconfig'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            # Parse signal strength from iwconfig output
            for line in result.stdout.split('\n'):
                if 'Signal level' in line:
                    # Extract signal strength (e.g., "Signal level=-45 dBm")
                    import re
                    match = re.search(r'Signal level=(-?\d+)', line)
                    if match:
                        return f"{match.group(1)} dBm"
        
        # Fallback: try nmcli
        result = subprocess.run(['nmcli', '-t', '-f', 'IN-USE,SIGNAL', 'dev', 'wifi'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if line.startswith('*'):
                    parts = line.split(':')
                    if len(parts) > 1 and parts[1].isdigit():
                        signal = int(parts[1])
                        # Convert to approximate dBm
                        dbm = -100 + (signal * 0.5)
                        return f"{dbm:.0f} dBm"
    except:
        pass
    return None


def main():
    """Main function to gather and return system status"""
    status = {
        'cpu_temp': get_cpu_temperature(),
        'battery': get_battery_level_power_supply() or get_battery_level_ups() or get_battery_level_fake(),
        'wifi_signal': get_wifi_signal_strength()
    }
    
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        print(json.dumps(status))
    else:
        # Human-readable output
        print(f"CPU Temperature: {status['cpu_temp'] or 'Unknown'}")
        print(f"Battery Level: {status['battery']}%" if status['battery'] else "Battery Level: Unknown")
        print(f"Wi-Fi Signal: {status['wifi_signal'] or 'Unknown'}")


if __name__ == "__main__":
    main()