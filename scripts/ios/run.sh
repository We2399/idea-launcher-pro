#!/bin/bash
set -e

# 🚀 One-click iOS run: builds, syncs, and launches the simulator
# Usage: bash scripts/ios/run.sh

# Move to project root if executed from scripts/ios
if [ -f "../../package.json" ]; then
  cd ../..
fi

# Basic sanity check
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the project root or scripts/ios"
  exit 1
fi

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building web assets..."
npm run build

# Ensure iOS platform exists
if [ ! -d "ios/App" ]; then
  echo "📱 Adding iOS platform..."
  npx cap add ios
else
  echo "✅ iOS platform present"
fi

echo "🔄 Syncing to iOS (Capacitor)..."
npx cap sync ios

# Install CocoaPods dependencies if CocoaPods is available
if command -v pod >/dev/null 2>&1; then
  echo "📦 Installing CocoaPods dependencies..."
  (cd ios/App && pod install --repo-update)
else
  echo "⚠️  CocoaPods not found - skipping pod install (Xcode may install automatically)"
fi

echo "🏃 Running on iOS simulator..."
# Let Capacitor pick the best available simulator
npx cap run ios
