# 🔐 Android Keystore Backup Guide — CRITICAL

> **⚠️ READ THIS FIRST:** If you lose your keystore file, you can **NEVER** update your app on Google Play again. You would have to publish a brand new app with a new package name and ask all users to reinstall. **There is no recovery. Google cannot help you.**

---

## 1. What is the keystore?

The keystore (`.jks` or `.keystore` file) is the **cryptographic signature** that proves to Google Play that an update comes from *you*. Every future version of "Jie Jie 姐姐 HR Hub" MUST be signed with the **same** keystore as the first upload.

You need to protect **3 things**:

| Item | What it is | Example |
|---|---|---|
| 🗝️ **Keystore file** | The `.jks` file itself | `jiejie-release.jks` |
| 🔑 **Keystore password** | Password for the file | `MyStr0ng!Pass` |
| 🔑 **Key alias + password** | The key inside the file | alias: `jiejie`, password: `MyStr0ng!Pass2` |

**Lose any one of these → cannot update the app.**

---

## 2. Where is your keystore now?

On the Mac you used for the Google Play build, it's typically in **one** of these places:
- `~/Documents/keystores/`
- `~/.android/`
- Wherever Android Studio asked you to save it during "Generate Signed Bundle / APK"

Find it:
```bash
find ~ -name "*.jks" -o -name "*.keystore" 2>/dev/null
```

---

## 3. The 3-2-1 Backup Rule (DO THIS TODAY)

Keep **3 copies**, on **2 different media types**, with **1 copy off-site**.

### ✅ Recommended setup for Jie Jie HR Hub

| # | Location | Method |
|---|---|---|
| 1 | **Original Mac** (where you built it) | Keep in `~/Documents/keystores/` |
| 2 | **Encrypted USB drive** | Copy file + write passwords on paper inside the drive case |
| 3 | **Password manager (1Password / Bitwarden / Apple Keychain)** | Attach the `.jks` file + store both passwords |
| 4 *(bonus)* | **Encrypted cloud** (iCloud Drive / Google Drive / Dropbox) | Inside an encrypted `.zip` or `.dmg` |

### 🚫 Never do this
- ❌ Email the keystore to yourself in plain text
- ❌ Commit the keystore to GitHub (even private repos)
- ❌ Store passwords in the same plain text file as the keystore
- ❌ Keep only one copy on one Mac

---

## 4. Step-by-step backup (do this now)

### Step A — Create an encrypted ZIP
On your Mac (the one with the keystore):
```bash
cd ~/Documents/keystores
zip -e jiejie-keystore-backup.zip jiejie-release.jks
# It will prompt for a password — USE A DIFFERENT password than the keystore itself
```

### Step B — Save credentials to your password manager
Create a new secure note titled **"Jie Jie HR Hub — Android Keystore"** with:
```
Keystore file: jiejie-release.jks
Keystore password:  ____________________
Key alias:          jiejie
Key password:       ____________________
ZIP password:       ____________________
SHA-1 fingerprint:  ____________________
Created date:       2026-__-__
```

Get the SHA-1 fingerprint:
```bash
keytool -list -v -keystore jiejie-release.jks -alias jiejie
```

### Step C — Upload encrypted ZIP to cloud
- iCloud Drive → `Jie Jie HR Hub / Backups /`
- Or Google Drive / Dropbox

### Step D — Copy to USB drive
Plug in a USB stick, copy the unencrypted `.jks` + a printed paper note with the passwords. Store the USB in a safe place (drawer, safe, with important documents).

---

## 5. Test your backup (the most-skipped step!)

A backup you haven't tested is not a backup.

```bash
# Try to read the keystore from your backup
keytool -list -keystore /path/to/backup/jiejie-release.jks
# Enter the keystore password — if it lists your alias, it works ✅
```

Do this **every 6 months**.

---

## 6. Google Play App Signing (extra safety net)

When you uploaded to Play Console, Google likely asked you to **enroll in Play App Signing**. This is a huge safety net:

- ✅ Google holds the **app signing key** (the real one users see)
- ✅ You only hold the **upload key** (used to upload to Play Console)
- ✅ If you lose your upload key, you can **request a reset** from Google (takes 1–2 days)

**Check if you're enrolled:**
1. Play Console → Your app → **Setup → App integrity → App signing**
2. If you see "App signing by Google Play is enabled" → ✅ you have the safety net
3. If not → still back up the keystore like your business depends on it (because it does)

> Even with Play App Signing, **back up your upload keystore**. The reset process takes days and blocks all updates during that time.

---

## 7. When you switch Macs (your situation)

You mentioned you have the original dev Mac + this Mac mini. For Android updates:

**Option 1 (safest):** Always build Android releases on the **original Mac**.

**Option 2:** Copy the keystore to the Mac mini securely:
```bash
# On original Mac — create encrypted archive
cd ~/Documents/keystores
zip -e jiejie-keystore-transfer.zip jiejie-release.jks

# Transfer via AirDrop, USB, or encrypted cloud
# DO NOT email it

# On Mac mini — unzip into safe location
mkdir -p ~/Documents/keystores
cd ~/Documents/keystores
unzip jiejie-keystore-transfer.zip
# Delete the .zip after
rm jiejie-keystore-transfer.zip
```

Then update Android Studio's signing config to point to the new path.

---

## 8. Emergency checklist 🚨

If your Mac dies tomorrow, can you answer YES to all of these?

- [ ] I have the `.jks` file in at least 2 other places
- [ ] I know the keystore password (written down somewhere safe)
- [ ] I know the key alias name
- [ ] I know the key password
- [ ] I have tested restoring from at least one backup
- [ ] I know whether Play App Signing is enabled
- [ ] At least one backup is **off-site** (cloud or different physical location)

If any answer is NO → fix it today, not tomorrow.

---

## 9. Quick reference card (print this)

```
╔══════════════════════════════════════════════════╗
║   JIE JIE 姐姐 HR HUB — ANDROID KEYSTORE        ║
╠══════════════════════════════════════════════════╣
║ File:        jiejie-release.jks                  ║
║ Locations:   1. Original Mac ~/Documents/        ║
║              2. USB drive (safe)                 ║
║              3. 1Password vault                  ║
║              4. iCloud Drive (encrypted .zip)    ║
║ Passwords:   Stored in 1Password                 ║
║ Play Signing: ☐ Enabled  ☐ Not enabled          ║
║ Last tested: ____ / ____ / ______                ║
╚══════════════════════════════════════════════════╝
```

---

**Remember:** Apple-style "I'll do it later" = app death. Do steps 4A–4D **today**, before iOS work begins. 🔐
