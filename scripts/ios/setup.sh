#!/bin/bash
set -e

echo "📱 iOS Setup - Complete automated setup"
echo ""

# Navigate to project root if in scripts directory
if [ -f "../../package.json" ]; then
    cd ../..
fi

# Verify we're in project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Cannot find project root (no package.json)"
    echo "   Please run this script from the project root or scripts/ios directory"
    exit 1
fi
echo "✅ Project root: $(pwd)"

# Check prerequisites
echo ""
echo "🔍 Checking prerequisites..."

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm: $(npm --version)"

if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "❌ Xcode not found. Install from App Store and run: xcode-select --install"
    exit 1
fi
echo "✅ Xcode: $(xcodebuild -version | head -n 1)"

if ! command -v pod >/dev/null 2>&1; then
    echo "⚠️  CocoaPods not found. Installing..."
    if command -v brew >/dev/null 2>&1; then
        brew install cocoapods
    else
        sudo gem install cocoapods
    fi
fi
echo "✅ CocoaPods: $(pod --version)"

# Install npm dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Build web assets
echo ""
echo "🔨 Building web application..."
npm run build

# Add iOS platform if not exists
if [ ! -d "ios/App" ]; then
    echo ""
    echo "📱 Adding iOS platform..."
    npx cap add ios
else
    echo ""
    echo "✅ iOS platform already exists"
fi

# Sync Capacitor
echo ""
echo "🔄 Syncing Capacitor to iOS..."
npx cap sync ios

# Install CocoaPods dependencies
echo ""
echo "📦 Installing iOS dependencies (CocoaPods)..."
cd ios/App
pod install --repo-update
cd ../..

# Success
echo ""
echo "✅ iOS setup complete!"
echo ""
echo "🚀 Opening Xcode..."
npx cap open ios

echo ""
echo "📱 In Xcode:"
echo "   1. Select 'App' scheme (top bar)"
echo "   2. Choose a simulator (e.g., iPhone 15)"
echo "   3. Press Cmd+R to run"
echo ""
echo "💡 After code changes, run: npm run build && npx cap sync ios"
