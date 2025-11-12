# Quick Start Guide

## Run the App in Your Browser

```bash
npm install
npm run dev
```

Open http://localhost:8080

## Run on iOS (Mac only)

**One-line setup:**
```bash
bash scripts/ios/setup.sh
```

**Or step-by-step:**
```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then in Xcode: Select "App" scheme → Choose simulator → Press Cmd+R

## After Making Changes

```bash
npm run build
npx cap sync ios
```

## Need Help?

- **iOS Setup Issues**: See `iOS_SETUP.md`
- **General Issues**: See `README.md`
- **Stuck?**: Run `bash scripts/ios/doctor.sh`
