# Frontend Integration — Pages (Builder)

Документация для интеграции **bookgo-app** с API booking-страниц.

Перед началом: [INTEGRATION_RULES.md](./INTEGRATION_RULES.md), [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Контракт: [pages_api.md](./pages_api.md)  
Схема БД: [pages_schema_draft.md](./pages_schema_draft.md)  
Услуги (Your services): [frontend_services_integration.md](./frontend_services_integration.md)  
Тексты hero-карточки: [frontend_profile_copy_integration.md](./frontend_profile_copy_integration.md)

---

## Base URL

Тот же, что для auth:

```env
VITE_API_BASE_URL=https://bookgo-backend.up.railway.app
```

Используйте существующий `apiRequest` из `src/api/client.ts` и JWT из `AuthContext`.

---

## Главная идея

Бэкенд хранит страницу в нескольких таблицах, но **отдаёт и принимает один объект `PageSettings`** — тот же тип, что уже есть в `src/types/settings.ts`.

```typescript
// Ответ GET /pages/:id
type PageResponse = {
  id: string
  user_id: string
  slug: string
  published: boolean
  published_at: string | null
  is_default: boolean
  settings_version: number
  created_at: string
  updated_at: string
  settings: PageSettings  // slug + published дублируются в settings
}
```

Не парсить «сырые» таблицы на фронте — только `data.page.settings`.

---

## TypeScript типы

Создать `src/types/api/pages.ts`:

```typescript
import type { PageSettings } from '../settings'

export type PagePreview = {
  name: string
  role: string
  avatar_url: string
}

export type PageListItem = {
  id: string
  slug: string
  published: boolean
  published_at: string | null
  is_default: boolean
  settings_version: number
  created_at: string
  updated_at: string
  preview: PagePreview
}

export type Page = {
  id: string
  user_id: string
  slug: string
  published: boolean
  published_at: string | null
  is_default: boolean
  settings_version: number
  created_at: string
  updated_at: string
  settings: PageSettings
}

export type PublishValidation = {
  valid: boolean
  errors: string[]
  core_complete: number
  core_total: number
}

export type CreatePageRequest = {
  slug?: string
  is_default?: boolean
}

export type PatchPageRequest = {
  slug?: string
  settings?: Partial<PageSettings>
}
```

---

## API-модуль

Создать `src/api/pages.ts`:

```typescript
import type { ApiResponse } from '../types/api/common'
import type {
  CreatePageRequest,
  Page,
  PageListItem,
  PatchPageRequest,
  PublishValidation,
} from '../types/api/pages'
import { apiRequest } from './client'

export async function listPages(token: string) {
  const res = await apiRequest<{ pages: PageListItem[] }>('/pages', { token })
  return res.data.pages
}

export async function createPage(token: string, body: CreatePageRequest = {}) {
  const res = await apiRequest<{ page: Page }>('/pages', {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  })
  return res.data.page
}

export async function getPage(token: string, pageId: string) {
  const res = await apiRequest<{ page: Page }>(`/pages/${pageId}`, { token })
  return res.data.page
}

export async function patchPage(token: string, pageId: string, body: PatchPageRequest) {
  const res = await apiRequest<{ page: Page }>(`/pages/${pageId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(body),
  })
  return res.data.page
}

export async function publishPage(token: string, pageId: string) {
  const res = await apiRequest<{ page: Page; validation: PublishValidation }>(
    `/pages/${pageId}/publish`,
    { method: 'POST', token },
  )
  return res.data
}

export async function unpublishPage(token: string, pageId: string) {
  const res = await apiRequest<{ page: Page }>(`/pages/${pageId}/unpublish`, {
    method: 'POST',
    token,
  })
  return res.data.page
}

export async function setDefaultPage(token: string, pageId: string) {
  const res = await apiRequest<{ page: Page }>(`/pages/${pageId}/set-default`, {
    method: 'POST',
    token,
  })
  return res.data.page
}

