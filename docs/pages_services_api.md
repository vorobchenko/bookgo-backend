# Page services API

Управление **услугами страницы** (builder → Your services): создание, редактирование, **архив** (active/inactive), **порядок**, фото, категории.

**Удаление в UI не используется** — вместо delete услугу отправляют в архив (`isActive: false`).

| UI | API |
|----|-----|
| ACTIVE | `isActive: true` |
| ARCHIVED | `isActive: false` |
| Порядок в списке | `sortOrder` + `PUT .../services/order` |

Данные в `page_service_items` / `page_service_categories` → `settings.services` при `GET /pages/:id`.

**Альтернатива:** полная замена блока через `PATCH /pages/:id` с `settings.services`.

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Все эндпоинты требуют `Authorization: Bearer <token>` и владение страницей.

---

## Типы

### `ServiceItem`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | ID услуги |
| `title` | string | Название (обязательно при создании) |
| `subtitle` | string | Подзаголовок |
| `durationMinutes` | integer | Длительность в минутах (> 0) |
| `priceAmount` | integer | Цена в **минорных единицах** (15000 = 150.00) |
| `currency` | string | ISO 4217, 3 буквы (`PLN`, `EUR`, …) |
| `priceHidden` | boolean | Скрыть цену на витрине (`On request`) |
| `categoryId` | UUID \| null | Категория (если `useCategories: true`) |
| `isActive` | boolean | `true` = ACTIVE, `false` = ARCHIVED |
| `photoUrl` | string | URL фото в Supabase Storage |
| `sortOrder` | integer | Порядок отображения (0 = первый) |

### `ServicesMeta`

| Поле | Тип | Описание |
|------|-----|----------|
| `activeCount` | integer | Число активных услуг |
| `archivedCount` | integer | Число в архиве |
| `totalCount` | integer | Всего услуг |

### `ServiceCategory`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | ID категории |
| `title` | string | Название |

### `ServicesSettings`

```json
{
  "useCategories": false,
  "categories": [],
  "services": [ /* ServiceItem[] */ ]
}
```

### Ответ мутаций

После create/update/archive/reorder в `data` возвращается:

```json
{
  "service": { },
  "category": { },
  "services": { },
  "meta": { "activeCount": 3, "archivedCount": 2, "totalCount": 5 }
}
```

Список в `services.services` отсортирован по `sortOrder` ASC. На фронте разбей на секции:

```typescript
const active = services.services.filter((s) => s.isActive)
const archived = services.services.filter((s) => !s.isActive)
```

Обновляй стейт builder из `data.services`.

---

## GET /pages/:id/services

Список услуг и категорий страницы.

### Ответ 200

```json
{
  "success": true,
  "message": "Услуги успешно получены",
  "data": {
    "services": {
      "useCategories": false,
      "categories": [],
      "services": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "title": "Web development",
          "subtitle": "",
          "durationMinutes": 60,
          "priceAmount": 10000,
          "currency": "EUR",
          "priceHidden": false,
          "categoryId": null,
          "isActive": true,
          "photoUrl": "https://...",
          "sortOrder": 0
        }
      ]
    },
    "meta": {
      "activeCount": 3,
      "archivedCount": 2,
      "totalCount": 5
    }
  }
}
```

---

## PATCH /pages/:id/services/settings

Включить/выключить группировку по категориям.

### Request body

```json
{
  "useCategories": true
}
```

### Ответ 200

`data.services` — обновлённый блок (категории и услуги без изменений).

---

## PUT /pages/:id/services/order

Задать **порядок всех услуг** на странице (drag-and-drop в ACTIVE и ARCHIVED).

Массив `order` — UUID услуг **сверху вниз**, как в UI. Должен включать **каждую** услугу страницы ровно один раз.

### Request body

```json
{
  "order": [
    "uuid-active-1",
    "uuid-active-2",
    "uuid-active-3",
    "uuid-archived-1",
    "uuid-archived-2"
  ]
}
```

Типичный сценарий: пользователь перетащил карточки только в секции ACTIVE — отправь новый порядок active-элементов + archived в прежнем порядке в конце.

### Пример (fetch)

```typescript
await fetch(`${API}/pages/${pageId}/services/order`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ order: reorderedIds }),
})
```

### Ответ 200

`data.services` с обновлёнными `sortOrder` (0, 1, 2, …) + `data.meta`.

### Ошибки

| HTTP | `message` (смысл) |
|------|-------------------|
| 400 | Пустой order, дубликаты, не все услуги, чужой UUID |

---

## POST /pages/:id/services

Создать услугу.

### Request body

| Поле | Обязательно | По умолчанию |
|------|-------------|--------------|
| `title` | да | — |
| `durationMinutes` | да | — |
| `subtitle` | нет | `""` |
| `priceAmount` | нет | `0` |
| `currency` | нет | `PLN` |
| `priceHidden` | нет | `false` |
| `categoryId` | нет | `null` |
| `isActive` | нет | `true` |
| `photoUrl` | нет | `""` (загружайте файл через `POST .../photo`) |
| `id` | нет | сервер сгенерирует UUID (можно передать временный UUID с фронта) |
| `sortOrder` | нет | в конец списка |

### Пример

