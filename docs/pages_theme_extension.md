# Theme API v2 — расширение кастомизации

ТЗ для бэкенда: расширить `page_themes` и контракт `GET/PATCH /pages/:id/theme`, чтобы фронт мог реализовать:

1. **Контроль бренда** — не только accent
2. **CTA / кнопки** — отдельные настройки
3. **Фон и атмосфера** — image, overlay, grain, glass-карточки

Связанные документы:

- Текущий контракт: [pages_theme_api.md](./pages_theme_api.md)
- Интеграция фронта: [frontend_theme_integration.md](./frontend_theme_integration.md)
- Модель: [data_model.md](./data_model.md)
- Upload (референс): [pages_avatar_api.md](./pages_avatar_api.md)

---

## Контекст

### Что есть сейчас

| Поле | Где хранится | Назначение |
|------|--------------|------------|
| `accent_color` | `page_themes` | Один акцент на всю страницу |
| `mode` | `page_themes` | `light` / `dark` / `auto` |
| `font_preset` | `page_themes` | Строковый id шрифта (фронт-реестр) |
| `element_style` | `page_themes` | `rounded` / `sharp` / `pill` — скругление UI |
| `background` | `page_themes.background` (JSONB) | `solid` / `gradient` / `image` |

### Что убираем / не возвращаем

- `preset` (style preset) — **только UI билдера**, в API не хранится (migration `016`).
- `background.type: preset` — **deprecated**; при чтении мигрировать в `solid` с дефолтным цветом, при записи отклонять `400`.

### Принцип v2

- **Style presets** остаются на фронте: при выборе пресета билдер шлёт развёрнутый snapshot полей theme.
- Бэкенд хранит **атомарные настройки**, валидирует и отдаёт их в `GET /pages/:id` и `GET /public/pages/:slug` → `settings.theme`.
- Все новые поля — **optional в PATCH**, но всегда присутствуют в GET (с дефолтами).

---

## Изменения в БД

### Вариант (рекомендуемый): колонки + JSONB

Миграция `017_page_themes_brand_cta_atmosphere.sql`:

```sql
ALTER TABLE page_themes
  ADD COLUMN secondary_color   varchar(7),
  ADD COLUMN surface_color     varchar(7),
  ADD COLUMN text_color        varchar(7),
  ADD COLUMN text_muted_color  varchar(7),
  ADD COLUMN cta               jsonb NOT NULL DEFAULT '{"variant":"solid","size":"default","label_case":"uppercase"}'::jsonb,
  ADD COLUMN atmosphere        jsonb NOT NULL DEFAULT '{"grain":false,"grain_intensity":0.12,"card_style":"solid"}'::jsonb;
```

`background` (JSONB) **расширяется** новыми полями для `type: image` и общими overlay-полями (см. ниже). Отдельная колонка не нужна.

### Обратная совместимость

При `GET` для страниц без новых колонок (до миграции) — отдавать дефолты из таблицы ниже.

При `PATCH` с неизвестными ключами в `theme` — `400 BODY_INVALID` (как сейчас).

---

## Схема `ThemeSettings` (полная)

```json
{
  "accent_color": "#c6f432",
  "secondary_color": "#8b5cf6",
  "surface_color": "#1a1a1a",
  "text_color": "#ffffff",
  "text_muted_color": "#8a8a8a",
  "mode": "auto",
  "font_preset": "sport",
  "element_style": "rounded",
  "cta": {
    "variant": "solid",
    "size": "default",
    "label_case": "uppercase"
  },
  "atmosphere": {
    "grain": false,
    "grain_intensity": 0.12,
    "card_style": "solid"
  },
  "background": {
    "type": "gradient",
    "gradient_from": "#0a0a0a",
    "gradient_to": "#1a1a2e",
    "gradient_angle": 180,
    "overlay_color": "#000000",
    "overlay_opacity": 0
  }
}
```

---

## 1. Бренд-цвета

