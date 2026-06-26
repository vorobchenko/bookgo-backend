# Page services API

Управление **услугами страницы** (builder → Your services): создание, редактирование, **архив** (active/inactive), **порядок**, фото, категории.

**Удаление в UI не используется** — вместо delete услугу отправляют в архив (`is_active: false`).

| UI | API |
|----|-----|
| ACTIVE | `is_active: true` |
| ARCHIVED | `is_active: false` |
| Порядок в списке | `sort_order` + `PUT .../services/order` |

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
| `duration_minutes` | integer | Длительность в минутах (> 0) |
| `price_amount` | integer | Цена в **минорных единицах** (15000 = 150.00) |
| `currency` | string | ISO 4217, 3 буквы (`PLN`, `EUR`, …) |
| `price_hidden` | boolean | Скрыть цену на витрине (`On request`) |
| `categoryId` | UUID \| null | Категория (если `use_categories: true`) |
| `is_active` | boolean | `true` = ACTIVE, `false` = ARCHIVED |
| `photo_url` | string | URL фото в Supabase Storage |
| `sort_order` | integer | Порядок отображения (0 = первый) |

### `ServicesMeta`

| Поле | Тип | Описание |
|------|-----|----------|
| `active_count` | integer | Число активных услуг |
| `archived_count` | integer | Число в архиве |
| `total_count` | integer | Всего услуг |

### `ServiceCategory`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | ID категории |
| `title` | string | Название |

### `ServicesSettings`

```json
{
  "use_categories": false,
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
  "meta": { "active_count": 3, "archived_count": 2, "total_count": 5 }
}
```

Список в `services.services` отсортирован по `sort_order` ASC. На фронте разбей на секции:

```typescript
const active = services.services.filter((s) => s.is_active)
const archived = services.services.filter((s) => !s.is_active)
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
      "use_categories": false,
      "categories": [],
      "services": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "title": "Web development",
          "subtitle": "",
          "duration_minutes": 60,
          "price_amount": 10000,
          "currency": "EUR",
          "price_hidden": false,
          "categoryId": null,
          "is_active": true,
          "photo_url": "https://...",
          "sort_order": 0
        }
      ]
    },
    "meta": {
      "active_count": 3,
      "archived_count": 2,
      "total_count": 5
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
  "use_categories": true
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

`data.services` с обновлёнными `sort_order` (0, 1, 2, …) + `data.meta`.

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
| `duration_minutes` | да | — |
| `subtitle` | нет | `""` |
| `price_amount` | нет | `0` |
| `currency` | нет | `PLN` |
| `price_hidden` | нет | `false` |
| `categoryId` | нет | `null` |
| `is_active` | нет | `true` |
| `photo_url` | нет | `""` (загружайте файл через `POST .../photo`) |
| `id` | нет | сервер сгенерирует UUID (можно передать временный UUID с фронта) |
| `sort_order` | нет | в конец списка |

### Пример

```bash
curl -X POST "https://bookgo-backend.up.railway.app/pages/PAGE_ID/services" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: ru" \
  -d '{
    "title": "Personal Training",
    "subtitle": "60 min",
    "duration_minutes": 60,
    "price_amount": 15000,
    "currency": "PLN",
    "is_active": true
  }'
```

### Ответ 201

```json
{
  "success": true,
  "message": "Услуга создана",
  "data": {
    "service": { "id": "...", "title": "Personal Training", "is_active": true },
    "services": { "use_categories": false, "categories": [], "services": [ "..."] }
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
  "price_amount": 18000
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

Отправить услугу в **архив** (`is_active: false`). Кнопка «Archive» в UI.

Алиас: `POST .../deactivate` (то же поведение).

Тело запроса не требуется.

### Ответ 200

```json
{
  "success": true,
  "message": "Услуга отправлена в архив",
  "data": {
    "service": { "id": "...", "is_active": false },
    "services": { "...": "..." },
    "meta": { "active_count": 2, "archived_count": 3, "total_count": 5 }
  }
}
```

Архивные услуги **не показываются** на публичной витрине для бронирования.

---

## POST /pages/:id/services/:serviceId/restore

Вернуть услугу из архива в **ACTIVE** (`is_active: true`). Кнопка «Restore» в UI.

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
// json.data.photo_url
// json.data.service.photo_url — тот же URL
setServices(json.data.services)
```

### Ответ 200

```json
{
  "success": true,
  "message": "Фото услуги загружено",
  "data": {
    "photo_url": "https://....supabase.co/storage/v1/object/public/files/pages/PAGE_ID/services/SERVICE_ID/....png",
    "service": {
      "id": "...",
      "title": "Session",
      "photo_url": "https://....png",
      "is_active": true
    },
    "services": { "use_categories": false, "categories": [], "services": [] }
  }
}
```

---

## DELETE /pages/:id/services/:serviceId/photo

Удалить фото услуги из Storage и очистить `photo_url`.

### Ответ 200

`data.service.photo_url` = `""`, `data.services` — обновлённый блок.

**Не путать** с `DELETE .../services/:serviceId` — тот эндпоинт удаляет всю услугу (фото тоже удаляется из Storage).

**Не путать** с архивом: `DELETE .../services/:serviceId` физически удаляет запись (в UI не используется).

---

## DELETE /pages/:id/services/:serviceId (legacy)

Физическое удаление услуги. **В builder не нужно** — используйте archive.

Оставлено для админских сценариев. При удалении фото в Storage тоже удаляется.

---

## Категории услуг

Нужны, когда `use_categories: true`.

### POST /pages/:id/service-categories

```json
{
  "title": "Coaching",
  "id": "optional-client-uuid",
  "sort_order": 0
}
```

**201** — `data.category` + `data.services`.

### PATCH /pages/:id/service-categories/:categoryId

```json
{
  "title": "1:1 Coaching",
  "sort_order": 1
}
```

### DELETE /pages/:id/service-categories/:categoryId

Удаляет категорию. У связанных услуг `categoryId` становится `null` (ON DELETE SET NULL).

---

## Публикация

Для `POST /pages/:id/publish` нужна **хотя бы одна** услуга с `is_active: true`. После деактивации всех услуг публикация вернёт `validationFailed`.

---

## Интеграция на фронте

**→ [frontend_services_integration.md](./frontend_services_integration.md)** — типы TypeScript, API client, сценарии UI (ACTIVE/ARCHIVED, drag-and-drop, фото), changelog.

---

## Связанные документы

- [frontend_services_integration.md](./frontend_services_integration.md) — **интеграция для bookgo-app**
- [pages_api.md](./pages_api.md) — CRUD страницы, publish
- [pages_schema_draft.md](./pages_schema_draft.md) — схема БД
- Postman: `postman/bookgo-api.postman_collection.json`
