# Postman — Bookgo API

Коллекция и окружения хранятся в git как JSON. Это **контракт для HTTP-запросов**, не код для интеграции во фронт.

## Файлы

| Файл | Назначение |
|------|------------|
| `bookgo-api.postman_collection.json` | Все эндпоинты v1 |
| `bookgo-local.postman_environment.json` | `http://localhost:8080` |
| `bookgo-production.postman_environment.json` | Railway production |

## Структура коллекции

| Папка | Эндпоинты |
|-------|-----------|
| **Health** | `GET /health` |
| **Auth** | login, logout |
| **Profile** | info, edit, change-password |
| **Pages** | CRUD, publish, unpublish, set-default |
| **Page Avatar** | upload, delete |
| **Page Services** | services CRUD, activate/deactivate, categories, settings |
| **Public** | `GET /public/pages/:slug` |

## Импорт в Postman

1. **Import** → `bookgo-api.postman_collection.json`
2. **Import** → нужный `*.postman_environment.json`
3. В environment задать `adminPassword` (секрет, не коммитить)
4. Запустить **POST /auth/login** — `token` сохранится автоматически

Коллекция использует **Bearer auth на уровне коллекции** — Login/Health/Public переопределяют `noauth`.

## Smoke test (Run Collection)

Рекомендуемый порядок папок:

```
Health
Auth          → Login (token)
Profile       → GET /profile/info
Pages         → GET /pages → POST /pages → GET /pages/:id → PATCH /pages/:id
Page Services → GET services → settings → category → POST service → PATCH → activate
Pages         → POST /pages/:id/publish
Public        → GET /public/pages/:slug
Pages         → POST /pages/:id/unpublish
Auth          → Logout
```

Опционально: **Page Avatar** (нужен файл в поле `avatar`).

Пропустите **DELETE /pages/:id** и **DELETE service** в smoke, если не хотите удалять тестовые данные.

## Переменные

| Переменная | Откуда |
|------------|--------|
| `token` | POST /auth/login |
| `pageId`, `pageSlug` | GET/POST /pages, GET /pages/:id |
| `serviceId` | starter service при POST /pages, или POST /pages/:id/services |
| `categoryId` | POST /pages/:id/service-categories |

## CLI (Newman)

```bash
npx newman run postman/bookgo-api.postman_collection.json \
  -e postman/bookgo-production.postman_environment.json \
  --env-var "adminPassword=YOUR_PASSWORD" \
  --folder "Health" \
  --folder "Auth" \
  --folder "Profile" \
  --folder "Pages" \
  --folder "Page Services" \
  --folder "Public"
```

## Правила обновления

1. Новый эндпоинт → request в нужную папку + `docs/*_api.md`
2. Не дублировать route-handlers — только HTTP в коллекции

См. [`../docs/README.md`](../docs/README.md).
