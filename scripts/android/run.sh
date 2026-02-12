#!/bin/bash
set -e

# 🚀 Full rebuild + sync + run for Android
# Usage: bash scripts/android/run.sh
# This is your ONE command to refresh everything!

echo "🚀 Full Android rebuild starting..."

# Move to project root if executed from scripts/android
if [ -f "../../package.json" ]; then
  cd ../..
fi

# Basic sanity check
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the project root or scripts/android"
  exit 1
fi

echo "📥 Pulling latest code..."
git pull

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building web assets..."
npm run build

# Recreate Android platform to pick up any config changes
if [ -d "android" ]; then
  echo "🗑️  Removing old Android platform..."
  rm -rf android
fi

echo "📱 Adding fresh Android platform..."
npx cap add android

echo "🔄 Syncing to Android..."
npx cap sync android

echo "🚀 Launching Android app..."
npx cap run android
