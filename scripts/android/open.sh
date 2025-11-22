#!/bin/bash
set -e

# 📂 Open Android project in Android Studio after build & sync
# Usage: bash scripts/android/open.sh

echo "📂 Opening Android project..."

# Move to project root if executed from scripts/android
if [ -f "../../package.json" ]; then
  cd ../..
fi

# Basic sanity check
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the project root or scripts/android"
  exit 1
fi

if [ ! -d "android" ]; then
  echo "❌ Error: Android platform not found. Run setup first:"
  echo "   bash scripts/android/setup.sh"
  exit 1
fi

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building web assets..."
npm run build

echo "🔄 Syncing to Android..."
npx cap sync android

echo "🧭 Opening Android Studio..."
npx cap open android
