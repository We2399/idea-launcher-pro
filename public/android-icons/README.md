# Android Icon Assets

This folder contains the app icons for Android.

## Required Sizes for Android

After exporting your project to GitHub and running locally, you need to generate these icon sizes and place them in the correct Android folders:

| Folder | Size | DPI |
|--------|------|-----|
| `android/app/src/main/res/mipmap-mdpi/` | 48x48 | 160 dpi |
| `android/app/src/main/res/mipmap-hdpi/` | 72x72 | 240 dpi |
| `android/app/src/main/res/mipmap-xhdpi/` | 96x96 | 320 dpi |
| `android/app/src/main/res/mipmap-xxhdpi/` | 144x144 | 480 dpi |
| `android/app/src/main/res/mipmap-xxxhdpi/` | 192x192 | 640 dpi |

## Quick Setup

### Option 1: Use Android Studio Asset Studio (Recommended)
1. Open Android Studio: `npx cap open android`
2. Right-click on `app/src/main/res` → **New → Image Asset**
3. Select **Launcher Icons (Adaptive and Legacy)**
4. Choose the `icon-512.png` from this folder
5. Customize foreground/background as needed
6. Click **Next → Finish**

### Option 2: Online Generator
Use https://icon.kitchen or https://romannurik.github.io/AndroidAssetStudio/
1. Upload `icon-512.png`
2. Download the generated assets
3. Copy to `android/app/src/main/res/`

## Adaptive Icons (Android 8.0+)

Modern Android uses adaptive icons with separate foreground and background layers. The Asset Studio in Android Studio handles this automatically.

## Files in this folder:
- `icon-512.png` - High-res source icon for generating all sizes
