# Bookgo API — документация

Документация для интеграции **bookgo-app** с **bookgo-backend**.

## Файлы

| Документ | Для кого | Содержание |
|----------|----------|------------|
| [API_CONVENTIONS.md](./API_CONVENTIONS.md) | Все | Формат ответов, i18n, ошибки, JWT |
| [INTEGRATION_RULES.md](./INTEGRATION_RULES.md) | Фронт / AI | Что можно и нельзя при интеграции |
| [frontend_auth_integration.md](./frontend_auth_integration.md) | **bookgo-app** | Auth, profile, AuthContext |
| [frontend_pages_integration.md](./frontend_pages_integration.md) | **bookgo-app** | Pages API, PageSettings, builder |
| [auth_api.md](./auth_api.md) | Контракт | Login, logout |
| [profile_api.md](./profile_api.md) | Контракт | Info, edit, change-password |
| [pages_api.md](./pages_api.md) | Контракт | CRUD pages, publish, public slug |
| [pages_avatar_api.md](./pages_avatar_api.md) | Контракт | Фото профиля страницы (upload/delete) |
| [pages_schema_draft.md](./pages_schema_draft.md) | БД | Гибридная схема таблиц |
| [data_model.md](./data_model.md) | Архитектура | Фазы, связи, миграции |
| [supabase_setup.md](./supabase_setup.md) | DevOps | Supabase, GitHub auto-migrations, Railway |

## Postman

Коллекция: [`../postman/bookgo-api.postman_collection.json`](../postman/bookgo-api.postman_collection.json)

## Production URL

```
https://bookgo-backend.up.railway.app
```

Локально: `http://localhost:8080`

## Scope v1 (реализовано)

**Auth & account**

- `POST /auth/login`, `POST /auth/logout`
- `GET /profile/info`, `PATCH /profile/edit`, `PUT /profile/change-password`
- `GET /health`

**Pages (builder)**

- `GET /pages`, `POST /pages`
- `GET /pages/:id`, `PATCH /pages/:id`
- `POST /pages/:id/publish`, `POST /pages/:id/unpublish`
- `POST /pages/:id/set-default`, `DELETE /pages/:id`
- `GET /public/pages/:slug`

## Не реализовано

- signup, forgot-password, reset-password
- bookings API
- multi-staff pages
