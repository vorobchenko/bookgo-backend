# Postman — Bookgo API

Коллекция и окружения хранятся в git как JSON. Это **контракт для HTTP-запросов**, не код для интеграции во фронт.

## Файлы

| Файл | Назначение |
|------|------------|
| `bookgo-api.postman_collection.json` | Все эндпоинты v1 (health, auth, profile, pages) |
| `bookgo-local.postman_environment.json` | `http://localhost:8080` |
| `bookgo-production.postman_environment.json` | Railway production |

## Импорт в Postman

1. **Import** → `bookgo-api.postman_collection.json`
2. **Import** → нужный `*.postman_environment.json`
3. В environment задать `adminPassword` (секрет, не коммитить)
4. Запустить **POST /auth/login** — `token` сохранится автоматически

## Порядок запросов (smoke test)

```
GET /health
POST /auth/login           → token
GET /profile/info
GET /pages                 → pageId (если есть)
POST /pages                → pageId, pageSlug (если список пуст)
PATCH /pages/:id           → заполнить profile, services, availability
POST /pages/:id/avatar     → выбрать файл в поле avatar (JPEG/PNG/WebP/GIF)
POST /pages/:id/publish
GET /public/pages/:slug
POST /pages/:id/unpublish
POST /auth/logout
```

## Pages — переменные

После `POST /pages` или `GET /pages` автоматически выставляются:

- `pageId` — UUID страницы
- `pageSlug` — slug для публичного URL

## Правила обновления

1. Новый эндпоинт на бэкенде → request в коллекцию + строка в `docs/*_api.md`
2. Для pages — синхронизировать с `docs/pages_api.md` и `docs/frontend_pages_integration.md`
3. Не дублировать route-handlers — только HTTP в коллекции

## CLI (Newman)

```bash
npx newman run postman/bookgo-api.postman_collection.json \
  -e postman/bookgo-production.postman_environment.json \
  --env-var "adminPassword=YOUR_PASSWORD"
```

См. [`../docs/README.md`](../docs/README.md).
