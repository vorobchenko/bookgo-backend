# Supabase setup

Bookgo uses **Supabase Postgres** as the database. Schema changes live in `supabase/migrations/` and are applied by the **Supabase GitHub integration** (recommended) or locally via the Supabase CLI.

The Express API still talks to Postgres through `pg` (`utils/db.js`). You do **not** need `@supabase/supabase-js` on the backend unless you add Supabase Auth / Storage later.

## 1. Create a Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → New project.
2. Copy the **Session pooler** connection string (port `5432`) from **Connect**.
3. Set it as `DATABASE_URL` in Railway (or `.env` locally).

Use Session pooler, not Transaction pooler (`6543`), because the API uses SQL transactions (`withTransaction`).

## 2. Auto-migrations via GitHub (recommended)

You do **not** need a separate repository. Connect the same backend repo:

1. Supabase Dashboard → **Project Settings** → **Integrations** → **GitHub**.
2. Authorize GitHub and choose **`dodotap/bookgo-backend`** (or your fork).
3. **Working directory:** `.` (repo root — `supabase/` is at the top level).
4. Enable **Deploy to production** — new files in `supabase/migrations/` are applied on push/merge to `main`.
5. Optional: enable **Automatic branching** for preview DBs on pull requests.

After the first push with `supabase/migrations/`, Supabase runs all pending migrations and records them in `supabase_migrations.schema_migrations`.

**Railway:** remove the old `releaseCommand: npm run migrate` — migrations are handled by Supabase, not Railway. Railway only needs `DATABASE_URL` pointing at Supabase.

### Adding a new migration

```bash
npx supabase migration new add_some_column
# edit supabase/migrations/<timestamp>_add_some_column.sql
git add supabase/migrations
git commit -m "migration: add some column"
git push
```

Supabase applies it automatically when **Deploy to production** is on.

## 3. Local / manual migration

```bash
cp env.example .env
# set DATABASE_URL to your Supabase Session pooler URI

npm install
npm run migrate          # supabase db push
npm run migrate:status   # supabase migration list
npm run seed:admin
npm run dev
```

## 4. Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Railway, `.env` | Session pooler URI for Express + migrations |
| `DATABASE_SSL` | Optional | `true` / `false`; auto `true` for `*.supabase.com` |
| `JWT_SECRET` | Railway, `.env` | API auth (unchanged) |
| `SUPABASE_PROJECT_REF` | Local CLI only | `supabase link --project-ref ...` |
| `SUPABASE_ACCESS_TOKEN` | CI / CLI | [Account tokens](https://supabase.com/dashboard/account/tokens) |

## 5. Security

Migration `20240624000009_enable_rls_on_app_tables.sql` enables RLS and revokes `anon` / `authenticated` on app tables. The backend connects as `postgres` and is unaffected; the Supabase Data API cannot read user/page data without policies.

## 6. Migrating from Railway Postgres

1. Create a fresh Supabase project (or empty branch).
2. Push this repo — GitHub integration applies `supabase/migrations/`.
3. Export data from old Railway DB if needed (`pg_dump` / `pg_restore`).
4. Point Railway `DATABASE_URL` at Supabase Session pooler URI.
5. Redeploy Railway (no migrate step on deploy).
6. Run `npm run seed:admin` once if the users table is empty.
