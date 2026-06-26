# Frontend Integration — Services (Your services)

Документация для секции **Your services** в builder (`bookgo-app`).

Перед началом: [INTEGRATION_RULES.md](./INTEGRATION_RULES.md), [API_CONVENTIONS.md](./API_CONVENTIONS.md)

HTTP-контракт: [pages_services_api.md](./pages_services_api.md)  
Общий builder: [frontend_pages_integration.md](./frontend_pages_integration.md)

---

## Что изменилось (changelog)

| Было | Стало |
|------|--------|
| Только `PATCH /pages/:id` с полным `settings.services` | Отдельные эндпоинты на каждое действие |
| Удаление услуги | **Архив** — `is_active: false`, запись остаётся |
| Порядок неявный (индекс в массиве при PATCH) | Поле **`sort_order`** + **`PUT .../services/order`** |
| `photo_url` только строкой | **`POST .../photo`** — загрузка файла в Storage |
| Нет счётчиков | **`meta.active_count` / `archived_count`** в ответах |

`PATCH /pages/:id` с `settings.services` по-прежнему работает (полная замена), но **в UI builder используйте эндпоинты ниже**.

---

## Маппинг UI → API

```
Your services                    API
─────────────────────────────────────────────────
"3 active · 2 archived"    →     data.meta
секция ACTIVE              →     services.filter(s => s.is_active)
секция ARCHIVED            →     services.filter(s => !s.is_active)
кнопка Archive             →     POST .../archive
кнопка Restore             →     POST .../restore
drag-and-drop порядка      →     PUT .../services/order
плейсхолдер фото слева     →     POST .../photo (поле photo)
редактирование полей       →     PATCH .../services/:id
+ Add service              →     POST .../services
```

**Не вызывайте** `DELETE /pages/:id/services/:serviceId` в builder — услуги не удаляются, только архивируются.

---

## TypeScript типы

Добавить или обновить в `src/types/api/services.ts` (и синхронизировать с `src/types/settings.ts`):

```typescript
export type ServiceItem = {
  id: string
  title: string
  subtitle: string
  duration_minutes: number
  price_amount: number       // минорные единицы: 15000 = 150.00
  currency: string          // "PLN" | "EUR" | ...
  price_hidden: boolean      // true → "On request" в UI
  categoryId: string | null
  is_active: boolean         // true = ACTIVE, false = ARCHIVED
  photo_url: string
  sort_order: number         // NEW: порядок в списке
}

export type ServiceCategory = {
  id: string
  title: string
}

export type ServicesSettings = {
  use_categories: boolean
  categories: ServiceCategory[]
  services: ServiceItem[]
}

export type ServicesMeta = {
  active_count: number
  archived_count: number
  total_count: number
}

/** Ответ GET /pages/:id/services */
export type ServicesListResponse = {
  services: ServicesSettings
  meta: ServicesMeta
}

/** Ответ мутации (create, patch, archive, reorder, photo, …) */
export type ServiceMutationResponse = {
  service?: ServiceItem
  category?: ServiceCategory
  services: ServicesSettings
  meta?: ServicesMeta
  photo_url?: string
}
```

Обновить `PageSettings.services` в `settings.ts`: у каждого элемента `services[]` должны быть `sort_order` и актуальный `photo_url`.

---

## API client (`src/api/services.ts`)

Примеры на базе существующего `apiRequest`:

```typescript
import type {
  ServiceItem,
  ServiceMutationResponse,
  ServicesListResponse,
  ServicesSettings,
} from '../types/api/services'

function syncServices(
  setSettings: (patch: Partial<PageSettings>) => void,
  data: ServiceMutationResponse
) {
  setSettings({ services: data.services })
}

export async function fetchPageServices(pageId: string) {
  const res = await apiRequest<ServicesListResponse>(`/pages/${pageId}/services`)
  return res.data
}

export async function createService(
  pageId: string,
  body: Pick<ServiceItem, 'title' | 'duration_minutes'> &
    Partial<Omit<ServiceItem, 'id' | 'title' | 'duration_minutes'>>
) {
  const res = await apiRequest<ServiceMutationResponse>(`/pages/${pageId}/services`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function updateService(
  pageId: string,
  serviceId: string,
  patch: Partial<ServiceItem>
) {
  const res = await apiRequest<ServiceMutationResponse>(
    `/pages/${pageId}/services/${serviceId}`,
    { method: 'PATCH', body: JSON.stringify(patch) }
  )
  return res.data
}

export async function archiveService(pageId: string, serviceId: string) {
  const res = await apiRequest<ServiceMutationResponse>(
    `/pages/${pageId}/services/${serviceId}/archive`,
    { method: 'POST' }
  )
  return res.data
}

export async function restoreService(pageId: string, serviceId: string) {
  const res = await apiRequest<ServiceMutationResponse>(
    `/pages/${pageId}/services/${serviceId}/restore`,
    { method: 'POST' }
  )
  return res.data
}

export async function reorderServices(pageId: string, order: string[]) {
  const res = await apiRequest<ServiceMutationResponse>(
    `/pages/${pageId}/services/order`,
    { method: 'PUT', body: JSON.stringify({ order }) }
  )
  return res.data
}

export async function uploadServicePhoto(
  pageId: string,
  serviceId: string,
  file: File
) {
  const formData = new FormData()
  formData.append('photo', file) // не avatar!

  const res = await apiRequest<ServiceMutationResponse>(
    `/pages/${pageId}/services/${serviceId}/photo`,
    { method: 'POST', body: formData }
  )
  return res.data
}

export async function deleteServicePhoto(pageId: string, serviceId: string) {
  const res = await apiRequest<ServiceMutationResponse>(
    `/pages/${pageId}/services/${serviceId}/photo`,
    { method: 'DELETE' }
  )
  return res.data
}
```

