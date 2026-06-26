# Page profile photo API

Загрузка и удаление **фото публичного профиля страницы** (builder → секция Profile → Change photo).

Фото хранится в Supabase Storage (bucket `files`, путь `pages/{pageId}/...`) и записывается в `page_profiles.avatar_url` → `settings.profile.avatar_url`.

**Не путать** с `users.avatar` (аккаунт) — фото витрины меняется только через эти эндпоинты.

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Все эндпоинты требуют `Authorization: Bearer <token>` и владение страницей (`pages.user_id` = текущий пользователь).

---

## POST /pages/:id/avatar

Загрузить фото профиля страницы. При повторной загрузке предыдущий файл в Storage удаляется.

### Path params

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID страницы (`pageId` в builder) |

### Request body

`Content-Type: multipart/form-data`

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `avatar` | file | да | JPEG, PNG, WebP или GIF, максимум **5 MB** |

Рекомендация UI: JPG/PNG, не меньше 400×400 px (только подсказка на фронте; бэкенд размер в пикселях не проверяет).

### Пример (curl)

```bash
curl -X POST "https://bookgo-backend.up.railway.app/pages/PAGE_ID/avatar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept-Language: ru" \
  -F "avatar=@/path/to/photo.jpg"
```

### Пример (fetch)

```typescript
const formData = new FormData()
formData.append('avatar', file)

const res = await fetch(`${API_BASE}/pages/${pageId}/avatar`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Accept-Language': 'ru',
  },
  body: formData,
})

const json = await res.json()
// json.data.avatar_url
// json.data.page.settings.profile.avatar_url — тот же URL
```

### Ответы

#### 200 — успех

```json
{
  "success": true,
  "message": "Фото страницы успешно загружено",
  "data": {
    "avatar_url": "https://byttvudgaibixzarzeol.supabase.co/storage/v1/object/public/files/pages/550e8400-e29b-41d4-a716-446655440000/1782404374305-f0cc5daf.png",
    "page": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "max-volkov",
      "published": false,
      "settings": {
        "profile": {
          "name": "Maksym Vorobchenko",
          "role": "",
          "avatar_url": "https://byttvudgaibixzarzeol.supabase.co/storage/v1/object/public/files/pages/.../....png",
          "bio": "",
          "city": "",
          "lang": "en",
          "email": "hello@dodotap.com",
          "phone": ""
        }
      }
    }
  }
}
```

Используй `data.avatar_url` или `data.page.settings.profile.avatar_url` для превью в builder.

#### 400 — нет файла / неверный тип / слишком большой

```json
{
  "success": false,
  "message": "Фото должно быть в формате JPEG, PNG, WebP или GIF"
}
```

| `message` (ru) | Причина |
|----------------|---------|
| Нужно выбрать файл фото | поле `avatar` отсутствует |
| Фото должно быть не больше 5 МБ | > 5 MB |
| Фото должно быть в формате JPEG, PNG, WebP или GIF | неверный MIME |

#### 404 — страница не найдена

```json
{
  "success": false,
  "message": "Страница не найдена"
}
```

#### 503 — Storage не настроен на сервере

```json
{
  "success": false,
  "message": "Хранилище фото не настроено на сервере"
}
```

---

## DELETE /pages/:id/avatar

Удалить фото профиля страницы из Storage и очистить `avatar_url`.

### Path params

| Параметр | Тип | Описание |
|----------|-----|----------|
| `id` | UUID | ID страницы |

### Request body

Нет.

### Пример

```bash
curl -X DELETE "https://bookgo-backend.up.railway.app/pages/PAGE_ID/avatar" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept-Language: ru"
```

### Ответ 200

```json
{
  "success": true,
  "message": "Фото страницы удалено",
  "data": {
    "page": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "settings": {
        "profile": {
          "avatar_url": ""
        }
      }
    }
  }
}
```

---

## PATCH /pages/:id и avatar_url

Через JSON-патч можно **очистить** URL (`"avatar_url": ""`), но загружать новое фото нужно через `POST /pages/:id/avatar`.

Если передать произвольный внешний URL — **400**:

```json
{
  "success": false,
  "message": "URL фото должен указывать на хранилище Bookgo"
}
```

Допустимы только URL из bucket `files` с путём `pages/{pageId}/...`.

---

## Публичная витрина

После publish фото доступно на публичной странице:

`GET /public/pages/:slug` → `data.page.settings.profile.avatar_url`

URL публичный (bucket `files`, public read), отдельной авторизации для картинки не нужно.

---

## Порядок в Postman / тестах

1. `POST /auth/login` → сохранить `token`
2. `GET /pages` или `POST /pages` → сохранить `pageId`
3. **`POST /pages/:id/avatar`** — выбрать файл в поле `avatar`
4. `GET /pages/:id` — проверить `settings.profile.avatar_url`
5. `DELETE /pages/:id/avatar` — опционально

См. также: [pages_api.md](./pages_api.md), коллекция `postman/bookgo-api.postman_collection.json`.