export async function deletePage(token: string, pageId: string) {
  await apiRequest<Record<string, never>>(`/pages/${pageId}`, {
    method: 'DELETE',
    token,
  })
}

/** Публичная витрина — без JWT */
export async function getPublicPage(slug: string) {
  const res = await apiRequest<{ page: Page }>(`/public/pages/${slug}`)
  return res.data.page
}
```

---

## Эндпоинты

| Метод | Путь | Auth | Назначение |
|-------|------|------|------------|
| GET | `/pages` | Bearer | Список страниц (preview, без full settings) |
| POST | `/pages` | Bearer | Создать страницу |
| GET | `/pages/:id` | Bearer | Полная страница + `settings` |
| PATCH | `/pages/:id` | Bearer | Частичное обновление |
| POST | `/pages/:id/publish` | Bearer | Опубликовать (с валидацией) |
| POST | `/pages/:id/unpublish` | Bearer | Снять с публикации |
| POST | `/pages/:id/set-default` | Bearer | Страница по умолчанию |
| DELETE | `/pages/:id` | Bearer | Удалить |
| GET | `/public/pages/:slug` | — | Публичная витрина |

---

## Потоки в UI

### 1. Первый вход в Builder

```
1. GET /pages
2. Если pages.length === 0 → POST /pages {}  (slug из имени user)
3. Иначе → GET /pages/:id для is_default или первой в списке
4. Положить page.settings в PageSettingsContext
5. Хранить pageId в state (не только localStorage)
```

### 2. Сохранение черновика (Save draft)

Вместо `localStorage` — PATCH с текущим `PageSettings`:

```typescript
await patchPage(token, pageId, {
  slug: settings.slug,
  settings: {
    profile: settings.profile,
    theme: settings.theme,
    availability: settings.availability,
    services: settings.services,
    blocks: settings.blocks,
    stories: settings.stories,
    gallery: settings.gallery,
    video: settings.video,
    location: settings.location,
    contacts: settings.contacts,
    reviews: settings.reviews,
    faq: settings.faq,
    cancellation: settings.cancellation,
    custom_questions: settings.custom_questions,
  },
})
```

Можно отправлять **только изменённую секцию** — бэкенд мержит partial.

**Важно:** при PATCH `settings.services` категории и услуги **полностью заменяются** на переданный массив.

### 3. Publish

```
1. PATCH (если isDirty) — сохранить последние изменения
2. POST /pages/:id/publish
3. При 400 — показать data.validation.errors
4. При 200 — обновить settings из data.page
```

Валидация на бэке совпадает с `validatePublish` на фронте (имя, язык, активная услуга, working hours).

### 4. Публичная страница `bookgo.app/t/:slug`

```
GET /public/pages/:slug  →  page.settings для рендера витрины
```

Только `published === true`. Иначе 404.

---

## Slug

Правила (как в `PageUrlSection.slugify`):

- lowercase, `[a-z0-9-]`, 3–48 символов
- глобально уникален

При 409 — slug занят, предложить другой.

---

## Фото профиля (Change photo)

Фото витрины **не** загружается через `PATCH /pages/:id`. Используй отдельный эндпоинт:

| Method | Path | Body |
|--------|------|------|
| `POST` | `/pages/:id/avatar` | `multipart/form-data`, поле `avatar` |
| `DELETE` | `/pages/:id/avatar` | — |

Контракт: [pages_avatar_api.md](./pages_avatar_api.md)

```typescript
export async function uploadPageAvatar(token: string, pageId: string, file: File) {
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await apiRequest<{ avatar_url: string; page: Page }>(
    `/pages/${pageId}/avatar`,
    { method: 'POST', token, body: formData }
  )
  return res.data
}
```

После успеха обнови локальный state: `settings.profile.avatar_url = data.avatar_url`.

---

## Услуги (Services)

Полная интеграция секции **Your services**: типы, archive/restore, порядок, фото, чеклист.

**→ [frontend_services_integration.md](./frontend_services_integration.md)**

Кратко: не удаляй услуги — `POST .../archive`; порядок — `PUT .../services/order`; фото — `POST .../photo` (поле `photo`). После мутаций обновляй `settings.services` из `data.services`.

---

## Маппинг полей (БД ↔ фронт)

| API `settings` | Примечание |
|----------------|------------|
| `profile.lang` | колонка `lang` (`en` \| `ru`) |
| `profile.avatar_url` | колонка `avatar_url` |
| `profile.headline_line1` | колонка `headline_line1` |
| `profile.headline_line2` | колонка `headline_line2` |
| `theme.accent_color` | колонка `accent_color` |
| `availability.buffer_before_minutes` | `buffer_before_minutes` |
| `availability.days[].label/letter` | **не хранятся в БД**, бэкенд добавляет при чтении |
| `services.use_categories` | `pages.services_use_categories` |
| `blocks` | `pages.section_layout` + пересчёт `status` на бэке |

ID услуг и категорий после первого сохранения — **UUID** из API (не `svc-personal` из mock).

---

## Ошибки

| HTTP | Когда | Действие UI |
|------|-------|-------------|
| 400 | Невалидный slug, publish validation | Показать `message` + `data.validation.errors` |
| 401 | Нет / просрочен token | Редирект на login |
| 404 | Страница не найдена | Сообщение + вернуться к списку |
| 409 | Slug занят | Подсветить поле slug |

```typescript
import { ApiError } from '../api/client'