---

## Синхронизация стейта

После **любой** мутации:

```typescript
const data = await archiveService(pageId, serviceId)
setPageSettings((prev) => ({
  ...prev,
  services: data.services,
}))
setMeta(data.meta) // для "3 active · 2 archived"
```

Или проще — перезагрузить страницу: `GET /pages/:id` (услуги уже в `settings.services`).

Список для рендера:

```typescript
function splitServices(services: ServicesSettings) {
  const sorted = [...services.services].sort((a, b) => a.sort_order - b.sort_order)
  return {
    active: sorted.filter((s) => s.is_active),
    archived: sorted.filter((s) => !s.is_active),
  }
}
```

---

## Сценарии UI

### Открытие секции Services

1. Услуги уже есть в `GET /pages/:id` → `settings.services`
2. Опционально `GET /pages/:id/services` для `meta` (счётчики)

### Add service

1. `POST /pages/:id/services` с `title`, `duration_minutes`, …
2. В ответе `data.service.id` — **серверный UUID**, сохранить в стейт
3. Только после этого можно загружать фото

### Редактирование (название, цена, длительность)

`PATCH /pages/:id/services/:serviceId` — только изменённые поля.

```typescript
await updateService(pageId, serviceId, {
  title: 'PT Session',
  price_amount: 18000,
  price_hidden: false,
})
```

### Archive / Restore

```typescript
// Archive (иконка коробки)
await archiveService(pageId, serviceId)

// Restore (иконка стрелок)
await restoreService(pageId, serviceId)
```

Алиасы (можно не использовать): `POST .../deactivate` = archive, `POST .../activate` = restore.

### Drag-and-drop порядок

После перетаскивания соберите **все** ID сверху вниз (active, затем archived):

```typescript
function buildOrder(active: ServiceItem[], archived: ServiceItem[]) {
  return [...active, ...archived].map((s) => s.id)
}

async function onReorder(active: ServiceItem[], archived: ServiceItem[]) {
  const order = buildOrder(active, archived)
  const data = await reorderServices(pageId, order)
  setPageSettings((p) => ({ ...p, services: data.services }))
}
```

`order` должен содержать **каждую** услугу страницы ровно один раз.

### Фото услуги

```typescript
async function onPhotoPick(serviceId: string, file: File) {
  // serviceId должен быть с сервера, не локальный temp id
  const data = await uploadServicePhoto(pageId, serviceId, file)
  setPageSettings((p) => ({ ...p, services: data.services }))
}
```

- Поле формы: **`photo`**
- Форматы: JPEG, PNG, WebP, GIF, до 5 MB
- Превью: `service.photo_url` (публичный URL Supabase)

### Цена в UI

```typescript
function formatPrice(s: ServiceItem) {
  if (s.price_hidden) return 'On request'
  const major = s.price_amount / 100
  return `${s.currency} ${major}`
}
```

---

## Ошибки

| HTTP | Когда | Действие в UI |
|------|-------|----------------|
| 400 | Валидация, неполный `order` | Toast с `message` |
| 401 | Нет / просрочен token | Redirect на login |
| 404 | Страница или услуга не найдена | Услуга не сохранена на сервере — сначала POST |
| 503 | Storage не настроен | Сообщение «загрузка фото недоступна» |

Типичная 404 на фото: загрузка до `POST /services` (локальный UUID ещё не в БД).

---

## Publish

Для публикации нужна **≥1 услуга с `is_active: true`**. Все в архиве → `POST /pages/:id/publish` вернёт `400 validationFailed`.

Архивные услуги на публичной витрине для бронирования не показываются.

---

## Чеклист интеграции

- [ ] Типы `ServiceItem` + `sort_order`, `ServicesMeta`
- [ ] Секции ACTIVE / ARCHIVED по `is_active`
- [ ] Счётчик `meta.active_count · meta.archived_count`
- [ ] Archive / Restore вместо delete
- [ ] `PUT .../services/order` после drag-and-drop
- [ ] `POST .../photo` с полем `photo` после сохранения услуги
- [ ] Синхронизация `settings.services` из `data.services` после мутаций
- [ ] Не слать весь `settings.services` через PATCH при каждом клике

---

## См. также

- [pages_services_api.md](./pages_services_api.md) — полный HTTP-контракт
- [pages_avatar_api.md](./pages_avatar_api.md) — фото **профиля** (другой эндпоинт, поле `avatar`)
- Postman → папка **Page Services**