### Поля

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `accent_color` | string | да | Primary accent — CTA, highlights, calendar selection |
| `secondary_color` | string | да | Второй акцент — бейджи категорий, ссылки, вторичные chip |
| `surface_color` | string | да | Фон карточек / инпутов / календаря поверх page background |
| `text_color` | string | нет* | Основной текст. Если `null` — фронт выводит из `mode` |
| `text_muted_color` | string | нет* | Вторичный текст. Если `null` — фронт выводит из `mode` |

\*В GET всегда возвращать значение: либо сохранённое, либо вычисленный дефолт для текущего `mode` (см. Defaults).

### Валидация

- Формат: `#RRGGBB` (6 hex, uppercase на выходе опционально).
- Ошибка: `ACCENT_COLOR_INVALID`, `SECONDARY_COLOR_INVALID`, `SURFACE_COLOR_INVALID`, `TEXT_COLOR_INVALID`, `TEXT_MUTED_COLOR_INVALID`.

### Семантика `mode`

`mode` по-прежнему управляет light/dark/auto на фронте. Бренд-цвета — **явные override**, которые пользователь задал в билдере. Фронт не пересчитывает их при смене `mode`, если они сохранены.

Рекомендация UI: при смене `light` ↔ `dark` предлагать обновить surface/text (фронт), бэкенд это не делает автоматически.

### Defaults (новая страница, `mode: auto`, тёмная база)

| Поле | Значение |
|------|----------|
| `accent_color` | `#c6f432` |
| `secondary_color` | `#3dd6b0` |
| `surface_color` | `#1a1a1a` |
| `text_color` | `#ffffff` |
| `text_muted_color` | `#8a8a8a` |

Для `mode: light` дефолты фронт может подставлять при создании страницы; бэкенд при отсутствии значений в БД отдаёт дефолты тёмной темы (как сейчас с accent).

---

## 2. CTA / кнопки

Отдельный объект `cta`. **Не путать** с `element_style` (скругление всех контролов).

### `cta`

| Поле | Тип | Значения | Default | UI |
|------|-----|----------|---------|-----|
| `variant` | string | `solid`, `outline`, `ghost` | `solid` | Заливка / обводка / прозрачная |
| `size` | string | `compact`, `default`, `large` | `default` | Padding и font-size главной CTA |
| `label_case` | string | `uppercase`, `capitalize`, `none` | `uppercase` | «BOOK NOW» vs «Book now» |

### Пример PATCH

```json
{
  "cta": {
    "variant": "outline",
    "size": "large",
    "label_case": "capitalize"
  }
}
```

Partial update внутри `cta`: при передаче объекта `cta` — **merge** на один уровень (как `background`), не deep-merge произвольной глубины.

### Валидация

| Код | Когда |
|-----|-------|
| `CTA_INVALID` | `cta` не объект |
| `CTA_VARIANT_INVALID` | неверный `variant` |
| `CTA_SIZE_INVALID` | неверный `size` |
| `CTA_LABEL_CASE_INVALID` | неверный `label_case` |

### Область применения на фронте

- Главная CTA бронирования (`.bs-cta`)
- Кнопки слотов (`.bs-slot`) — опционально тот же `variant`, меньший `size`
- `element_style` продолжает задавать только `border-radius`

---

## 3. Фон и атмосфера

### 3.1 Расширение `background`

Общие поля (для всех `type`, optional):

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `overlay_color` | string | `#000000` | Цвет оверлея поверх фона |
| `overlay_opacity` | number | `0` | `0.0` … `1.0` — затемнение для читаемости текста |

#### `type: solid`

```json
{
  "type": "solid",
  "color": "#0a0a0a",
  "overlay_color": "#000000",
  "overlay_opacity": 0
}
```

#### `type: gradient`

Без изменений + overlay-поля:

```json
{
  "type": "gradient",
  "gradient_from": "#0a0a0a",
  "gradient_to": "#1a1a2e",
  "gradient_angle": 180,
  "overlay_color": "#000000",
  "overlay_opacity": 0.2
}
```

#### `type: image`