```bash
curl -X POST "https://bookgo-backend.up.railway.app/pages/PAGE_ID/services" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: ru" \
  -d '{
    "title": "Personal Training",
    "subtitle": "60 min",
    "durationMinutes": 60,
    "priceAmount": 15000,
    "currency": "PLN",
    "isActive": true
  }'
```

### Ответ 201

```json
{
  "success": true,
  "message": "Услуга создана",
  "data": {
    "service": { "id": "...", "title": "Personal Training", "isActive": true },
    "services": { "useCategories": false, "categories": [], "services": [ "..."] }
  }
}
```

---

## PATCH /pages/:id/services/:serviceId

Частичное редактирование услуги. Передавайте только меняющиеся поля.

### Пример — изменить цену и название

```json
{
  "title": "PT Session",
  "priceAmount": 18000
}
```

### Пример — сменить категорию

```json
{
  "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
}
```

### Пример — убрать категорию

```json
{
  "categoryId": null
}
```

### Ответ 200

`data.service` — обновлённая услуга, `data.services` — полный блок.

### Ошибки

| HTTP | Когда |
|------|-------|
| 400 | Валидация (пустой title, неверная валюта, категория не на этой странице) |
| 404 | Страница или услуга не найдена |

---

## POST /pages/:id/services/:serviceId/archive

Отправить услугу в **архив** (`isActive: false`). Кнопка «Archive» в UI.

Алиас: `POST .../deactivate` (то же поведение).

Тело запроса не требуется.

### Ответ 200

```json
{
  "success": true,
  "message": "Услуга отправлена в архив",
  "data": {
    "service": { "id": "...", "isActive": false },
    "services": { "...": "..." },
    "meta": { "activeCount": 2, "archivedCount": 3, "totalCount": 5 }
  }
}
```

Архивные услуги **не показываются** на публичной витрине для бронирования.

---

## POST /pages/:id/services/:serviceId/restore

Вернуть услугу из архива в **ACTIVE** (`isActive: true`). Кнопка «Restore» в UI.

Алиас: `POST .../activate` (то же поведение).

---

## POST /pages/:id/services/:serviceId/photo

Загрузить фото услуги (превью слева в списке «Your services»). При повторной загрузке предыдущий файл удаляется из Storage.

Путь в bucket `files`: `pages/{pageId}/services/{serviceId}/{timestamp}-{id}.jpg`

### Request body

`Content-Type: multipart/form-data`

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `photo` | file | да | JPEG, PNG, WebP или GIF, максимум **5 MB** |

### Пример (fetch)

```typescript
const formData = new FormData()
formData.append('photo', file)

const res = await fetch(`${API_BASE}/pages/${pageId}/services/${serviceId}/photo`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Accept-Language': 'ru',
  },
  body: formData,
})

const json = await res.json()
// json.data.photoUrl
// json.data.service.photoUrl — тот же URL
setServices(json.data.services)
```

### Ответ 200

```json
{
  "success": true,
  "message": "Фото услуги загружено",
  "data": {
    "photoUrl": "https://....supabase.co/storage/v1/object/public/files/pages/PAGE_ID/services/SERVICE_ID/....png",
    "service": {
      "id": "...",
      "title": "Session",
      "photoUrl": "https://....png",
      "isActive": true
    },
    "services": { "useCategories": false, "categories": [], "services": [] }
  }
}
```

---

## DELETE /pages/:id/services/:serviceId/photo

Удалить фото услуги из Storage и очистить `photoUrl`.

### Ответ 200

`data.service.photoUrl` = `""`, `data.services` — обновлённый блок.

**Не путать** с `DELETE .../services/:serviceId` — тот эндпоинт удаляет всю услугу (фото тоже удаляется из Storage).

**Не путать** с архивом: `DELETE .../services/:serviceId` физически удаляет запись (в UI не используется).

---

## DELETE /pages/:id/services/:serviceId (legacy)

Физическое удаление услуги. **В builder не нужно** — используйте archive.

Оставлено для админских сценариев. При удалении фото в Storage тоже удаляется.

---

## Категории услуг

Нужны, когда `useCategories: true`.

### POST /pages/:id/service-categories

```json
{
  "title": "Coaching",
  "id": "optional-client-uuid",
  "sortOrder": 0
}
```

**201** — `data.category` + `data.services`.

### PATCH /pages/:id/service-categories/:categoryId

```json
{
  "title": "1:1 Coaching",
  "sortOrder": 1
}
```

### DELETE /pages/:id/service-categories/:categoryId

Удаляет категорию. У связанных услуг `categoryId` становится `null` (ON DELETE SET NULL).

---

## Публикация

Для `POST /pages/:id/publish` нужна **хотя бы одна** услуга с `isActive: true`. После деактивации всех услуг публикация вернёт `validationFailed`.

---

## Интеграция на фронте

**→ [frontend_services_integration.md](./frontend_services_integration.md)** — типы TypeScript, API client, сценарии UI (ACTIVE/ARCHIVED, drag-and-drop, фото), changelog.

---

## Связанные документы

- [frontend_services_integration.md](./frontend_services_integration.md) — **интеграция для bookgo-app**
- [pages_api.md](./pages_api.md) — CRUD страницы, publish
- [pages_schema_draft.md](./pages_schema_draft.md) — схема БД
- Postman: `postman/bookgo-api.postman_collection.json`
