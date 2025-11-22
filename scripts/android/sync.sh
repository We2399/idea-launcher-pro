#!/bin/bash
set -e

# 🔄 Quick sync script for Android after code changes
# Usage: bash scripts/android/sync.sh

echo "🔄 Syncing changes to Android..."

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

echo "🔨 Building web assets..."
npm run build

echo "🔄 Syncing to Android..."
npx cap sync android

echo ""
echo "✅ Sync complete! Now run the app:"
echo "   npx cap run android"
echo "   OR"
echo "   npx cap open android (then run from Android Studio)"
