# Page theme API (v2)

Управление блоком **Theme**: бренд-цвета, CTA, фон, атмосфера.

Данные в `page_themes` → `settings.theme` при `GET /pages/:id` и `GET /public/pages/:slug`.

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Полное ТЗ: [pages_theme_extension.md](./pages_theme_extension.md)

---

## Эндпоинты

| Метод | Путь | Auth |
|-------|------|------|
| GET | `/pages/:id/theme` | Bearer, владелец |
| PATCH | `/pages/:id/theme` | Bearer, владелец |
| POST | `/pages/:id/background` | Bearer, multipart `background` |
| DELETE | `/pages/:id/background` | Bearer, владелец |
| POST | `/pages/:id/theme/ai-style` | Bearer, multipart `brand` — AI: генерирует и **сохраняет** dark + light в БД |
| GET | `/pages/:id/theme/ai-styles` | Bearer — список сохранённых AI-стилей |
| POST | `/pages/:id/theme/ai-style/apply` | Bearer — применить `style_id` к `page_themes` |

Подробно: [pages_theme_ai_style_api.md](./pages_theme_ai_style_api.md)

`settings.theme` в `GET /pages/:id` и `GET /public/pages/:slug` — та же схема.

---

## `ThemeSettings`

```json
{
  "accent_color": "#c6f432",
  "secondary_color": "#b4dd2f",
  "surface_color": "#1a1a1a",
  "text_color": "#ffffff",
  "text_muted_color": "#8a8a8a",
  "font_preset": "sport",
  "element_style": "rounded",
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
    "type": "solid",
    "color": "#0a0a0a",
    "overlay_color": "#000000",
    "overlay_opacity": 0
  }
}
```

### Бренд-цвета

| Поле | Формат |
|------|--------|
| `accent_color`, `secondary_color`, `surface_color` | `#RRGGBB` |
| `text_color`, `text_muted_color` | `#RRGGBB` |

### `cta`

| Поле | Значения |
|------|----------|
| `variant` | `solid`, `outline`, `ghost` |
| `size` | `compact`, `default`, `large` |
| `label_case` | `uppercase`, `capitalize`, `none` |

PATCH `cta` — shallow merge.

### `atmosphere`

| Поле | Тип | Значения |
|------|-----|----------|
| `grain` | boolean | |
| `grain_intensity` | number | `0` … `1` |

### `background`

| `type` | Поля |
|--------|------|
| `solid` | `color`, `overlay_color`, `overlay_opacity` |
| `gradient` | `gradient_from`, `gradient_to`, `gradient_angle`, overlay |
| `image` | `image_url`, `position` (`center`/`top`/`bottom`), overlay |

`background.type: preset` — **deprecated** (400 на write, migrate в `solid` на read).

PATCH `background` — merge с текущим значением, затем валидация.

---

## POST /pages/:id/background

`multipart/form-data`, поле `background` — JPEG/PNG/WebP, max **10 MB**.

Ответ:

```json
{
  "success": true,
  "data": {
    "image_url": "https://.../pages/{id}/background/....jpg",
    "theme": { }
  }
}
```

## DELETE /pages/:id/background

Удаляет файл из Storage, сбрасывает `background` на solid `#0a0a0a`.

---

## Defaults (новая страница)

См. [pages_theme_extension.md](./pages_theme_extension.md#defaults-новая-страница).

---

## Интеграция фронта

[frontend_theme_integration.md](./frontend_theme_integration.md)
