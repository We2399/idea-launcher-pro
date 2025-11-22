#!/bin/bash

# 🩺 Android troubleshooting helper
# Usage: bash scripts/android/doctor.sh

echo "🩺 Android Doctor - Diagnosing your setup..."
echo ""

# Move to project root if executed from scripts/android
if [ -f "../../package.json" ]; then
  cd ../..
fi

# Check if we're in project root
if [ ! -f "package.json" ]; then
  echo "❌ Not in project root"
  exit 1
fi
echo "✅ Project root found"

# Check Node.js
if command -v node >/dev/null 2>&1; then
  echo "✅ Node.js installed: $(node --version)"
else
  echo "❌ Node.js not found"
  echo "   Install from: https://nodejs.org/"
  exit 1
fi

# Check npm
if command -v npm >/dev/null 2>&1; then
  echo "✅ npm installed: $(npm --version)"
else
  echo "❌ npm not found"
  exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
  echo "✅ node_modules exists"
else
  echo "⚠️  node_modules missing - run: npm install"
fi

# Check if dist exists
if [ -d "dist" ]; then
  echo "✅ dist folder exists"
else
  echo "⚠️  dist folder missing - run: npm run build"
fi

# Check if android platform exists
if [ -d "android" ]; then
  echo "✅ Android platform exists"
else
  echo "❌ Android platform not found"
  echo "   Run: npx cap add android"
  exit 1
fi

# Check capacitor.config.ts
if [ -f "capacitor.config.ts" ]; then
  echo "✅ capacitor.config.ts found"
else
  echo "❌ capacitor.config.ts not found"
  exit 1
fi

# Check for Android Studio (common locations)
if [ -d "/Applications/Android Studio.app" ] || [ -d "$HOME/Library/Android" ] || [ -d "$HOME/Android" ]; then
  echo "✅ Android Studio likely installed"
else
  echo "⚠️  Android Studio not found in common locations"
  echo "   Install from: https://developer.android.com/studio"
fi

# Check for adb (Android Debug Bridge)
if command -v adb >/dev/null 2>&1; then
  echo "✅ adb installed: $(adb --version | head -n 1)"
  
  # Check for connected devices
  echo ""
  echo "📱 Checking connected devices..."
  adb devices
else
  echo "⚠️  adb not found (comes with Android Studio)"
  echo "   Add Android SDK platform-tools to PATH"
fi

echo ""
echo "🩺 Diagnosis complete!"
echo ""
echo "Common fixes:"
echo "  • Missing node_modules: npm install"
echo "  • Missing dist: npm run build"
echo "  • Missing Android platform: npx cap add android"
echo "  • Stale build: bash scripts/android/sync.sh"
echo "  • Android Studio not opening: npx cap open android"
echo "  • Device not detected: Enable USB debugging on phone"
