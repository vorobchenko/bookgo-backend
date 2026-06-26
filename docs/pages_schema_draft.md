# Pages — схема БД и API (v1)

Гибридная модель: мета на `pages`, profile/theme/availability 1:1, services реляционно, контент-блоки в `page_blocks.data` JSONB.

API собирает объект `PageSettings` как в bookgo-app.

---

## Таблицы

| Таблица | Связь с `pages` | Назначение |
|---------|-----------------|------------|
| `pages` | — | slug, published, section_layout, флаги |
| `page_profiles` | 1:1 (`page_id` PK) | ProfileSettings |
| `page_themes` | 1:1 | ThemeSettings |
| `page_availability` | 1:1 | AvailabilitySettings (days в JSONB) |
| `page_service_categories` | 1:N | Категории услуг |
| `page_service_items` | 1:N | Услуги |
| `page_blocks` | 1:N (UNIQUE page_id+type) | FAQ, gallery, contacts… |

Миграции: `supabase/migrations/` (см. [`docs/supabase_setup.md`](supabase_setup.md)).

---

## `pages`

```sql
slug VARCHAR(64) UNIQUE
published, published_at, is_default, settings_version
services_use_categories BOOLEAN
section_layout JSONB  -- PageBlock[] (enabled/required/status)
```

---

## `page_profiles`

`name`, `role`, `bio`, `city`, `lang`, `avatar_url`, `email`, `phone`

Hero-заголовок: `headline_line1`, `headline_line2` → `profile.headline_line1`, `profile.headline_line2`

→ [frontend_profile_copy_integration.md](./frontend_profile_copy_integration.md)

При `POST /pages` — copy-on-create из `users`.

---

## `page_themes`

| Колонка | Тип | Значения |
|---------|-----|----------|
| `accent_color` | varchar | `#RRGGBB` |
| `secondary_color` | varchar | `#RRGGBB` |
| `surface_color` | varchar | `#RRGGBB` |
| `text_color` | varchar | `#RRGGBB` |
| `text_muted_color` | varchar | `#RRGGBB` |
| `mode` | varchar | `light`, `dark`, `auto` |
| `font_preset` | varchar | произвольная строка |
| `element_style` | varchar | `rounded`, `sharp`, `pill` |
| `cta` | jsonb | `{ variant, size, label_case }` |
| `atmosphere` | jsonb | `{ grain, grain_intensity, card_style }` |
| `background` | jsonb | `{ type: solid \| gradient \| image, ... }` |

---

## `page_availability`

Скаляры: `timezone`, `buffer_after_minutes`, `min_notice_hours`, `max_days_ahead`, `slot_interval_minutes`, `max_bookings_per_day`

`days` JSONB — массив без `label`/`letter` (добавляются API при чтении):

```json
[{ "weekday": 1, "working": true, "ranges": [{ "id": "...", "start": "09:00", "end": "17:00" }] }]
```

---

## Services

**`page_service_categories`:** `id`, `page_id`, `title`, `sort_order`

**`page_service_items`:** `id`, `page_id`, `category_id`, `title`, `subtitle`, `duration_minutes`, `price_amount` (minor units), `currency`, `price_hidden`, `photo_url`, `is_active`, `sort_order`

---

## `page_blocks`

Типы: `stories`, `gallery`, `video`, `location`, `contacts`, `reviews`, `faq`, `cancellation_policy`, `custom_questions`

| type | `data` |
|------|--------|
| `reviews`, `faq`, `custom_questions` | `{ "items": [...] }` |
| `cancellation_policy` | `{ "policy_text", "cutoff_hours" }` |
| остальные | объект 1:1 с фронтом |

---

## API

### Admin (JWT)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/pages` | Список страниц user (preview без full settings) |
| POST | `/pages` | Создать страницу `{ slug?, is_default? }` |
| GET | `/pages/:id` | Полная страница + `settings` |
| PATCH | `/pages/:id` | `{ slug?, settings?: partial PageSettings }` |
| POST | `/pages/:id/publish` | Валидация + publish |
| POST | `/pages/:id/unpublish` | Снять публикацию |
| POST | `/pages/:id/set-default` | Страница по умолчанию |
| DELETE | `/pages/:id` | Удалить страницу |

### Public

| Метод | Путь |
|-------|------|
| GET | `/public/pages/:slug` | Только `published=true` |

### Ответ `GET /pages/:id`

```json
{
  "success": true,
  "message": "...",
  "data": {
    "page": {
      "id": "uuid",
      "user_id": "uuid",
      "slug": "max-volkov",
      "published": false,
      "published_at": null,
      "is_default": true,
      "settings_version": 1,
      "created_at": "...",
      "updated_at": "...",
      "settings": { }
    }
  }
}
```

`settings` = полный `PageSettings` из bookgo-app.

---

## Slug

- lowercase, `[a-z0-9-]`, 3–48 символов
- глобально уникален

---

## Phase 2 (не в v1)

Multi-staff: `page_staff`, `page_staff_service`, availability per staff.
