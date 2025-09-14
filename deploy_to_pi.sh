#!/usr/bin/env bash
# Deployment script for Hermes on Raspberry Pi
# Run this on the Pi after copying all files

set -euo pipefail

HERMES_DIR="$(dirname "$(readlink -f "$0")")"
cd "$HERMES_DIR"

echo "🚀 Deploying Hermes to Raspberry Pi..."

# Make all scripts executable
echo "📜 Setting script permissions..."
chmod +x open_steam_link.sh
chmod +x wifi_manage.sh
chmod +x volume_control.py
chmod +x battery_status.py

# Install system dependencies
echo "📦 Installing system dependencies..."
sudo apt update
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

# Configure npm to avoid permission issues
echo "🔧 Configuring npm permissions..."
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Add to bash profile if not already there
if ! grep -q "export PATH=~/.npm-global/bin:\$PATH" ~/.bashrc; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
fi

# Navigate to electron app directory
cd hermes-desktop

# Install Node.js dependencies (including dev dependencies for building)
echo "📱 Installing Node.js dependencies..."
npm ci

# Build the app
echo "🔨 Building the application..."
npm run build

# Create systemd service for auto-startup (optional)
echo "⚙️  Setting up auto-start service..."
sudo tee /etc/systemd/system/hermes.service > /dev/null <<EOF
[Unit]
Description=Hermes Gaming Console
After=graphical-session.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=PATH=/home/pi/.npm-global/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
WorkingDirectory=$HERMES_DIR/hermes-desktop
ExecStart=/home/pi/.npm-global/bin/npm run dev
Restart=always
RestartSec=5

[Install]
WantedBy=graphical-session.target
EOF

# Enable service (user can disable if not wanted)
echo "🔧 Enabling Hermes service..."
sudo systemctl daemon-reload
sudo systemctl enable hermes.service

echo "✅ Hermes deployment complete!"
echo ""
echo "🎮 To start Hermes:"
echo "   sudo systemctl start hermes.service"
echo ""
echo "🎯 To start manually:"
echo "   cd $HERMES_DIR/hermes-desktop && npm run start"
echo ""
echo "📊 To check status:"
echo "   sudo systemctl status hermes.service"
echo ""
echo "🧪 To test backend scripts:"
echo "   ./battery_status.py --json"
echo "   ./wifi_manage.sh status"
echo "   python3 ./volume_control.py --help"