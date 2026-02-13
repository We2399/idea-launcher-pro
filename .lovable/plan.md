

## Fix: Mobile App Crash After Login

### Root Cause

After login, React navigates from `/auth` to `/` which mounts many components simultaneously (`MainAppLayout`, `MobileDashboard`, `Header`, `IndustryProvider`, etc.). Each triggers multiple Supabase queries and hook initializations. If **any component throws an error during rendering** (not async errors - those are caught by the global handler), React unmounts the entire component tree. Since there is **no Error Boundary** in the app, there is no fallback UI, and on Android WebView this causes the app process to close.

The global `unhandledrejection` handler only catches async/promise errors. It does NOT catch synchronous render errors in React components.

### What Will Be Done

**1. Add a React Error Boundary component** (`src/components/ErrorBoundary.tsx`)
- Catches any render error in the component tree
- Shows a friendly "Something went wrong" screen with a reload button instead of crashing
- Prevents the Android WebView from closing

**2. Wrap the entire app in the Error Boundary** (`src/App.tsx`)
- Place `ErrorBoundary` around the top-level routes so any crash in any page gets caught
- Also wrap `MainAppLayout` specifically so post-login crashes show the fallback UI

**3. Delay heavy initialization after login** (`src/contexts/AuthContext.tsx`)
- Add a small delay before calling `checkSubscription` (the Stripe edge function) after session is set
- This prevents a burst of concurrent network requests right after login, which can overwhelm the Android WebView

**4. Wrap IndustryProvider queries defensively** (`src/contexts/IndustryContext.tsx`)
- Add safety guards so if the Supabase queries fail during the initial mount, the provider doesn't throw

**5. Guard MobileDashboard initial render** (`src/components/dashboard/MobileDashboard.tsx`)
- Add a loading guard so the component doesn't attempt to render data-dependent UI before hooks have initialized

### Technical Details

```text
Login Flow (current - crashes):
  Auth.tsx -> Navigate to "/" -> MainAppLayout mounts
    -> usePushNotifications (native plugin call)
    -> useUnreadMessagesCount (DB + realtime)
    -> IndustryProvider (2-3 DB queries)
    -> checkSubscription (edge function -> Stripe API)
    -> MobileDashboard (3+ hooks, DB queries)
    -> Header (profile fetch)
    = If ANY render throws -> entire tree unmounts -> app closes

Login Flow (fixed):
  Auth.tsx -> Navigate to "/" -> ErrorBoundary -> MainAppLayout
    -> Same hooks, but wrapped in ErrorBoundary
    -> If ANY render throws -> fallback "retry" screen shown
    -> App stays alive, user can tap to reload
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/ErrorBoundary.tsx` | Create - React Error Boundary component |
| `src/App.tsx` | Modify - Wrap routes with ErrorBoundary |
| `src/contexts/AuthContext.tsx` | Modify - Delay checkSubscription after login |
| `src/contexts/IndustryContext.tsx` | Modify - Add defensive render guards |

After approving, you will need to run:
```
git pull && rm -rf android && npm run build && npx cap add android && npx cap sync android && npx cap run android
```