```json
{
  "type": "image",
  "image_url": "https://.../pages/{pageId}/background/123.jpg",
  "position": "center",
  "overlay_color": "#000000",
  "overlay_opacity": 0.55
}
```

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `image_url` | string | — | Публичный URL в Storage |
| `position` | string | `center` | `center`, `top`, `bottom` — `background-position` |

**Удалить** поддержку `type: preset` → `400 BACKGROUND_TYPE_INVALID`.

### 3.2 `atmosphere`

Глобальные эффекты поверх страницы (не привязаны к типу фона).

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `grain` | boolean | `false` | Лёгкий noise-текстура |
| `grain_intensity` | number | `0.12` | `0.0` … `1.0`, только если `grain: true` |
| `card_style` | string | `solid` | `solid` — непрозрачные карточки; `glass` — полупрозрачные с blur |

### Валидация `background` / `atmosphere`

| Код | Когда |
|-----|-------|
| `BACKGROUND_INVALID` | не объект |
| `BACKGROUND_TYPE_INVALID` | type не в `solid` \| `gradient` \| `image` |
| `BACKGROUND_COLOR_INVALID` | невалидный hex |
| `BACKGROUND_GRADIENT_INVALID` | отсутствуют поля градиента |
| `BACKGROUND_IMAGE_URL_INVALID` | пустой или не URL |
| `BACKGROUND_OVERLAY_OPACITY_INVALID` | вне 0…1 |
| `BACKGROUND_POSITION_INVALID` | неверный `position` |
| `ATMOSPHERE_INVALID` | не объект |
| `ATMOSPHERE_GRAIN_INTENSITY_INVALID` | вне 0…1 |
| `ATMOSPHERE_CARD_STYLE_INVALID` | не `solid` \| `glass` |

---

## 4. Upload фона страницы

Новый эндпоинт по аналогии с avatar.

### `POST /pages/:id/background`

| | |
|--|--|
| Auth | Bearer, владелец страницы |
| Content-Type | `multipart/form-data` |
| Поле | `background` (file) |
| Форматы | JPEG, PNG, WebP |
| Max size | **10 MB** |
| Storage path | `pages/{pageId}/background/{timestamp}-{uuid}.{ext}` |

#### Ответ 200

```json
{
  "success": true,
  "message": "Background image uploaded successfully",
  "data": {
    "image_url": "https://.../files/pages/.../background/....jpg",
    "theme": { "...": "полный актуальный theme с background.type=image" }
  }
}
```

Поведение:

1. Загрузить файл в Storage.
2. Удалить предыдущий background-файл этой страницы (если был `type: image`).
3. Обновить `page_themes.background`:
   - `type: image`
   - `image_url` — новый URL
   - сохранить `overlay_*`, `position` если были; иначе дефолты (`overlay_opacity: 0.5` для image — рекомендация UI).

### `DELETE /pages/:id/background`

Удалить файл из Storage, сбросить `background` на дефолт:

```json
{ "type": "solid", "color": "#0a0a0a", "overlay_color": "#000000", "overlay_opacity": 0 }
```

Ответ — актуальный `theme`.

---

## Эндпоинты (без изменений URL)

| Метод | Путь | Изменения |
|-------|------|-----------|
| GET | `/pages/:id/theme` | Расширенный `theme` |
| PATCH | `/pages/:id/theme` | Принимает новые поля |
| GET | `/pages/:id` | `settings.theme` — та же схема |
| GET | `/public/pages/:slug` | `settings.theme` — **полная** схема (публичный рендер) |
| POST | `/pages/:id/background` | **новый** |
| DELETE | `/pages/:id/background` | **новый** |

`PATCH /pages/:id` с `settings.theme` — поддержать ту же схему (full replace части theme).

---

## PATCH — примеры

### Бренд-цвета

```json
{
  "secondary_color": "#f472b6",
  "surface_color": "#141414",
  "text_muted_color": "#6a6a6a"
}
```

### CTA + atmosphere

```json
{
  "cta": { "variant": "outline", "size": "large" },
  "atmosphere": { "grain": true, "grain_intensity": 0.08, "card_style": "glass" }
}
```

