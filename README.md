# Bookgo Backend

Node.js API for Bookgo — authentication, profiles, and booking pages.

## Stack

- Express 4
- Supabase Postgres (`pg` + Session pooler)
- JWT + bcrypt
- SQL migrations in `supabase/migrations/` (Supabase CLI + GitHub integration)

## Setup

```bash
cp env.example .env
# Edit .env: Supabase Session pooler URI as DATABASE_URL, JWT_SECRET

npm install
npm run migrate
npm run seed:admin
npm run dev
```

Full Supabase + GitHub steps: [`docs/supabase_setup.md`](docs/supabase_setup.md)

## Railway (API host)

1. Create a Supabase project and copy the **Session pooler** `DATABASE_URL`.
2. In Railway, set `DATABASE_URL` and `JWT_SECRET` on the API service.
3. Deploy — **migrations run via Supabase GitHub integration**, not Railway `releaseCommand`.
4. Run seed once (Railway shell or locally with production `DATABASE_URL`):

```bash
npm run seed:admin
```

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in Railway Variables before seeding.

## Migrations

```bash
npm run migrate          # supabase db push (local / manual)
npm run migrate:status   # supabase migration list
```

Migration files live in `supabase/migrations/`. Applied migrations are tracked in `supabase_migrations.schema_migrations`. Never edit applied files — add a new timestamped SQL file with `npx supabase migration new <name>`.

## Postman

Коллекция и окружения в [`postman/`](postman/) — JSON в git, импорт в Postman или запуск через Newman. См. [`postman/README.md`](postman/README.md).

## Documentation

Полная документация для фронта и контракт API: [`docs/`](docs/)

- [Frontend integration (auth)](docs/frontend_auth_integration.md) — TypeScript, AuthContext
- [Frontend integration (pages)](docs/frontend_pages_integration.md) — PageSettings, builder, publish
- [Pages API](docs/pages_api.md) — CRUD, publish, public slug
- [Auth API](docs/auth_api.md) — login, logout

## API

All responses use:

```json
{
  "success": true,
  "message": "Localized message",
  "data": {}
}
```

Pass `Accept-Language: ru` or `Accept-Language: en` for localized messages.

### Endpoints

| Method | Path | Auth | Body |
|--------|------|------|------|
| GET | `/health` | — | — |
| POST | `/auth/login` | — | `{ "email", "password" }` |
| POST | `/auth/logout` | Bearer | — |
| GET | `/profile/info` | Bearer | — |
| PATCH | `/profile/edit` | Bearer | `{ "name", "phone", "avatar", "bio", "city", "timezone", "lang" }` |
| POST | `/profile/avatar` | Bearer | `multipart/form-data`, field `avatar` (image, max 5 MB) |
| DELETE | `/profile/avatar` | Bearer | — |
| PUT | `/profile/change-password` | Bearer | `{ "new_password", "password_confirm" }` |
| GET | `/pages` | Bearer | — |
| POST | `/pages` | Bearer | `{ "slug?", "is_default?" }` |
| GET | `/pages/:id` | Bearer | — |
| PATCH | `/pages/:id` | Bearer | `{ "slug?", "settings?" }` |
| POST | `/pages/:id/publish` | Bearer | — |
| POST | `/pages/:id/unpublish` | Bearer | — |
| POST | `/pages/:id/set-default` | Bearer | — |
| DELETE | `/pages/:id` | Bearer | — |
| GET | `/public/pages/:slug` | — | — |

### Examples

Login:

```bash
curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: ru" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

Profile:

```bash
curl -s http://localhost:8080/profile/info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept-Language: en"
```

Change password:

```bash
curl -s -X PUT http://localhost:8080/profile/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_password":"newpass123","password_confirm":"newpass123"}'
```
