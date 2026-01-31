# Google Play Store Publishing Guide

## 📱 Jie Jie 姐姐 心連站 - Android App

This guide walks you through publishing your Android app to the Google Play Store.

---

## 🎯 Pre-requisites Checklist

Before you start, make sure you have:

- [ ] **Google Play Developer Account** ($25 one-time fee)
  - Sign up at: https://play.google.com/console
- [ ] **Android Studio** installed
- [ ] **Physical Android device** for testing (recommended)
- [ ] **App screenshots** (see dimensions below)
- [ ] **Privacy Policy URL** (required by Google)
- [ ] **App description** in all supported languages

---

## 🔐 Step 1: Create Signing Key (CRITICAL!)

Your app needs a signing key. **SAVE THIS SECURELY - you need it for ALL future updates!**

### In Android Studio:
1. Open Android Studio: `npx cap open android`
2. Go to **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle**
4. Click **Create new...**
5. Fill in the keystore details:
   - **Keystore path**: Choose a secure location (NOT in project folder)
   - **Password**: Strong password (save it!)
   - **Alias**: `jiejie-release`
   - **Key password**: Can be same as keystore password
   - **Validity**: 25+ years
   - **Certificate info**: Your organization details

### ⚠️ SAVE THESE SECURELY:
- Keystore file (.jks)
- Keystore password
- Key alias
- Key password

**If you lose these, you cannot update your app!**

---

## 📦 Step 2: Build Release Bundle

### Quick Method (Terminal):
```bash
# From project root
bash scripts/android/release.sh
```

### Manual Method:
```bash
# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

### In Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle** (AAB)
3. Choose your keystore
4. Select **release** build variant
5. Wait for build to complete
6. Find your AAB in: `android/app/release/app-release.aab`

---

## 📸 Step 3: Prepare Store Assets

### Required Screenshots:
| Type | Dimensions | Quantity |
|------|------------|----------|
| Phone | 1080 x 1920 px (or 16:9) | 2-8 |
| 7" Tablet | 1200 x 1920 px | 1-8 (optional) |
| 10" Tablet | 1800 x 2560 px | 1-8 (optional) |

### Required Graphics:
| Asset | Dimensions | Format |
|-------|------------|--------|
| App Icon | 512 x 512 px | PNG (32-bit) |
| Feature Graphic | 1024 x 500 px | PNG or JPEG |

### Tips for Screenshots:
- Show key features (Dashboard, Leave Calendar, Chat)
- Use real-looking data (not lorem ipsum)
- Add captions/highlights using tools like Figma or Canva
- Show both English and Chinese versions if targeting multiple markets

---

## 📝 Step 4: Prepare Store Listing

### App Details:
```
App Name: Jie Jie 姐姐 心連站
Short Description (80 chars max):
"Household helper management made simple. Leave, payroll & documents."

Full Description (4000 chars max):
Jie Jie 姐姐 心連站 helps families manage their household helpers with ease.

✨ Features:
• Leave Management - Request and approve leave easily
• Payroll Tracking - Monthly salary, allowances, deductions
• Document Storage - Store contracts, IDs, receipts securely
• Real-time Chat - Communicate with your employer/helper
• Multi-language - English, 繁體中文, 简体中文, Bahasa Indonesia

Perfect for:
• Families employing domestic helpers
• Individual employers managing household staff
• Helpers tracking their leave and payroll

🔒 Secure & Private
Your data is encrypted and stored securely. Only you and your employer/helper can access it.
```

### Category:
**Business** or **Productivity**

### Content Rating:
Complete the questionnaire (typically results in "Everyone" rating)

### Privacy Policy:
You MUST have a privacy policy URL. Options:
1. Create a simple page on your website
2. Use a generator like termly.io or privacypolicies.com
3. Host on GitHub Pages

---

## 🚀 Step 5: Upload to Play Console

1. Go to https://play.google.com/console
2. **Create app** → Fill in details
3. Go to **Release → Production**
4. **Create new release**
5. Upload your `.aab` file
6. Add release notes
7. **Review and roll out**

### Required Sections to Complete:
- [ ] App access (if login required, provide test credentials)
- [ ] Ads declaration
- [ ] Content rating
- [ ] Target audience
- [ ] News apps (select No)
- [ ] COVID-19 apps (select No)
- [ ] Data safety (describe what data you collect)
- [ ] Government apps (select No)
- [ ] Financial features (if applicable)

---

## 🔄 Step 6: Future Updates

Whenever you make changes in Lovable:

```bash
# 1. Pull latest code
git pull

# 2. Install any new dependencies
npm install

# 3. Build and sync
npm run build
npx cap sync android

# 4. Build new release in Android Studio
# 5. Upload new AAB to Play Console
```

### Version Numbering:
Update `android/app/build.gradle`:
```gradle
versionCode 2  // Increment for each release
versionName "1.0.1"  // User-visible version
```

---

## 🛠 Troubleshooting

### Build fails with signing error:
- Check keystore path and passwords
- Ensure key alias matches

### App crashes on launch:
- Test with `npx cap run android` first
- Check Android Studio Logcat for errors

### "App not compatible" on Play Store:
- Check `minSdkVersion` in `android/app/build.gradle`
- Recommended: `minSdkVersion 22` (Android 5.1+)

### Play Store rejects app:
- Read rejection reason carefully
- Common issues: missing privacy policy, permissions not justified

---

## 📞 Need Help?

- Capacitor Docs: https://capacitorjs.com/docs
- Play Console Help: https://support.google.com/googleplay/android-developer
- Lovable Docs: https://docs.lovable.dev

---

## 📋 Final Checklist

Before submitting:

- [ ] Tested on physical device
- [ ] All features work offline (after first login)
- [ ] Privacy policy published
- [ ] Store listing complete in all languages
- [ ] Screenshots ready
- [ ] Keystore backed up securely
- [ ] Version code incremented (for updates)
