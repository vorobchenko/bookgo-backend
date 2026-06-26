# Page theme API

Управление блоком **Theme** в builder: accent, mode, шрифт, скругление элементов и фон страницы.

Данные в `page_themes` → `settings.theme` при `GET /pages/:id` и `GET /public/pages/:slug`.

**Альтернатива:** полная замена через `PATCH /pages/:id` с `settings.theme`.

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Все эндпоинты требуют `Authorization: Bearer <token>` и владение страницей.

---

## UI → API

| Секция в UI | Поле API | Эндпоинт |
|-------------|----------|----------|
| Accent color | `accent_color` | `PATCH /pages/:id/theme` |
| Light / dark | `mode` | `PATCH /pages/:id/theme` |
| Font | `font_preset` | `PATCH /pages/:id/theme` |
| Element corners (rounded / sharp / pill) | `element_style` | `PATCH /pages/:id/theme` |
| Background | `background` | `PATCH /pages/:id/theme` |

---

## Типы

### `ThemeSettings`

```json
{
  "accent_color": "#c6f432",
  "mode": "auto",
  "font_preset": "sport",
  "element_style": "rounded",
  "background": {
    "type": "gradient",
    "gradient_from": "#0a0a0a",
    "gradient_to": "#1a1a2e",
    "gradient_angle": 180
  }
}
```

| Поле | Тип | Значения | Описание |
|------|-----|----------|----------|
| `accent_color` | string | `#RRGGBB` | Акцент (кнопки, highlights) |
| `mode` | string | `light`, `dark`, `auto` | Цветовая схема |
| `font_preset` | string | произвольная строка | Идентификатор шрифта на фронте |
| `element_style` | string | `rounded`, `sharp`, `pill` | Скругление кнопок, карточек и др. UI-элементов |
| `background` | object | см. ниже | Фон страницы |

### `ThemeBackground`

| `type` | Поля | Описание |
|--------|------|----------|
| `preset` | — | Дефолтный фон на фронте |
| `solid` | `color` | Сплошной цвет `#RRGGBB` |
| `gradient` | `gradient_from`, `gradient_to`, `gradient_angle` | Линейный градиент, угол `0–360` |
| `image` | `image_url` | URL картинки в Supabase Storage (`pages/{pageId}/background/...`) |

**Загрузка фона:** `POST /pages/:id/background` — позже (сейчас только `image_url` после upload).

Примеры:

```json
{ "type": "preset" }
```

```json
{ "type": "solid", "color": "#0a0a0a" }
```

```json
{
  "type": "gradient",
  "gradient_from": "#0a0a0a",
  "gradient_to": "#1a1a2e",
  "gradient_angle": 180
}
```

```json
{
  "type": "image",
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/files/pages/PAGE_ID/background/123.jpg"
}
```

---

## GET /pages/:id/theme

### Ответ 200

```json
{
  "success": true,
  "message": "Theme retrieved successfully",
  "data": {
    "theme": {
      "accent_color": "#c6f432",
      "mode": "auto",
      "font_preset": "sport",
      "element_style": "rounded",
      "background": { "type": "preset" }
    }
  }
}
```

---

## PATCH /pages/:id/theme

Partial update — передаются только изменяемые поля.

### Пример: font + element style

```json
{
  "font_preset": "editorial",
  "element_style": "pill"
}
```

### Пример: gradient background

```json
{
  "background": {
    "type": "gradient",
    "gradient_from": "#111111",
    "gradient_to": "#222244",
    "gradient_angle": 135
  }
}
```

### Ответ 200

Тот же формат, что у GET — актуальный `theme` после сохранения.

### Ошибки 400

| Код | Когда |
|-----|-------|
| `BODY_INVALID` | Тело не JSON-объект |
| `BODY_EMPTY` | Ни одного поля |
| `ACCENT_COLOR_INVALID` | Не hex `#RRGGBB` |
| `MODE_INVALID` | Неверный `mode` |
| `FONT_PRESET_INVALID` | Пустой или слишком длинный `font_preset` |
| `ELEMENT_STYLE_INVALID` | Неверный `element_style` |
| `BACKGROUND_*` | Ошибки в объекте `background` |

---

## Defaults (новая страница)

```json
{
  "accent_color": "#c6f432",
  "mode": "auto",
  "font_preset": "sport",
  "element_style": "rounded",
  "background": { "type": "preset" }
}
```
