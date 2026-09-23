# Hangul Hour

Learn practical beginner Korean vocabulary on an hourly local schedule.

Hangul Hour shows one useful word or short phrase every hour from **9:00 AM to 5:00 PM** in your local time. Each card includes Hangul, Revised Romanization, English meaning, topic, and an example when helpful. Due words repeat on a lightweight spaced-review schedule so you see them again before they fade.

## Features

- Hourly study queue for the current local day
- Curated beginner-core list: greetings, people, time, food, places, transport, verbs, adjectives, numbers, and survival phrases
- Randomized new-word selection with spaced repeats (`Again` / `Hard` / `Good` / `Easy`)
- Searchable vocabulary library
- Optional browser notifications, including background Web Push when configured
- Local progress in `localStorage` — no account required

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Feedback email (Resend)

Settings includes a Feedback form (max **2 messages per local calendar day** per app instance). The client stores an instance id + daily counter in `localStorage`; the API re-enforces the same cap by instance id and IP hash.

- **With Resend configured** (`RESEND_API_KEY`): messages send in-app to `NEXT_PUBLIC_FEEDBACK_EMAIL` / `FEEDBACK_TO_EMAIL` (default `tarantadonatarantula@gmail.com`).
- **Without Resend**: the form falls back to opening the learner’s mail app (`mailto:`), and `/api/feedback` returns `503` with a clear setup message.

#### Brian: one-time Resend dashboard setup

1. Create a [Resend](https://resend.com) account and an **API key** (Dashboard → API Keys).
2. Add the secret locally / on the host (never commit it):
   - `RESEND_API_KEY=re_...`
   - Optional: `FEEDBACK_FROM_EMAIL=Hangul Hour <feedback@yourdomain.com>`
   - Optional: `NEXT_PUBLIC_FEEDBACK_EMAIL` / `FEEDBACK_TO_EMAIL` if the inbox should differ from the default.
3. **From address**
   - Quick test: leave `FEEDBACK_FROM_EMAIL` as `Hangul Hour <onboarding@resend.dev>` — Resend only delivers to the email on your Resend account.
   - Production: Domains → add & verify your domain (DNS), then set `FEEDBACK_FROM_EMAIL` to an address on that domain (e.g. `Hangul Hour <feedback@yourdomain.com>`).
4. Restart the Next.js server after setting env vars.

See `.env.example` for the full template.

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

1. Push this project to GitHub/GitLab/Bitbucket.
2. Open [vercel.com/new](https://vercel.com/new) and import the repository.
3. Leave the defaults (Framework: Next.js, Build: `next build`, Output: automatic).
4. Deploy.

Learner progress stays in browser `localStorage`. For in-app Feedback email on Vercel, add `RESEND_API_KEY` and `FEEDBACK_FROM_EMAIL` (plus optional destination overrides) in the project Environment Variables. Background push needs the env vars below.

## Background Web Push (free hobby setup)

Foreground timers pause when iOS backgrounds the Home Screen app. Background alerts use **Web Push**:

1. **VAPID keys** — `npx web-push generate-vapid-keys --json`
2. **Upstash Redis** (free) — create a database and copy REST URL + token
3. **Vercel env vars** (see `.env.example`):
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_SUBJECT` (e.g. `mailto:you@example.com`)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET` (long random string)
4. **Hourly cron** — Vercel Hobby cron is once/day, so use the included GitHub Action:
   - Repo secrets: `HANGUL_HOUR_CRON_URL` = `https://<your-app>.vercel.app/api/push/cron`
   - Repo secret: `CRON_SECRET` = same as Vercel
   - Workflow: `.github/workflows/hourly-push.yml` (runs at minute 0 each hour)

When a learner enables notifications, the app stores their push subscription, timezone, and study hours in Redis. The cron sends a **generic** reminder: “Your Hangul Hour word is ready.” Opening the app still shows the real word for that hour.

**iPhone:** iOS 16.4+, Add to Home Screen, open from the icon, then enable notifications from a tap.

Without these env vars, Hangul Hour keeps working; reminders only fire while the app is open.

## How the schedule works

1. At the start of each local day, Hangul Hour builds a queue for every hour from your start hour through your end hour (default 9–17).
2. Due reviews are filled first. Remaining slots draw randomized unseen words, then familiar words, while avoiding immediate consecutive repeats when possible.
3. Rating a card updates its next review date and keeps history in `localStorage` on this device.
4. Outside the study window, the dashboard shows the countdown to the next slot.

## Notifications and PWA

- Enable notifications in **Settings**.
- With Web Push configured, hourly generic reminders can arrive in the background.
- Without it, notifications work best while the app stays open or installed in the foreground.
- Installable via “Add to Home Screen” using `public/manifest.webmanifest`.

## Project layout

- `src/data/korean-beginner-vocabulary.ts` — curated vocabulary seed
- `src/lib/review.ts` — spaced-review ratings
- `src/lib/schedule.ts` — hourly queue construction
- `src/lib/persistence.ts` — localStorage state
- `src/lib/notifications.ts` — permission + Web Push client helpers
- `src/lib/push/` — VAPID/config, Redis store, timezone matching, send
- `src/app/api/push/` — config, subscribe, unsubscribe, cron
- `src/app` — Today, Library, and Settings pages
