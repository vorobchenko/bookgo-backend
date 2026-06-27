# Page theme — AI Style (логотип → 2 пресета)

Генерация **двух готовых тем** (dark + light) по загруженному бренд-ассету (логотип, wordmark, иконка).

**После генерации оба стиля сразу сохраняются в БД** — как отдельные записи.  
Пользователь выбирает один → бэкенд копирует его в `page_themes` (активная тема страницы).

Связанные документы:

- Контракт theme v2: [pages_theme_api.md](./pages_theme_api.md)
- Upload (референс): [pages_avatar_api.md](./pages_avatar_api.md)
- Реестр `font_preset` на фронте: `bookgo-app` → `packages/page-renderer/src/lib/font-presets.ts`

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

---

## Обзор потока

```
1. POST /pages/:id/theme/ai-style          ← multipart: logo
   → AI анализирует изображение
   → INSERT 2 строки в page_ai_styles (dark + light)
   → ответ: style_id для каждого + полный theme
   → page_themes пока НЕ меняется

2. POST /pages/:id/theme/ai-style/apply    ← JSON: style_id
   → взять theme из сохранённой строки
   → записать в page_themes
   → пометить style как активный
```

Оба шага: **Bearer**, владелец страницы.

---

## Эндпоинты

| Метод | Путь | Назначение |
|-------|------|------------|
| `POST` | `/pages/:id/theme/ai-style` | Загрузить логотип, сгенерировать и **сохранить** 2 стиля |
| `GET` | `/pages/:id/theme/ai-styles` | Список сохранённых AI-стилей страницы |
| `POST` | `/pages/:id/theme/ai-style/apply` | Применить выбранный стиль к `page_themes` |

---

## POST /pages/:id/theme/ai-style

### Request

`Content-Type: multipart/form-data`

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `brand` | file | да | Логотип: **JPEG, PNG, WebP, SVG**, max **5 MB** |
| `hint` | string | нет | Подсказка для AI, max 200 символов |

### Поведение сервера

