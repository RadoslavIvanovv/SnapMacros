# Getting SnapMacros onto your phone with EAS

EAS Build compiles this project in the cloud and gives you an installable app +
a QR/link to put it on your phone. You don't need Xcode or Android Studio.

Everything below is run from inside the project folder:

```bash
cd ~/Documents/SnapMacros
```

---

## One-time setup

1. Make a free **Expo account** at https://expo.dev/signup
2. Install the CLI and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. Link this project to your Expo account (creates a projectId in app.json):
   ```bash
   eas init
   ```
   Say **yes** when it offers to create the project.

---

## Option A — Android (free, no store, ~10 min) ✅ easiest

Builds a downloadable `.apk` you install directly.

```bash
eas build --profile preview --platform android
```

When it finishes, EAS prints a URL and QR code.

- On the Android phone, open the link → **Download** → tap the file to install.
- The first time, Android asks you to allow "install from unknown sources" — allow it for your browser, then the install proceeds.

That's it — SnapMacros is a normal app icon on your phone. No Google account, no fee.

---

## Option B — iPhone

Apple doesn't allow free sideloading, so this needs a paid **Apple Developer
account (~$99/year)**: https://developer.apple.com/programs/

Once you have it:

```bash
eas build --profile preview --platform ios
```

- EAS will ask to log in with your Apple ID and will **register your iPhone**
  (it walks you through it — you may need your device's UDID, which EAS helps you get).
- When the build is done, open the install link **on the iPhone** and tap Install.

### Nicer alternative for iPhone: TestFlight

If you'd rather use Apple's official beta tool (also needs the $99 account):

```bash
eas build --profile production --platform ios
eas submit --platform ios
```

Then invite yourself in App Store Connect → TestFlight and install via the
TestFlight app. Good if you want to share with a few friends too.

---

## Publishing to the stores (later)

Same tool, production profile:

```bash
eas build --profile production --platform android   # or ios
eas submit --platform android                       # or ios
```

- Google Play: one-time $25 developer fee.
- Apple App Store: the same $99/year account.
- Both apps go through a review before they're public.

Docs: https://docs.expo.dev/build/introduction/

---

## Quick reference

| Goal | Command | Cost |
|------|---------|------|
| Try instantly (in Expo Go) | `npx expo start` | free |
| Standalone app on Android | `eas build --profile preview --platform android` | free |
| Standalone app on iPhone | `eas build --profile preview --platform ios` | $99/yr Apple |
| Public on Play Store | `eas build --profile production -p android` + `eas submit` | $25 once |
| Public on App Store | `eas build --profile production -p ios` + `eas submit` | $99/yr |
