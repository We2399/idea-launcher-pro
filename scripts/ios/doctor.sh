#!/bin/bash
set -e

echo "🔍 iOS Setup Doctor - Checking your environment..."
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

# Check Node/npm
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ Error: npm is not installed"
    exit 1
fi
echo "✅ npm: $(npm --version)"

# Check Xcode
if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "❌ Error: Xcode Command Line Tools not installed"
    echo "   Run: xcode-select --install"
    exit 1
fi
echo "✅ Xcode: $(xcodebuild -version | head -n 1)"

# Check CocoaPods
if ! command -v pod >/dev/null 2>&1; then
    echo "❌ Error: CocoaPods is not installed"
    echo ""
    echo "Install CocoaPods with one of these methods:"
    echo "  1. Using Homebrew (recommended):"
    echo "     /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "     brew install cocoapods"
    echo ""
    echo "  2. Using RubyGems:"
    echo "     sudo gem install cocoapods"
    echo ""
    exit 1
fi
echo "✅ CocoaPods: $(pod --version)"

# Check if iOS platform exists
if [ ! -d "ios/App" ]; then
    echo "⚠️  iOS platform not added yet"
    echo "   Adding iOS platform..."
    npx cap add ios
fi
echo "✅ iOS platform exists"

# Install node modules if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi
echo "✅ Node modules installed"

# Build web assets
echo "🔨 Building web assets..."
npm run build

# Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync ios

# Check and install Pods
if [ ! -d "ios/App/Pods" ] || [ ! -f "ios/App/Podfile.lock" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    cd ios/App
    pod install --repo-update
    cd ../..
else
    echo "✅ CocoaPods dependencies already installed"
fi

# Check if workspace exists
if [ ! -d "ios/App/App.xcworkspace" ]; then
    echo "❌ Error: App.xcworkspace not found after setup"
    echo "   Try running: npm run ios:reset"
    exit 1
fi
echo "✅ Xcode workspace ready"

echo ""
echo "✨ All checks passed! Opening Xcode..."
open ios/App/App.xcworkspace

echo ""
echo "📱 Next steps in Xcode:"
echo "   1. Select 'App' scheme at the top"
echo "   2. Choose a simulator (e.g., iPhone 15)"
echo "   3. Press Cmd+R to run"
