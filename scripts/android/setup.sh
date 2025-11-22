#!/bin/bash
set -e

# 📱 One-time Android setup script
# Usage: bash scripts/android/setup.sh

echo "🚀 Starting Android setup..."

# Move to project root if executed from scripts/android
if [ -f "../../package.json" ]; then
  cd ../..
fi

# Basic sanity check
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the project root or scripts/android"
  exit 1
fi

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building web assets..."
npm run build

# Add Android platform if not exists
if [ ! -d "android" ]; then
  echo "📱 Adding Android platform..."
  npx cap add android
else
  echo "✅ Android platform already exists"
fi

echo "🔄 Syncing to Android (Capacitor)..."
npx cap sync android

echo ""
echo "✅ Android setup complete!"
echo ""
echo "Next steps:"
echo "  1. Connect your Android phone via USB (enable USB debugging)"
echo "  2. Run: npx cap run android"
echo "     OR"
echo "     Run: npx cap open android (then run from Android Studio)"
echo ""
echo "For future changes, use: bash scripts/android/sync.sh"
