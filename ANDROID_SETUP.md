# Android Setup Guide

## 🚀 Quick Start (One Command)

```bash
bash scripts/android/setup.sh
```

This will:
- Install dependencies
- Build the app
- Add Android platform
- Sync everything
- Be ready to run!

---

## 📱 Running on Physical Android Phone

### Step 1: Enable USB Debugging on Your Phone

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times (you'll see "You are now a developer!")
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect phone to computer via USB cable
6. Approve the "Allow USB debugging" popup on your phone

### Step 2: Run the App

**Option A: Terminal (Fastest)**
```bash
npx cap run android
```

**Option B: Android Studio (More Control)**
```bash
npx cap open android
```
Then click the green "Run" button in Android Studio.

---

## 🔄 Workflow for Making Changes

Every time you make code changes and want to test on your Android phone:

### Quick Sync (Most Common)
```bash
bash scripts/android/sync.sh
```
This rebuilds and syncs your changes.

### Full Run (Rebuild + Sync + Launch)
```bash
bash scripts/android/run.sh
```
This does everything including launching the app.

---

## 🆚 iOS vs Android - Same Workflow!

The workflow is **identical** for both platforms, just swap the platform name:

| Task | iOS | Android |
|------|-----|---------|
| Setup | `bash scripts/ios/setup.sh` | `bash scripts/android/setup.sh` |
| Sync changes | `bash scripts/ios/run.sh` | `bash scripts/android/sync.sh` |
| Open IDE | `npx cap open ios` | `npx cap open android` |
| Run directly | `npx cap run ios` | `npx cap run android` |

**You DON'T need to rebuild iOS when working on Android (and vice versa).** The platforms are independent!

---

## ❓ When Do I Need to Rebuild?

### ✅ YES - Rebuild Required:
- Changed React code (components, pages, hooks)
- Changed TypeScript/JavaScript logic
- Changed CSS/styling
- Changed translations
- Want to test on physical device
- Want to test on emulator/simulator

### ❌ NO - Rebuild NOT Required:
- Testing in browser (`npm run dev`)
- Only reading code
- Only changed backend (edge functions, database)

---

## 🩺 Troubleshooting

Run the doctor script if something isn't working:

```bash
bash scripts/android/doctor.sh
```

This checks:
- Node.js and npm installation
- Android platform setup
- Android Studio installation
- Connected devices
- Build artifacts

### Common Issues:

**Device not detected:**
```bash
adb devices
```
If empty, check USB debugging is enabled and cable is connected.

**Gradle errors:**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

**Stale cache:**
```bash
rm -rf android
npx cap add android
npm run build
npx cap sync android
```

---

## 📝 Summary Cheat Sheet

```bash
# First time setup
bash scripts/android/setup.sh

# After making changes (quick)
bash scripts/android/sync.sh
npx cap run android

# After making changes (automatic)
bash scripts/android/run.sh

# Open Android Studio
bash scripts/android/open.sh

# Troubleshoot
bash scripts/android/doctor.sh

# Check connected devices
adb devices
```

---

## 🎯 Next Steps

1. Run `bash scripts/android/setup.sh` (one time)
2. Connect your Android phone via USB
3. Enable USB debugging on phone
4. Run `npx cap run android`
5. See your app on your phone! 🎉

For future changes: just run `bash scripts/android/sync.sh` and then `npx cap run android`.