1. Проверить владельца страницы.
2. Валидировать файл. SVG — растеризовать перед vision, если нужно.
3. Сохранить файл в Storage: `pages/{pageId}/brand/{timestamp}-{uuid}.{ext}`
4. Вызвать AI-пайплайн → два `ThemeSettings` (dark + light).
5. Нормализовать и провалидировать оба theme (см. [AI pipeline](#ai-pipeline)).
6. **`INSERT` две строки** в `page_ai_styles` (одна `tone=dark`, одна `tone=light`, общий `batch_id`).
7. Вернуть оба стиля с их `style_id`.
8. **`page_themes` не трогать** — до шага apply активная тема страницы прежняя.

### Ответ 200

```json
{
  "success": true,
  "message": "AI styles generated and saved",
  "data": {
    "batch_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "source": {
      "image_url": "https://.../files/pages/{pageId}/brand/....png",
      "hint": "fitness coach"
    },
    "styles": [
      {
        "style_id": "11111111-1111-1111-1111-111111111111",
        "tone": "dark",
        "label": "Night brand",
        "description": "Bold contrast built from your logo colors",
        "confidence": 0.91,
        "is_active": false,
        "theme": {
          "accent_color": "#c6f432",
          "secondary_color": "#b4dd2f",
          "surface_color": "#161616",
          "text_color": "#ffffff",
          "text_muted_color": "#8a8a8a",
          "font_preset": "sport",
          "element_style": "pill",
          "cta": {
            "variant": "solid",
            "size": "default",
            "label_case": "uppercase"
          },
          "atmosphere": {
            "grain": false,
            "grain_intensity": 0.12
          },
          "background": {
            "type": "gradient",
            "gradient_from": "#0a0a0a",
            "gradient_to": "#141820",
            "gradient_angle": 160,
            "overlay_color": "#000000",
            "overlay_opacity": 0
          }
        }
      },
      {
        "style_id": "22222222-2222-2222-2222-222222222222",
        "tone": "light",
        "label": "Day brand",
        "description": "Clean light layout from your palette",
        "confidence": 0.88,
        "is_active": false,
        "theme": { }
      }
    ]
  }
}
```

| Поле | Описание |
|------|----------|
| `batch_id` | Связка пары dark+light из одной загрузки |
| `style_id` | PK строки в `page_ai_styles` — передаётся в apply |
| `is_active` | `true` если этот стиль сейчас в `page_themes` (после generate всегда `false`) |
| `theme` | Полный `ThemeSettings` v2 из БД |

---

## GET /pages/:id/theme/ai-styles

Список **всех сохранённых** AI-стилей страницы (история генераций), новые сверху.

### Ответ 200

```json
{
  "success": true,
  "data": {
    "styles": [
      {
        "style_id": "11111111-1111-1111-1111-111111111111",
        "batch_id": "a1b2c3d4-...",
        "tone": "dark",
        "label": "Night brand",
        "description": "...",
        "confidence": 0.91,
        "is_active": true,
        "source_image_url": "https://.../brand/....png",
        "created_at": "2026-06-26T21:00:00.000Z",
        "theme": { }
      }
    ]
  }
}
```

Фронт может восстановить UI выбора после перезагрузки билдера без повторной генерации.

---

## POST /pages/:id/theme/ai-style/apply

Копирует **уже сохранённый** AI-стиль в активную тему страницы.

### Request body

```json
{
  "style_id": "11111111-1111-1111-1111-111111111111"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `style_id` | UUID | да | `page_ai_styles.id` |

### Поведение сервера

1. `SELECT` из `page_ai_styles` WHERE `id = style_id` AND `page_id = :id`.
2. Взять `theme` JSONB из строки.
3. Повторная полная валидация theme v2.
4. **Replace** полей в `page_themes` snapshot'ом из строки.
5. Сбросить `is_active = false` у всех AI-стилей этой страницы.
6. Установить `is_active = true` у выбранной строки, `applied_at = now()`.
7. Вернуть актуальный `theme` страницы.

### Ответ 200

```json
{
  "success": true,
  "message": "AI style applied",
  "data": {
    "style_id": "11111111-1111-1111-1111-111111111111",
    "theme": { }
  }
}
```

Повторный apply другого `style_id` той же страницы — **разрешён** (переключение dark ↔ light или старая генерация).

---

## Хранение в БД (`page_ai_styles`)

Каждый сгенерированный стиль — **отдельная постоянная строка**. TTL и временный кэш **не используются**.

### Миграция

```sql
CREATE TABLE page_ai_styles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id          uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  batch_id         uuid NOT NULL,
  tone             varchar(8) NOT NULL CHECK (tone IN ('dark', 'light')),
  label            varchar(80) NOT NULL,
  description      varchar(200) NOT NULL,
  confidence       real,
  source_image_url text NOT NULL,
  hint             text,
  theme            jsonb NOT NULL,
  is_active        boolean NOT NULL DEFAULT false,
  applied_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX page_ai_styles_page_id_created_at_idx
  ON page_ai_styles (page_id, created_at DESC);

CREATE INDEX page_ai_styles_batch_id_idx
  ON page_ai_styles (batch_id);

-- не больше одного активного AI-стиля на страницу
CREATE UNIQUE INDEX page_ai_styles_one_active_per_page_idx
  ON page_ai_styles (page_id)
  WHERE is_active = true;
```

### Семантика

| Колонка | Описание |
|---------|----------|
| `id` | `style_id` в API |
| `batch_id` | Одна загрузка логотипа → 2 строки с одним `batch_id` |
| `tone` | `dark` \| `light` |
| `theme` | Полный snapshot `ThemeSettings` |
| `is_active` | Этот стиль сейчас скопирован в `page_themes` |
| `applied_at` | Когда последний раз применяли к странице |

### Повторная генерация

Новый `POST ai-style` добавляет **ещё 2 строки** (новый `batch_id`). Старые стили **остаются** в БД и доступны через `GET .../ai-styles`.

Опциональный cleanup (cron): удалять неактивные стили старше N дней, если нужен лимит хранения.

---

## AI pipeline

Бэкенд не отдаёт сырой ответ модели на фронт.

1. **Vision** — палитра + mood из логотипа.
2. **Theme builder** — два `ThemeSettings` (dark/light), accent общий, меняются surface/background/text.
3. **`secondary_color`** = ~90% `accent_color` (как на фронте).
4. **`font_preset`** — whitelist из реестра фронта (18 шрифтов).
5. **Post-validation** — hex, contrast, theme v2 rules.

Подробности полей — без изменений к [pages_theme_api.md](./pages_theme_api.md).

---

## Ошибки

| HTTP | Ключ | Когда |
|------|------|--------|
| `400` | `BRAND_FILE_INVALID` | Файл невалиден |
| `400` | `HINT_TOO_LONG` | `hint` > 200 |
| `400` | `STYLE_ID_INVALID` | Нет строки или чужой `page_id` |
| `422` | `AI_STYLE_FAILED` | AI не смог обработать изображение |
| `429` | `AI_STYLE_RATE_LIMIT` | Лимит генераций |
| `503` | `AI_PROVIDER_UNAVAILABLE` | Timeout AI |

Убраны: `GENERATION_EXPIRED`, `GENERATION_ALREADY_APPLIED` — стили не протухают.

---

## Интеграция фронта

```typescript
// 1. Generate + save to DB
const formData = new FormData()
formData.append('brand', logoFile)

const { batch_id, styles } = await apiRequest<AiStyleGenerateResponse>(
  `/pages/${pageId}/theme/ai-style`,
  { method: 'POST', body: formData },
).then((r) => r.data)

// UI: preview styles[0] and styles[1]

// 2. Apply chosen style_id → page_themes
await apiRequest(`/pages/${pageId}/theme/ai-style/apply`, {
  method: 'POST',
  body: JSON.stringify({ style_id: styles[0].style_id }),
})

// 3. Later: reload list
const saved = await apiRequest(`/pages/${pageId}/theme/ai-styles`)
```

---

## Чеклист бэкенда

- [ ] Миграция `page_ai_styles`
- [ ] `POST /theme/ai-style` — AI + **2× INSERT**
- [ ] `GET /theme/ai-styles`
- [ ] `POST /theme/ai-style/apply` — copy `theme` → `page_themes`
- [ ] Storage `pages/{id}/brand/`
- [ ] AI adapter + theme builder + `secondaryFromAccent`
- [ ] Reuse `page-theme-validation.js`
- [ ] Rate limit + locales

---

## Вне скоупа MVP

- Авто-apply dark сразу после generate
- Удаление отдельных AI-стилей пользователем
- Больше 2 вариантов за одну генерацию
