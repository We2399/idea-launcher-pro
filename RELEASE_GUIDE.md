# Release Build & Store Submission Guide

## Pre-Release Checklist

### 1. Update App Metadata
- [ ] App version number in package.json
- [ ] App name and description in capacitor.config.ts
- [ ] App icons (1024x1024 for iOS, various sizes for Android)
- [ ] Splash screens for both platforms

### 2. Production Configuration
- [ ] Verify Supabase URL and keys are production values
- [ ] Disable debug logs and console.logs in production
- [ ] Test all features in development mode first
- [ ] Verify all translations are complete

---

## iOS Release Build Process

### Step 1: Build Web Assets
```bash
npm run build
```

### Step 2: Sync to iOS
```bash
npx cap sync ios
```

### Step 3: Open Xcode
```bash
npx cap open ios
```

### Step 4: Configure Signing (One-time Setup)
1. In Xcode, select project "App" in navigator
2. Select target "App"
3. Go to "Signing & Capabilities" tab
4. Select your Apple Developer Team (auto-generates certificates)
5. Ensure "Automatically manage signing" is checked

### Step 5: Create Archive
1. In Xcode menu: Product → Scheme → Edit Scheme
2. Set Build Configuration to "Release"
3. Close scheme editor
4. Product → Archive (takes 5-10 minutes)

### Step 6: Test Release Build
1. In Organizer window (appears after archive), select the archive
2. Click "Distribute App" → "Development"
3. Install on test device to verify functionality
4. Test all critical features, translations, performance

### Step 7: Upload to App Store Connect
1. In Organizer, select archive
2. Click "Distribute App" → "App Store Connect"
3. Follow upload wizard (takes 5-15 minutes)
4. Wait for processing in App Store Connect (15-60 minutes)

### Step 8: Complete App Store Connect Listing
1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Complete:
   - App Information (name, subtitle, description)
   - Screenshots (6.5" display, 5.5" display required)
   - Keywords (100 characters max)
   - Support URL and Marketing URL
   - Privacy Policy URL
   - App Review Information (contact details, demo account)
   - Pricing and Availability

### Step 9: Submit for Review
1. Click "Submit for Review"
2. Apple typically reviews within 24-48 hours
3. Monitor status in App Store Connect

---

## Android Release Build Process

### Step 1: Build Web Assets
```bash
npm run build
```

### Step 2: Sync to Android
```bash
npx cap sync android
```

### Step 3: Open Android Studio
```bash
npx cap open android
```

### Step 4: Create Keystore (One-time Setup)
1. Build → Generate Signed Bundle/APK
2. Select "Android App Bundle"
3. Click "Create new..." for keystore
4. Save to: `android/keystores/release.keystore`
5. Fill in:
   - Key store password (save securely!)
   - Key alias: release
   - Key password (save securely!)
   - Validity: 25 years
   - Certificate info (your name, organization)
6. **CRITICAL**: Save keystore file and passwords securely - you'll need them for all future updates

### Step 5: Generate Release Bundle
1. Build → Generate Signed Bundle/APK
2. Select "Android App Bundle" (AAB)
3. Select your keystore
4. Enter passwords
5. Select "release" build variant
6. Check "V2 (Full APK Signature)"
7. Click "Finish" (takes 3-5 minutes)
8. AAB will be in: `android/app/release/app-release.aab`

### Step 6: Test Release Build (Optional - APK)
1. Build → Generate Signed Bundle/APK
2. Select "APK" this time
3. Use same keystore and settings
4. Install APK on test device: `adb install android/app/release/app-release.apk`
5. Test all critical features, translations, performance

### Step 7: Upload to Google Play Console
1. Go to https://play.google.com/console
2. Create app or select existing
3. Complete Store Listing:
   - App name and description
   - Screenshots (phone, tablet, Android TV if applicable)
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Store listing contact details
   - Privacy Policy URL
4. Go to "Production" → "Create new release"
5. Upload `app-release.aab`
6. Fill release notes
7. Review and rollout

### Step 8: Complete Play Console Requirements
1. Content rating questionnaire
2. Target audience and content
3. Privacy Policy
4. App content declarations
5. Pricing and distribution (countries)

### Step 9: Submit for Review
1. Click "Submit for review"
2. Google typically reviews within 1-3 days
3. Monitor status in Play Console

---

## Testing Checklist (Before Submission)

### Critical Features
- [ ] User authentication (login, logout, password reset)
- [ ] All navigation works correctly
- [ ] Forms submit successfully
- [ ] Data loads from Supabase
- [ ] Leave requests create/view/approve flow
- [ ] Calendar displays correctly
- [ ] Profile updates work
- [ ] Cash control transactions
- [ ] Payroll confirmation flow
- [ ] Notifications display and mark as read
- [ ] Document upload and viewing

### Multi-Language Testing
- [ ] English translations complete
- [ ] Traditional Chinese (zh-TW) complete
- [ ] Simplified Chinese (zh-CN) complete
- [ ] Indonesian (id) complete
- [ ] Language switcher works

### Performance
- [ ] App launches in < 3 seconds
- [ ] No console errors in production build
- [ ] Smooth scrolling and animations
- [ ] Images load correctly
- [ ] No memory leaks (test prolonged usage)

### Mobile-Specific
- [ ] Pull-to-refresh works
- [ ] Notifications bell works
- [ ] Safe area padding correct (iOS notch)
- [ ] Back button works (Android)
- [ ] Deep links work (if applicable)
- [ ] Offline behavior acceptable

---

## Post-Launch Monitoring

### Week 1
- Monitor crash reports daily
- Check user reviews and ratings
- Track key metrics (downloads, active users)
- Fix critical bugs immediately

### Week 2-4
- Collect user feedback
- Plan first update based on feedback
- Monitor performance metrics
- Optimize based on real usage patterns

### Ongoing
- Monthly updates with improvements
- Respond to user reviews
- Monitor analytics
- Plan feature roadmap

---

## Emergency Rollback

### iOS
1. Go to App Store Connect
2. Select app → App Store → Remove from sale
3. Upload fixed version with incremented build number
4. Submit for expedited review (explain critical bug)

### Android
1. Go to Play Console
2. Production → Manage → Halt rollout
3. Upload fixed version with incremented version code
4. Create new release and rollout

---

## Version Numbering

Format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes, major redesigns (1.0.0 → 2.0.0)
- MINOR: New features, enhancements (1.0.0 → 1.1.0)
- PATCH: Bug fixes, small improvements (1.0.0 → 1.0.1)

iOS: Set in Xcode → General → Version & Build
Android: Set in `android/app/build.gradle` → versionName and versionCode

Current version: 1.0.0
