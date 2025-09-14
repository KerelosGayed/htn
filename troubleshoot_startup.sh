#!/usr/bin/env bash
# Hermes startup troubleshooting script for Raspberry Pi

set -euo pipefail

HERMES_DIR="$(dirname "$(readlink -f "$0")")"
cd "$HERMES_DIR"

echo "🔍 Hermes Startup Troubleshooting"
echo "=================================="

# Check if Hermes directory exists
echo ""
echo "📁 Checking Hermes installation..."
if [ -d "hermes-desktop" ]; then
    echo "✅ Hermes desktop directory found"
    cd hermes-desktop
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        echo "✅ Node modules installed"
    else
        echo "❌ Node modules missing - run: npm ci"
    fi
    
    # Check if dist exists
    if [ -d "dist" ]; then
        echo "✅ Built application found"
    else
        echo "❌ Built application missing - run: npm run build"
    fi
else
    echo "❌ Hermes desktop directory not found"
    exit 1
fi

# Check npm and node
echo ""
echo "🔧 Checking Node.js environment..."
if command -v npm >/dev/null 2>&1; then
    echo "✅ npm found: $(npm --version)"
else
    echo "❌ npm not found"
fi

if command -v node >/dev/null 2>&1; then
    echo "✅ node found: $(node --version)"
else
    echo "❌ node not found"
fi

# Check global npm path
echo ""
echo "🌐 Checking npm global path..."
if [ -d "/home/pi/.npm-global" ]; then
    echo "✅ Global npm directory exists"
    if echo "$PATH" | grep -q "/home/pi/.npm-global/bin"; then
        echo "✅ Global npm path in PATH"
    else
        echo "❌ Global npm path NOT in PATH"
        echo "   Add to ~/.bashrc: export PATH=~/.npm-global/bin:\$PATH"
    fi
else
    echo "❌ Global npm directory missing"
    echo "   Run: mkdir -p ~/.npm-global && npm config set prefix '~/.npm-global'"
fi

# Check systemd service
echo ""
echo "🚀 Checking systemd service..."
if systemctl --user list-unit-files | grep -q hermes.service; then
    echo "✅ User service found"
    systemctl --user status hermes.service || true
elif sudo systemctl list-unit-files | grep -q hermes.service; then
    echo "✅ System service found"
    sudo systemctl status hermes.service || true
else
    echo "❌ No systemd service found"
fi

# Check XDG autostart
echo ""
echo "🖥️  Checking XDG autostart..."
if [ -f ~/.config/autostart/hermes.desktop ]; then
    echo "✅ XDG autostart file exists"
    echo "📄 Contents:"
    cat ~/.config/autostart/hermes.desktop
else
    echo "❌ XDG autostart file missing"
fi

# Check if app can start manually
echo ""
echo "🧪 Testing manual startup..."
echo "Trying to start Hermes manually (5 second timeout)..."

cd "$HERMES_DIR/hermes-desktop"
if timeout 20s npm run dev >/dev/null 2>&1; then
    echo "✅ Manual startup successful"
else
    echo "❌ Manual startup failed"
    echo "   Try running: cd $HERMES_DIR/hermes-desktop && npm run dev"
fi

echo ""
echo "🔧 Quick fixes:"
echo "1. Reinstall dependencies: cd hermes-desktop && npm ci"
echo "2. Rebuild app: npm run build"
echo "3. Restart systemd: sudo systemctl daemon-reload && sudo systemctl restart hermes.service"
echo "4. Check logs: sudo journalctl -u hermes.service -f"
echo "5. Try XDG autostart: reboot and check if app starts with desktop"