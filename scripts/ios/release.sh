#!/bin/bash
set -e

# 📦 iOS Release Build Script
# Prepares a release build for App Store submission

echo "📦 iOS Release Build Process"
echo "=============================="
echo ""

# Navigate to project root
if [ -f "../../package.json" ]; then
  cd ../..
fi

if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from the project root or scripts/ios"
  exit 1
fi

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "❌ Xcode not found. Install from App Store."
  exit 1
fi

# Build web assets
echo ""
echo "🔨 Building web assets for production..."
npm run build

# Sync to iOS
echo ""
echo "🔄 Syncing to iOS..."
npx cap sync ios

# Install CocoaPods
if command -v pod >/dev/null 2>&1; then
  echo ""
  echo "📦 Installing CocoaPods dependencies..."
  (cd ios/App && pod install --repo-update)
fi

# Open Xcode
echo ""
echo "✅ Build preparation complete!"
echo ""
echo "📱 Next steps in Xcode:"
echo "   1. Product → Scheme → Edit Scheme → Set to 'Release'"
echo "   2. Product → Archive (5-10 minutes)"
echo "   3. Test the archive on a device first"
echo "   4. Distribute App → App Store Connect"
echo ""
echo "🚀 Opening Xcode..."
npx cap open ios
