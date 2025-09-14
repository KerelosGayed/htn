#!/usr/bin/env bash
# Manual setup script for fixing npm permissions on Raspberry Pi
# Run this if you encounter permission issues with npm or the deploy script

echo "🔧 Fixing npm permissions on Raspberry Pi..."

# Create directory for global npm packages
mkdir -p ~/.npm-global

# Configure npm to use this directory
npm config set prefix '~/.npm-global'

# Add the new path to PATH in .bashrc
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# Apply the changes to current shell
export PATH=~/.npm-global/bin:$PATH

echo "✅ npm permissions configured!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your terminal or run: source ~/.bashrc"
echo "2. Run the deploy script again: ./deploy_to_pi.sh"
echo ""
echo "ℹ️  You can now install global packages without sudo:"
echo "   npm install -g <package-name>"