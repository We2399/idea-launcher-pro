#!/bin/bash
set -e

# 🚀 Full rebuild + sync + run for Android
# Usage: bash scripts/android/run.sh

echo "🚀 Rebuilding and running Android app..."

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

echo "📦 Checking npm dependencies..."
npm install

echo "🔨 Building web assets..."
npm run build

echo "🔄 Syncing to Android..."
npx cap sync android

echo "🚀 Launching Android app..."
npx cap run android
