# Hermes 🎮

> A custom Raspberry Pi 4-powered handheld game streaming console with seamless Xbox 360 controller navigation.

**Hermes** transforms your Raspberry Pi 4 into a portable game streaming device, letting you play PC games wirelessly via Steam Link, Moonlight, or Parsec. Built with a console-style interface optimized for handheld gaming.

## ✨ Features

### 🎯 Complete Gaming Interface
- **Home Screen**: Quick access to streaming, settings, and library
- **Start Streaming**: Launch Steam Link, Moonlight, or Parsec with one click
- **Game Library**: Browse and launch games with responsive grid layout
- **System Settings**: Full control over Wi-Fi, Bluetooth, volume, and system status

### 🎮 Xbox 360 Controller Support
- **Seamless Navigation**: D-Pad and Left Stick for menu navigation
- **Intuitive Controls**: A=Select, B=Back, with visual focus indicators
- **Real-time Feedback**: Smooth animations and clear focus rings
- **Context-aware**: Adapts to different screen layouts (grid vs linear)

### 🔧 Raspberry Pi Integration
- **Wi-Fi Management**: Scan, connect, and manage wireless networks
- **Bluetooth Control**: Pair controllers and manage Bluetooth devices  
- **Volume Control**: Real-time audio adjustment with visual feedback
- **System Monitoring**: CPU temperature, battery level, and signal strength
- **Auto-startup**: Optional systemd service for boot-to-console experience

### 🎨 Modern UI/UX
- **Console-style Design**: Clean, gaming-focused interface
- **Responsive Layout**: Optimized for handheld screens
- **Smooth Animations**: Framer Motion transitions between screens
- **Beautiful Styling**: Custom background and focus effects

## 🚀 Setup on Raspberry Pi 4

### Prerequisites
You'll need a fresh Raspberry Pi OS installation and an internet connection.

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    steamlink \
    alsa-utils \
    network-manager \
    bluetooth \
    bluez \
    bluez-tools \
    i2c-tools \
    wireless-tools \
    curl \
    git
```

### 2. Install Node.js 18+

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 3. Clone and Deploy Hermes

```bash
# Clone the repository
cd ~
git clone https://github.com/YourUsername/htn.git hermes
cd hermes

# Run the deployment script
chmod +x deploy_to_pi.sh
./deploy_to_pi.sh
```

The deployment script will:
- Set proper permissions on all scripts
- Install Node.js dependencies  
- Build the application
- Create a systemd service for auto-startup
- Configure the system for optimal performance

### 4. Connect Your Xbox 360 Controller

**Wired Controller:**
```bash
# Plug in via USB - should work automatically
# Test with: jstest /dev/input/js0
```

**Wireless Controller:**
```bash
# Put controller in pairing mode (hold Xbox + pair buttons)
sudo bluetoothctl
> scan on
> pair [CONTROLLER_MAC_ADDRESS]
> trust [CONTROLLER_MAC_ADDRESS]  
> connect [CONTROLLER_MAC_ADDRESS]
> exit
```

### 5. Start Hermes

**Manual start:**
```bash
cd ~/hermes/hermes-desktop
npm run start
```

**Auto-start service:**
```bash
# Enable auto-start on boot
sudo systemctl enable hermes.service
sudo systemctl start hermes.service

# Check status
sudo systemctl status hermes.service
```

## 🎮 Usage

1. **Power on** your Raspberry Pi with Hermes installed
2. **Connect** your Xbox 360 controller (wired or wireless)
3. **Navigate** using D-Pad or Left Stick
4. **Select** items with A button, **go back** with B button
5. **Configure** Wi-Fi and settings from the Settings screen
6. **Launch** Steam Link or other streaming services from Start Streaming

## 🛠️ Troubleshooting

**Steam Link not launching?**
```bash
# Test Steam Link manually
steamlink --help
# Or try Flatpak version
flatpak install flathub com.valvesoftware.SteamLink
```

**Controller not detected?**
```bash
# Check for connected controllers
jstest /dev/input/js0
# Or list all input devices  
ls /dev/input/js*
```

**Wi-Fi not working?**
```bash
# Test Wi-Fi script manually
./wifi_manage.sh status
./wifi_manage.sh list
```

**Audio issues?**
```bash
# Test volume control
python3 ./volume_control.py
# Or check ALSA
amixer get Master
```

## 🔧 Development

**On Windows (for development):**
```powershell
cd .\hermes-desktop
npm install
npm run dev
```

**Build for production:**
```bash
npm run build
```

## 📁 Project Structure

```
htn/
├── hermes-desktop/          # Electron + React app
│   ├── src/                 # Frontend source code
│   ├── electron-main.js     # Main Electron process
│   └── package.json         # Dependencies and scripts
├── open_steam_link.sh       # Steam Link launcher script
├── wifi_manage.sh          # Wi-Fi management script
├── volume_control.py       # Volume control script
├── battery_status.py       # Battery monitoring script
└── deploy_to_pi.sh         # Automated deployment script
```

## 📝 License

MIT License - feel free to modify and distribute for your own handheld projects!
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
