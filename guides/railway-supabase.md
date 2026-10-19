# Hosting on Railway with Supabase

Use this setup if you'd rather not run the board as a Claude artifact. It's the same `board/supper-board.html`; a small adapter ([`server/public/claude-supabase.js`](../server/public/claude-supabase.js)) points its database calls at Supabase, and [`server/index.js`](../server/index.js) serves it.

- **Data:** one Supabase table, `docs`, with one row per document (`meals/m01`, `plan/current`, …). The fields are the same ones listed in [data-model.md](data-model.md).
- **Who can get in:** people sign in with an email link or code. Only emails in `allowed_emails` can read or write anything. Row-level security in the database enforces this, so knowing the URL isn't enough.
- **Live updates:** Supabase Realtime, so a change on one phone shows up on the tablet.

## 1. Supabase

The schema is in [`supabase/migrations/`](../supabase/migrations/). Run it once in a new project's SQL editor, or ask Claude to apply it.

Add the people who may use the board:

```sql
insert into public.allowed_emails (email) values
  ('you@example.com'),
  ('partner@example.com');
```

Emails must be lowercase. To remove someone, delete their row.

Then go to **Authentication → URL Configuration**:
- **Site URL:** your Railway URL, e.g. `https://supper-board-production.up.railway.app`
- **Redirect URLs:** add the same URL.

Without this, the sign-in link sends people to `localhost`.

Optional, but useful for phones and a wall tablet: go to **Authentication → Emails → Magic Link** and add `{{ .Token }}` to the template, e.g. `Or enter this code: {{ .Token }}`. On iPhone, a board added to the Home Screen doesn't share its sign-in with Safari, so tapping the link signs in Safari instead of the app. Typing the code signs in the app itself.

## 2. Railway

1. **New Project → Deploy from GitHub repo**, and pick this repo and branch.
2. Under **Variables**, add:
   - `SUPABASE_URL`: e.g. `https://xxxx.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: the `sb_publishable_…` key (or the legacy `anon` key). **Never** use the `service_role` or secret key here; it would be sent to every browser.
3. Under **Settings → Networking**, click **Generate Domain**, and put that URL into Supabase's URL Configuration (step 1).

Railway runs `npm start`, and [`railway.json`](../railway.json) health-checks `/healthz`. If the variables are missing, the page shows a "set these variables" message instead of the board.

## Things to know

- **Sign-in emails are rate-limited** on Supabase's built-in mail service (a few per hour). That's plenty for two people signing in once per device. If you hit the limit, connect your own SMTP under **Authentication → Emails**.
- **Free Supabase projects pause after about a week with no activity.** Daily use keeps the project awake. If it does pause, restore it from the Supabase dashboard.
- **Anyone can request a sign-in email,** but people not on the list only get a "this email isn't on the list" screen and see no data.
- **The automation prompts in [`automation/`](../automation/) still target the Claude artifact database.** To use them with this setup, they need to read and write the `docs` table through Supabase instead (for example with Claude's Supabase connector).
