# API Conventions — Bookgo

Общие правила для всех эндпоинтов bookgo-backend.

## Формат ответа

Каждый ответ — JSON:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `success` | `boolean` | `true` — успех, `false` — ошибка |
| `message` | `string` | Локализованное сообщение для UI |
| `data` | `object \| null` | Полезная нагрузка (может отсутствовать при ошибке) |

HTTP-статус передаётся **только в заголовке** (`200`, `400`, `401`, …), отдельного поля `status` в JSON нет.

### Успех

```json
{
  "success": true,
  "message": "Successful authorization",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Ошибка

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

Иногда добавляются поля контекста, например:

```json
{
  "success": false,
  "message": "Invalid language code",
  "valid_languages": ["en", "ru"]
}
```

## Локализация

Заголовок запроса:

```
Accept-Language: ru
```

или

```
Accept-Language: en
```

Поддерживаются: **`en`**, **`ru`**. По умолчанию — `en`.

Поле `message` в ответе приходит уже на выбранном языке. **Не хардкодить** тексты ошибок на фронте — показывать `response.message`.

Примеры `message` для одного и того же кода ошибки:

| Ключ | `Accept-Language: en` | `Accept-Language: ru` |
|------|------------------------|------------------------|
| login success | Successful authorization | Успешная авторизация |
| invalid credentials | Invalid email or password | Неверный email или пароль |
| profile info success | Profile information successfully retrieved | Информация о профиле успешно получена |

## Авторизация

Защищённые эндпоинты:

```
Authorization: Bearer <jwt_token>
```

Токен выдаётся в `POST /auth/login` → `data.token`.

JWT payload (для справки, декодировать на фронте не обязательно):

```json
{
  "id": "ee3d5d07-7ed4-4a40-90ed-11650d0c2386",
  "email": "hello@dodotap.com",
  "name": "Admin",
  "iat": 1782287486,
  "exp": 1784879486
}
```

Срок действия задаётся на сервере (`JWT_EXPIRES_IN`, по умолчанию `30d`).

## Коды HTTP

| Код | Когда |
|-----|--------|
| `200` | Успешный запрос |
| `400` | Невалидные данные (валидация) |
| `401` | Нет токена / неверный логин |
| `403` | Токен невалиден / аккаунт деактивирован |
| `404` | Пользователь не найден |
| `500` | Внутренняя ошибка сервера |

## Именование полей

- JSON: **snake_case** (`new_password`, `last_login_at`, `password_confirm`)
- TypeScript на фронте: можно маппить в camelCase в слое `api/`, но в HTTP body отправлять snake_case как в документации

## Даты

ISO 8601 в UTC, например: `"2026-06-24T07:51:08.873Z"`

## Healthcheck

`GET /health` — без авторизации, для мониторинга Railway.

```json
{
  "success": true,
  "message": "Bookgo API is running",
  "data": {
    "status": "ok",
    "timestamp": "2026-06-24T07:51:08.873Z",
    "uptime": 159.73
  }
}
```