try {
  await publishPage(token, pageId)
} catch (e) {
  if (e instanceof ApiError && e.status === 400) {
    // validation errors в body при publish — парсить из response если нужно
  }
}
```

Для publish с ошибками валидации бэкенд возвращает:

```json
{
  "success": false,
  "message": "Page is not ready to publish",
  "data": {
    "validation": {
      "valid": false,
      "errors": ["Enable at least one service"],
      "core_complete": 2,
      "core_total": 3
    }
  }
}
```

Расширьте `apiRequest` или обработайте отдельно, если нужны `errors` при `success: false` на 400.

---

## Замена localStorage в PageSettingsContext

Минимальный план миграции:

1. Добавить `pageId: string | null` в контекст.
2. `loadPageSettings` → `getPage(token, pageId)` при наличии auth.
3. `saveDraft` → `patchPage`.
4. `publish` → `publishPage`.
5. localStorage оставить как offline fallback **только если нет сети** (опционально).

При `POST /pages` профиль витрины копируется из `users` (name, email, phone, avatar, bio, city, **lang**). Поле `role` пустое — заполнить в builder. **Timezone** только в секции Schedule (`availability.timezone`).

---

## Пример: загрузка при открытии Builder

```typescript
const pages = await listPages(token)
let page: Page

if (pages.length === 0) {
  page = await createPage(token)
} else {
  const defaultPage = pages.find((p) => p.is_default) ?? pages[0]
  page = await getPage(token, defaultPage.id)
}

setPageId(page.id)
setSettings(page.settings)
```

---

## Пример: PATCH только профиля

```typescript
await patchPage(token, pageId, {
  settings: {
    profile: {
      ...settings.profile,
      name: 'Max Volkov',
      role: 'Coach',
    },
  },
})
```

---

## Пример: публичная витрина

```typescript
// routes: /t/:slug
const page = await getPublicPage(slug)
return <PublicBookingPage settings={page.settings} />
```

---

## Чеклист интеграции

- [ ] `src/types/api/pages.ts`
- [ ] `src/api/pages.ts`
- [ ] `pageId` в контексте builder
- [ ] Загрузка через GET /pages + GET /pages/:id
- [ ] Save → PATCH вместо localStorage
- [ ] Publish → POST /pages/:id/publish
- [ ] Публичный роут → GET /public/pages/:slug
- [ ] Обработка 409 slug, 400 validation
- [ ] UUID для service/category id после сохранения

---

## Не вызывать

- Прямой доступ к таблицам БД
- Эндпоинты signup / forgot-password (ещё не реализованы)