### Image background с overlay

```json
{
  "background": {
    "type": "image",
    "image_url": "https://.../background.jpg",
    "position": "center",
    "overlay_color": "#0a0a0a",
    "overlay_opacity": 0.6
  }
}
```

---

## GET — пример ответа

```json
{
  "success": true,
  "message": "Theme retrieved successfully",
  "data": {
    "theme": {
      "accent_color": "#c6f432",
      "secondary_color": "#3dd6b0",
      "surface_color": "#1a1a1a",
      "text_color": "#ffffff",
      "text_muted_color": "#8a8a8a",
      "mode": "dark",
      "font_preset": "sport",
      "element_style": "pill",
      "cta": {
        "variant": "solid",
        "size": "default",
        "label_case": "uppercase"
      },
      "atmosphere": {
        "grain": false,
        "grain_intensity": 0.12,
        "card_style": "solid"
      },
      "background": {
        "type": "solid",
        "color": "#0a0a0a",
        "overlay_color": "#000000",
        "overlay_opacity": 0
      }
    }
  }
}
```

---

## UI → API (обновлённая таблица)

| Секция в билдере | Поле API |
|------------------|----------|
| Accent color | `accent_color` |
| Secondary color | `secondary_color` |
| Card / surface color | `surface_color` |
| Text colors | `text_color`, `text_muted_color` |
| Color mode | `mode` |
| Font | `font_preset` |
| Element corners | `element_style` |
| CTA style | `cta` |
| Page background | `background` |
| Grain / glass cards | `atmosphere` |
| Background upload | `POST /pages/:id/background` |

---

## Маппинг на CSS (для фронта, справочно)

Бэкенд **не** считает CSS. Фронт (`page-renderer`) мапит:

| API | CSS variable |
|-----|----------------|
| `accent_color` | `--lime` |
| `secondary_color` | `--accent-secondary` (новая) |
| `surface_color` | `--surface` |
| `text_color` | `--text` |
| `text_muted_color` | `--muted` |
| `cta.*` | классы / vars `--cta-*` |
| `atmosphere.card_style` | `data-card-style="glass"` |
| `background` + overlay | слои на `.bs` |

---

## Чеклист реализации бэкенда

- [ ] Миграция `017`: колонки brand + `cta` + `atmosphere` JSONB
- [ ] Обновить entity/DTO `ThemeSettings`
- [ ] Валидация новых полей + коды ошибок
- [ ] Defaults при создании страницы
- [ ] `PATCH /pages/:id/theme` partial merge для `cta`, `atmosphere`, `background`
- [ ] Deprecate `background.type: preset` (400 на write, migrate на read)
- [ ] `POST/DELETE /pages/:id/background`
- [ ] Прокинуть в `GET /public/pages/:slug`
- [ ] Обновить [pages_theme_api.md](./pages_theme_api.md) и Postman-коллекцию
- [ ] Обновить [frontend_theme_integration.md](./frontend_theme_integration.md)

## Чеклист фронта (после бэкенда)

- [ ] Типы `ThemeSettings` + `mapFromApi` / `mapToApi`
- [ ] UI: Brand colors, CTA, Atmosphere в Theme tab
- [ ] `page-renderer`: CSS variables, overlay, grain, glass
- [ ] Style presets: разворачивать новые поля в PATCH
- [ ] Background upload в `ThemeBackgroundCard`

---

## Версионирование

Рекомендуется не вводить `/v2/` URL. Обратная совместимость:

- Старый фронт игнорирует новые поля в GET.
- Новый фронт на старом бэкенде: fallback на дефолты для отсутствующих полей.
- Optional: заголовок `X-Theme-Schema: 2` в ответе GET theme (не обязательно в MVP).

---

## Вне скоупа (не делать в этом ТЗ)

- Style preset id в API
- Per-mode набор цветов (`colors_light` / `colors_dark`) — отложить
- Custom CSS
- Контрастность / WCAG-валидация на бэкенде
- Отдельные стили для slot-кнопок vs main CTA
