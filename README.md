# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/bea471aa-2444-40ca-9c0c-5142cd0a98fc

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bea471aa-2444-40ca-9c0c-5142cd0a98fc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bea471aa-2444-40ca-9c0c-5142cd0a98fc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Running on Android and iOS

This project is set up with Capacitor for native mobile development.

### Prerequisites

**For Android:**
- Install [Android Studio](https://developer.android.com/studio)
- Install Android SDK (API 33 or higher)
- Install Java JDK 17 (set in Android Studio > Preferences > Build Tools > Gradle)

**For iOS (Mac only):**
- Install [Xcode](https://developer.apple.com/xcode/) from the Mac App Store
- Install Xcode Command Line Tools: `xcode-select --install`

### First Time Setup

1. **Clone and install dependencies:**
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
```

2. **Add Android platform (first time only):**
```sh
npx cap add android
```

3. **Add iOS platform (first time only, Mac only):**
```sh
npx cap add ios
```

### Capacitor Modes

The app can run in two modes:

#### **Local Mode (Default)** - For testing and production
- Uses bundled assets from your `dist` folder
- Works offline, no network dependency
- Fast and reliable for emulator/device testing
- **Current config:** Server block is commented out in `capacitor.config.ts`

#### **Development Mode** - For live reload from Lovable
- Loads app directly from Lovable sandbox URL
- Changes in Lovable appear instantly on your device/emulator
- Requires internet connection
- **To enable:** Uncomment the `server` block in `capacitor.config.ts`

### Running the App

**On Android:**

Quick start from terminal:
```sh
cd ~/Projects/idea-launcher-pro
npm run build
npx cap sync android
npx cap run android
```

Or open in Android Studio:
```sh
npx cap open android
# Then click the green Play ▶️ button
```

**On iOS (Mac only):**

**One-command setup (recommended):**
```sh
bash scripts/ios/doctor.sh
```
This checks all prerequisites, builds the app, and opens Xcode ready to run.

**If you encounter issues:**
```sh
bash scripts/ios/reset.sh
```
This does a complete clean reset of the iOS setup.

**After pulling changes from Git:**
```sh
npm install
npm run build
npx cap sync ios
cd ios/App && pod install && cd ../..
open ios/App/App.xcworkspace
```

**Quick terminal run:**
```sh
npm run build
npx cap sync ios
npx cap run ios
```

**Common iOS Issues:**
- **"pod: command not found"** → Install CocoaPods (the doctor script will show you how)
- **Empty Xcode window** → Run `bash scripts/ios/doctor.sh` to generate the workspace
- **Build errors** → Run `bash scripts/ios/reset.sh` for a clean setup

### Switching to Development Mode (Live Reload)

To enable instant reload from Lovable:
1. Open `capacitor.config.ts`
2. Uncomment the `server` block
3. Run: `npx cap sync android` (or `ios`)
4. Run the app - changes in Lovable will appear instantly

### Building for Production

To build the app for store distribution:

1. Comment out the `server` section in `capacitor.config.ts`
2. Build and sync: `npm run build && npx cap sync`
3. Open in native IDE and create a release build:
   - **Android:** Use Android Studio to generate a signed APK/AAB
   - **iOS:** Use Xcode to archive and submit to App Store

### Useful Commands

- `npx cap sync` - Sync web assets to native platforms
- `npx cap open android` - Open project in Android Studio
- `npx cap open ios` - Open project in Xcode
- `npx cap update` - Update Capacitor dependencies

### Troubleshooting

**"Cannot find package.json"**: Make sure you're in the project directory before running commands.

**Gradle/JDK errors**: Use JDK 17 in Android Studio settings.

**iOS signing errors**: Set your Apple Developer Team in Xcode under Signing & Capabilities.

For more help, see the [Capacitor Documentation](https://capacitorjs.com/docs).
