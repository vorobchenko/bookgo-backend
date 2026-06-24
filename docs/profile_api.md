# Profile API

Контракт эндпоинтов профиля аккаунта (v1).

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Все эндпоинты требуют `Authorization: Bearer <token>`.

---

## Модель User (аккаунт)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `string` (UUID) | ID пользователя |
| `email` | `string` | Email (логин) |
| `name` | `string \| null` | Имя |
| `phone` | `string \| null` | Телефон |
| `avatar` | `string \| null` | URL аватара |
| `bio` | `string \| null` | Биография (до 1000 символов) |
| `city` | `string \| null` | Город |
| `timezone` | `string` | IANA timezone, по умолчанию `UTC` |
| `lang` | `"en" \| "ru"` | Язык профиля |
| `is_active` | `boolean` | Активен ли аккаунт |
| `last_login_at` | `string \| null` | ISO datetime последнего входа |
| `created_at` | `string` | ISO datetime |
| `updated_at` | `string` | ISO datetime |

Пароль в ответах **никогда** не возвращается.

---

## GET /profile/info

Получение профиля текущего пользователя (по JWT).

### Request body

Нет.

### Пример запроса

```bash
curl https://bookgo-backend.up.railway.app/profile/info \
  -H "Authorization: Bearer <token>" \
  -H "Accept-Language: ru"
```

### Ответы

#### 200 — успех

```json
{
  "success": true,
  "message": "Информация о профиле успешно получена",
  "data": {
    "user": {
      "id": "ee3d5d07-7ed4-4a40-90ed-11650d0c2386",
      "email": "hello@dodotap.com",
      "name": "Admin",
      "phone": null,
      "avatar": null,
      "bio": null,
      "city": null,
      "timezone": "UTC",
      "lang": "en",
      "is_active": true,
      "last_login_at": "2026-06-24T07:51:08.873Z",
      "created_at": "2026-06-24T07:50:12.000Z",
      "updated_at": "2026-06-24T07:51:08.873Z"
    }
  }
}
```

#### 401 / 403 — проблемы с токеном

```json
{
  "success": false,
  "message": "Токен доступа не предоставлен"
}
```

```json
{
  "success": false,
  "message": "Неверный или просроченный токен"
}
```

#### 403 — аккаунт деактивирован

```json
{
  "success": false,
  "message": "Аккаунт деактивирован. Обратитесь в поддержку."
}
```

#### 404 — пользователь не найден

```json
{
  "success": false,
  "message": "Пользователь не найден"
}
```

#### 500

```json
{
  "success": false,
  "message": "Ошибка получения данных пользователя"
}
```

---

## PATCH /profile/edit

Частичное обновление профиля. Передаются только изменяемые поля.

### Request body

| Поле | Тип | Правила |
|------|-----|---------|
| `name` | `string` | минимум 2 символа после trim |
| `phone` | `string` | пустая строка → `null` |
| `avatar` | `string` | URL |
| `bio` | `string` | максимум 1000 символов |
| `city` | `string` | |
| `timezone` | `string` | например `Europe/Warsaw` |
| `lang` | `"en" \| "ru"` | |

`email` и `password` через этот эндпоинт **не меняются**.

```json
{
  "name": "Maxim",
  "city": "Warsaw",
  "timezone": "Europe/Warsaw",
  "lang": "ru",
  "phone": "+48123456789",
  "bio": "Personal coach"
}
```

### Пример запроса

```bash
curl -X PATCH https://bookgo-backend.up.railway.app/profile/edit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: ru" \
  -d '{"name":"Maxim","city":"Warsaw","lang":"ru"}'
```

### Ответы

#### 200 — успех

Тело `data.user` — полный объект пользователя (как в `GET /profile/info`).

```json
{
  "success": true,
  "message": "Профиль успешно обновлен",
  "data": {
    "user": {
      "id": "ee3d5d07-7ed4-4a40-90ed-11650d0c2386",
      "email": "hello@dodotap.com",
      "name": "Maxim",
      "phone": null,
      "avatar": null,
      "bio": null,
      "city": "Warsaw",
      "timezone": "UTC",
      "lang": "ru",
      "is_active": true,
      "last_login_at": "2026-06-24T07:51:08.873Z",
      "created_at": "2026-06-24T07:50:12.000Z",
      "updated_at": "2026-06-24T08:10:00.000Z"
    }
  }
}
```

#### 400 — имя слишком короткое

```json
{
  "success": false,
  "message": "Имя слишком короткое. Минимум 2 символа"
}
```

#### 400 — bio слишком длинное

```json
{
  "success": false,
  "message": "Биография слишком длинная. Максимум 1000 символов"
}
```

#### 400 — неверный lang

```json
{
  "success": false,
  "message": "Некорректный код языка",
  "valid_languages": ["en", "ru"]
}
```

#### 400 — нет полей для обновления

```json
{
  "success": false,
  "message": "Нет полей для обновления"
}
```

---

## PUT /profile/change-password

Смена пароля. Требуется валидный JWT. **Старый пароль не запрашивается** (как в padelgo).

### Request body

| Поле | Тип | Правила |
|------|-----|---------|
| `new_password` | `string` | 8–128 символов |
| `password_confirm` | `string` | должен совпадать с `new_password` |

```json
{
  "new_password": "new-secure-password",
  "password_confirm": "new-secure-password"
}
```

### Пример запроса

```bash
curl -X PUT https://bookgo-backend.up.railway.app/profile/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{"new_password":"new-secure-password","password_confirm":"new-secure-password"}'
```

### Ответы

#### 200 — успех

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "user": {
      "id": "ee3d5d07-7ed4-4a40-90ed-11650d0c2386",
      "email": "hello@dodotap.com",
      "updated_at": "2026-06-24T08:15:00.000Z"
    }
  }
}
```

#### 400 — поля не переданы

```json
{
  "success": false,
  "message": "New password and password confirmation are required"
}
```

#### 400 — пароли не совпадают

```json
{
  "success": false,
  "message": "Passwords do not match"
}
```

#### 400 — длина пароля

```json
{
  "success": false,
  "message": "Password must be 8-128 characters long"
}
```

#### 400 — новый пароль = текущий

```json
{
  "success": false,
  "message": "New password must be different from current password"
}
```

#### 403 — аккаунт деактивирован

```json
{
  "success": false,
  "message": "Account is deactivated"
}
```

#### 404

```json
{
  "success": false,
  "message": "User not found"
}
```
