#!/bin/bash
set -e

echo "🔄 iOS Setup Reset - Starting fresh..."
echo ""

# Navigate to project root if in scripts directory
if [ -f "../../package.json" ]; then
    cd ../..
fi

# Check if we're in project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root. Please run from project root directory."
    exit 1
fi
echo "✅ Project root: $(pwd)"

# Check if iOS platform exists
if [ ! -d "ios/App" ]; then
    echo "❌ Error: iOS platform not found. Run 'npx cap add ios' first."
    exit 1
fi

# Quit Xcode if running (macOS only)
if command -v osascript >/dev/null 2>&1; then
    echo "🛑 Closing Xcode if open..."
    osascript -e 'quit app "Xcode"' 2>/dev/null || true
fi

# Clean Pods
echo "🧹 Cleaning CocoaPods..."
cd ios/App

if [ -d "Pods" ]; then
    rm -rf Pods
    echo "   ✓ Removed Pods directory"
fi

if [ -f "Podfile.lock" ]; then
    rm -f Podfile.lock
    echo "   ✓ Removed Podfile.lock"
fi

# Deintegrate if pod deintegrate is available
if command -v pod >/dev/null 2>&1; then
    pod deintegrate 2>/dev/null || true
    echo "   ✓ Deintegrated CocoaPods"
fi

cd ../..

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "   ✓ Removed dist directory"
fi

# Reinstall and rebuild
echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Building web assets..."
npm run build

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "📦 Installing CocoaPods dependencies..."
cd ios/App
pod install --repo-update
cd ../..

echo ""
echo "✅ Reset complete! Opening Xcode..."
open ios/App/App.xcworkspace

echo ""
echo "📱 Next steps in Xcode:"
echo "   1. Select 'App' scheme at the top"
echo "   2. Choose a simulator (e.g., iPhone 15)"
echo "   3. Press Cmd+R to run"
