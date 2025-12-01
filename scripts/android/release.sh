#!/bin/bash
set -e

# 📦 Android Release Build Script
# Prepares a release build for Google Play submission

echo "📦 Android Release Build Process"
echo "================================="
echo ""

# Navigate to project root
if [ -f "../../package.json" ]; then
  cd ../..
fi

if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the project root or scripts/android"
  exit 1
fi

# Check prerequisites
echo "🔍 Checking prerequisites..."
if [ ! -d "$ANDROID_HOME" ] && [ ! -d "$ANDROID_SDK_ROOT" ]; then
  echo "⚠️  Warning: ANDROID_HOME not set. Make sure Android Studio is installed."
fi

# Build web assets
echo ""
echo "🔨 Building web assets for production..."
npm run build

# Sync to Android
echo ""
echo "🔄 Syncing to Android..."
npx cap sync android

# Open Android Studio
echo ""
echo "✅ Build preparation complete!"
echo ""
echo "📱 Next steps in Android Studio:"
echo "   1. Build → Generate Signed Bundle/APK"
echo "   2. Select 'Android App Bundle' (AAB)"
echo "   3. Create or select keystore (save securely!)"
echo "   4. Select 'release' variant"
echo "   5. Test the release build on a device"
echo "   6. Upload AAB to Google Play Console"
echo ""
echo "⚠️  IMPORTANT: Save your keystore file and passwords securely!"
echo "   You'll need them for all future updates."
echo ""
echo "🚀 Opening Android Studio..."
npx cap open android
