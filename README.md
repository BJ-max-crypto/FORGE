# FORGE

FORGE is a personal execution app. Plan the day, check tasks in, review how it went, and run small experiments on your own routines.

The interface follows the FORGE iOS design: a white surface, near-black type, a floating icon navigation bar, and green only for completed work. The Figma file could not be read during this build because the Figma MCP rate limit was already exhausted, so spacing and hierarchy follow that file's written design direction rather than a live render.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). A new profile starts in onboarding. After that, tasks, reviews, experiments, and goals stay in this browser under the key `forge.demo.v1`.

Demo mode is explicit. The app does not invent history, and it does not pretend a reminder was delivered when it was only saved.

```bash
npm test
npm run typecheck
npm run build
```

## Screens

- Today, with a chronological schedule and completion bar
- Task create, edit, focus timer, and check-in
- Progress for the current week and month
- Daily and weekly reviews
- Experiments, including presets, a custom test, daily ratings, and results
- Profile, goals, appearance, privacy, export, and help
- Notification settings

## Data

Without environment variables, FORGE uses a demo adapter backed by `localStorage`. That data is not encrypted and is not synced. Anyone who can open this browser profile can read it.

To use Supabase instead, apply `supabase/migrations/0001_init.sql`, set the variables in `.env.example`, and sign in with Supabase Auth. Row-level security limits each table to `auth.uid()`. If Supabase is configured and nobody is signed in, FORGE stops and explains that. It will not fall back to demo data.

The anon key is safe to expose. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used by the push routes. Clerk is not installed; add it when you have a project, and keep `CLERK_SECRET_KEY` on the server.

## Notifications

While the app is open, due reminders appear in the page. In demo mode, a system notification is also attempted when the tab is hidden and permission was granted. Reminders inside quiet hours are skipped. The same reminder key is not sent twice.

A website cannot promise background delivery after the tab is closed. Background Web Push needs:

1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
2. `SUPABASE_SERVICE_ROLE_KEY` and a signed-in user
3. `CRON_SECRET`
4. A scheduler that calls `GET /api/push/dispatch` with `Authorization: Bearer $CRON_SECRET` about every five minutes

`/api/push/subscribe` only stores a subscription. `/api/push/dispatch` is the only route that asks the push service to deliver, and it reports how many sends succeeded. Both routes return an error instead of a fake success when credentials are missing.

## Deployment

The app is a Next.js App Router project and can be deployed on Vercel. Set the environment variables in the project before turning on the dispatch cron.
