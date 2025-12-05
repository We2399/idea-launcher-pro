# iOS Development Setup Guide

## Prerequisites

Before starting, ensure you have:
- **macOS** (required for iOS development)
- **Xcode** installed from App Store
- **Xcode Command Line Tools**: Run `xcode-select --install`
- **CocoaPods**: Run `sudo gem install cocoapods`
- **Node.js** and **npm** installed

## Quick Start (First Time Setup)

Run these commands in your terminal from the project root:

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Add iOS platform (only needed once)
npx cap add ios

# 4. Sync Capacitor
npx cap sync ios

# 5. Open in Xcode
npx cap open ios
```

In Xcode:
1. Select **"App"** scheme at the top
2. Choose a simulator (e.g., **iPhone 15**)
3. Press **Cmd+R** to build and run

## Daily Development Workflow

After making code changes:

```bash
# 1. Rebuild web assets
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Xcode will auto-reload, or press Cmd+R
```

## Troubleshooting

### "No such file or directory: ios/App"

Run: `npx cap add ios`

### CocoaPods errors

```bash
cd ios/App
pod deintegrate
rm -rf Pods Podfile.lock
pod install --repo-update
cd ../..
```

### Build errors in Xcode

1. Clean build folder: **Product → Clean Build Folder** (Cmd+Shift+K)
2. Close Xcode
3. Run:
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### "Waiting to reconnect to WWW"

The app is in offline mode (uses bundled dist assets). To enable live reload:
1. Open `capacitor.config.ts`
2. Uncomment the `server` block
3. Rebuild and sync

## App Configuration

- **App ID**: `app.lovable.bea471aa244440ca9c0c5142cd0a98fc`
- **App Name**: `Jie Jie Helpers Hub`
- **Web Assets**: `dist/` folder
- **Mode**: Local/Offline (no network required)

## Helper Scripts

The project includes helper scripts in `scripts/ios/`:

- **doctor.sh**: Checks your environment and sets up everything
- **reset.sh**: Clean reinstall (use if you have persistent issues)

Run with:
```bash
bash scripts/ios/doctor.sh
# or
bash scripts/ios/reset.sh
```

## Need Help?

- Check Capacitor docs: https://capacitorjs.com/docs/ios
- Lovable Discord: https://discord.com/channels/1119885301872070706
- Troubleshooting: https://docs.lovable.dev/tips-tricks/troubleshooting
