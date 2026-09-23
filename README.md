# Hangul Hour

Learn practical beginner Korean vocabulary on an hourly local schedule.

Hangul Hour shows one useful word or short phrase every hour from **9:00 AM to 5:00 PM** in your local time. Each card includes Hangul, Revised Romanization, English meaning, topic, and an example when helpful. Due words repeat on a lightweight spaced-review schedule so you see them again before they fade.

## Features

- Hourly study queue for the current local day
- Curated beginner-core list: greetings, people, time, food, places, transport, verbs, adjectives, numbers, and survival phrases
- Randomized new-word selection with spaced repeats (`Again` / `Hard` / `Good` / `Easy`)
- Searchable vocabulary library
- Optional browser notifications (best while the app is open or installed)
- Local-only progress — no account required

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Production:

```bash
npm run build
npm start
```

Tests:

```bash
npm test
```

## Deploy to Vercel

This is a standard Next.js app and deploys cleanly on Vercel.

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B — Import the Git repo

1. Push this project to GitHub/GitLab/Bitbucket (or use **Create repo** in Cursor if you have not yet).
2. Open [vercel.com/new](https://vercel.com/new) and import the repository.
3. Leave the defaults (Framework: Next.js, Build: `next build`, Output: automatic).
4. Deploy.

No environment variables are required. Progress stays in each learner’s browser `localStorage`.

## How the schedule works

1. At the start of each local day, Hangul Hour builds a queue for every hour from your start hour through your end hour (default 9–17).
2. Due reviews are filled first. Remaining slots draw randomized unseen words, then familiar words, while avoiding immediate consecutive repeats when possible.
3. Rating a card updates its next review date and keeps history in `localStorage` on this device.
4. Outside the study window, the dashboard shows the countdown to the next slot.

## Notifications and PWA

- Enable notifications in **Settings**. The app registers a service worker and can show hourly reminders while it remains open or installed.
- Browsers and operating systems may pause background alerts when the tab is closed. The in-app dashboard is always the source of truth.
- Installable via the browser “Add to Home Screen” / install prompt using `public/manifest.webmanifest`.

## Project layout

- `src/data/korean-beginner-vocabulary.ts` — curated vocabulary seed
- `src/lib/review.ts` — spaced-review ratings
- `src/lib/schedule.ts` — hourly queue construction
- `src/lib/persistence.ts` — localStorage state
- `src/lib/notifications.ts` — permission + notification helpers
- `src/app` — Today, Library, and Settings pages
