# Page services API

CRUD для **услуг страницы** (builder → секция Services): создание, редактирование, удаление, активация/деактивация, категории и флаг `useCategories`.

Данные хранятся в `page_service_items` / `page_service_categories` и собираются в `settings.services` при `GET /pages/:id`.

**Альтернатива:** по-прежнему можно менять весь блок `settings.services` через `PATCH /pages/:id` (полная замена). Для точечных операций в UI удобнее эндпоинты ниже.

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
| `priceHidden` | boolean | Скрыть цену на витрине |
| `categoryId` | UUID \| null | Категория (если `useCategories: true`) |
| `isActive` | boolean | Активна для бронирования |
| `photoUrl` | string | URL фото (загрузка файла — отдельно, пока только строка) |

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

После create/update/delete/activate/deactivate в `data` возвращается:

```json
{
  "service": { /* только для операций с одной услугой */ },
  "category": { /* только для операций с одной категорией */ },
  "services": { /* полный блок ServicesSettings */ }
}
```

Обновите локальный стейт builder из `data.services` (или замените только `data.service`).

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
          "title": "Session",
          "subtitle": "",
          "durationMinutes": 60,
          "priceAmount": 0,
          "currency": "PLN",
          "priceHidden": false,
          "categoryId": null,
          "isActive": true,
          "photoUrl": ""
        }
      ]
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
| `photoUrl` | нет | `""` |
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

## POST /pages/:id/services/:serviceId/deactivate

Скрыть услугу с витрины (`isActive: false`). Удобная обёртка над `PATCH` с `{ "isActive": false }`.

Не блокирует деактивацию последней активной услуги — публикация страницы всё равно потребует ≥1 активной услуги.

### Ответ 200

```json
{
  "success": true,
  "message": "Услуга деактивирована",
  "data": {
    "service": { "id": "...", "isActive": false },
    "services": { "...": "..." }
  }
}
```

---

## POST /pages/:id/services/:serviceId/activate

Вернуть услугу на витрину (`isActive: true`).

Тело запроса не требуется.

---

## DELETE /pages/:id/services/:serviceId

Удалить услугу безвозвратно.

### Ответ 200

`data.services` — блок без удалённой услуги. Поля `service` / `category` отсутствуют.

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

```typescript
// Создание
const res = await fetch(`${API}/pages/${pageId}/services`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'ru',
  },
  body: JSON.stringify({
    title: 'Consultation',
    durationMinutes: 30,
    priceAmount: 5000,
    currency: 'PLN',
  }),
})
const { data } = await res.json()
setServices(data.services) // синхронизировать стейт builder

// Деактивация
await fetch(`${API}/pages/${pageId}/services/${serviceId}/deactivate`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
})
```

Рекомендуемый порядок в UI:

1. `GET /pages/:id` при открытии builder (услуги уже в `settings.services`).
2. Точечные изменения — эндпоинты из этого документа.
3. Массовый импорт / синхронизация всего блока — `PATCH /pages/:id`.

---

## Связанные документы

- [pages_api.md](./pages_api.md) — CRUD страницы, publish
- [pages_schema_draft.md](./pages_schema_draft.md) — схема БД
- Postman: `postman/bookgo-api.postman_collection.json`
