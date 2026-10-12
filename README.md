# SnapMacros 📷🥗

A cross-platform (iOS + Android) calorie & protein tracker. Snap a photo of your
meal, confirm what it is from a searchable food database, and watch your daily
totals fill toward your goals. Get meal suggestions built from **your** preferred
foods that fit the calories and protein you have left for the day.

Built with **Expo** (React Native), so the same code runs on both iOS and Android.

---

## Features

- **Photo + quick confirm logging** — take or attach a meal photo, then pick the
  food from a searchable, favorites-first database and set the number of servings.
- **Daily goals** — set a calorie and protein target; progress bars show how much
  you've eaten and how much is left (turns red if you go over).
- **Smart suggestions** — the *Ideas* tab recommends meals from your preferred
  foods that best fill your **remaining** calorie/protein budget, ranked by protein
  density.
- **Preferred foods** — favorite the foods you actually eat; suggestions and the
  logging search prioritize them.
- **Local & private** — everything is stored on-device (AsyncStorage). No account,
  no server.

---

## What's tracked

Every meal records **calories, protein, carbs, fat, fiber, and sugar**. The Today
screen shows a progress bar per metric (bars turn red when you exceed a goal — handy
for sugar, which is a cap rather than a target).

## Smart targets

In **Settings → Your body & goal**, enter your weight and pick a goal (lose weight,
maintain, gain muscle, build strength), then tap **Calculate my targets**. The app
fills your daily goals for every metric (all still editable by hand).

Macro targets are derived from your calorie goal: protein from bodyweight (see below),
fat ≈ 27% of calories, carbs fill the remaining calories, fiber ≈ 14 g per 1000 kcal,
and sugar capped at ~10% of calories.

How it's calculated (`src/goals.js`):

- **Calories** — Mifflin-St Jeor BMR (`10·kg + 6.25·cm − 5·age + sex`) × an activity
  factor (1.2–1.9) gives maintenance, then adjusted by goal: lose −20%, maintain 0,
  gain muscle +12%, build strength +8%. A 1,200 kcal floor prevents unsafe deficits.
  Height and age are optional — without them it uses a weight-only BMR estimate and
  tells you the number is rougher.
- **Protein** — grams per kg of bodyweight, by goal: lose 2.0, maintain 1.6, gain
  muscle 1.9, build strength 1.8 (higher when cutting to preserve muscle).

Weight can be entered in kg or lb. These are population estimates, not medical
advice — adjust to how your body actually responds.

---

## AI photo analysis (free — optional)

The app works fully without this (you pick foods manually). To make the photo
auto-fill calories & protein, add a **free Google Gemini API key**:

1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key** (no credit card required).
3. Copy the key (starts with `AIza…`).
4. In the app: **Settings → AI photo analysis**, paste the key, tap **Save key**.
5. Now when you log a meal, tap **✨ Analyze with AI** and it fills in the estimate.

The same key also powers **AI meal ideas** on the *Ideas* tab: tap **✨ Generate
meal ideas from my foods** and Gemini composes a few full meals built around your
favorited foods that fit the calories & protein you have left for the day — each one
loggable in a tap. The instant local suggestions remain as a no-key fallback.

Uses the `gemini-flash-lite-latest` model alias — the fastest free-tier model with
the highest rate limit (~30 requests/minute, ~1,500/day), so it's the least likely
to time out or hit limits. The `-latest` alias survives Google's version changes.
Estimates are approximate (the model can't see
hidden oil or exact portions), so tweak servings if needed. The key is stored only
on your device.

---

## Run it on your phone (fastest — ~5 min)

1. Install **Node.js** (LTS) on your computer if you don't have it: https://nodejs.org
2. Install the **Expo Go** app on your phone (App Store / Google Play).
3. In a terminal, from inside this `SnapMacros` folder:
   ```bash
   npm install
   npx expo start
   ```
4. A QR code appears. **iPhone:** scan it with the Camera app. **Android:** scan it
   from inside Expo Go. The app opens on your phone.

> Camera and photo-library permissions are requested the first time you log a meal.

## Run in a simulator (optional)

- iOS (Mac + Xcode): press `i` in the Expo terminal.
- Android (Android Studio emulator): press `a`.

---

## Turning it into a real App Store / Play Store app

When you're happy with it, build native binaries with EAS (Expo Application Services):

```bash
npm install -g eas-cli
eas login
eas build --platform ios      # or android
```

Then submit with `eas submit`. See https://docs.expo.dev/build/introduction/.
(App Store distribution requires an Apple Developer account; Play requires a Google
Play Developer account.)

---

## Architecture

The **backend logic is TypeScript, written in an object-oriented style** — classes,
enums, and static config, with no free-floating constants or helper functions. The
**UI stays as React Native functional components** (`.js`) that call into those classes.

```
SnapMacros/
├── App.js                     # Tab navigation + state; calls StorageService
├── index.js                   # Entry point
├── tsconfig.json              # TypeScript config (allowJs — JS UI coexists)
├── app.json / package.json / babel.config.js
└── src/
    ├── theme.js               # Colors & spacing (UI)
    ├── core/                  # ── OOP TypeScript backend ──
    │   ├── types.ts           # Enums (MacroKey, GoalType, ActivityLevel, Sex) + interfaces
    │   ├── Nutrition.ts       # MacroCatalog (static config) + NutritionMath (sum/scale)
    │   ├── FoodDatabase.ts    # Food class + FoodDatabase singleton (search/getById)
    │   ├── GoalCalculator.ts  # Mifflin-St Jeor + macro targets; static option lists
    │   ├── StorageService.ts  # AsyncStorage wrapper singleton
    │   ├── SuggestionEngine.ts# Local food ranking singleton
    │   └── GeminiService.ts   # AI photo analysis + meal composer
    ├── components/
    │   └── ProgressBar.js
    └── screens/
        ├── TodayScreen.js     # Totals vs goals + logged meals
        ├── AddMealScreen.js   # Photo capture + quick-confirm picker + AI
        ├── SuggestScreen.js   # Local + AI meal ideas
        └── SettingsScreen.js  # Body/goal calculator, goals, key, preferred foods
```

Classes are accessed as singletons (`FoodDatabase.instance`, `StorageService.instance`,
`SuggestionEngine.instance`) or constructed where per-call state is needed
(`new GeminiService(apiKey)`).

### TypeScript setup

`tsconfig.json` and the `typescript` / `@types/react` dev-dependencies are included.
Metro/Babel compiles the `.ts` files automatically, so the app runs as-is. To pin the
exact versions for your SDK, run once:

```bash
npx expo install typescript @types/react
```

## Extending it

- **Add foods:** add a `new Food(...)` line in `FoodDatabase.seed()` (`src/core/FoodDatabase.ts`).
- **Add a tracked metric** (e.g. sodium): add it to `MacroKey` + `MacroCatalog` and the
  `Goals` interface — the Today screen and totals pick it up automatically.
- **AI photo recognition** is built in — tap **Analyze with AI** on the log screen.
- **Barcode scanning and weekly history** are natural next steps.
