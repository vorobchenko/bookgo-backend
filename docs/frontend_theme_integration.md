# Frontend: Theme API

Интеграция блока **Theme** (`bookgo-app` → `bookgo-backend`).

Контракт: [pages_theme_api.md](./pages_theme_api.md)

---

## TypeScript типы

```typescript
export type ThemePreset = 'neon' | 'pastel' | 'bold'
export type ThemeMode = 'light' | 'dark' | 'auto'
export type FontPreset = 'neutral' | 'sport' | 'editorial'
export type ElementStyle = 'rounded' | 'sharp' | 'pill'

export type ThemeBackgroundPreset = { type: 'preset' }
export type ThemeBackgroundSolid = { type: 'solid'; color: string }
export type ThemeBackgroundGradient = {
  type: 'gradient'
  gradient_from: string
  gradient_to: string
  gradient_angle: number
}
export type ThemeBackgroundImage = { type: 'image'; image_url: string }

export type ThemeBackground =
  | ThemeBackgroundPreset
  | ThemeBackgroundSolid
  | ThemeBackgroundGradient
  | ThemeBackgroundImage

export type ThemeSettings = {
  preset: ThemePreset
  accent_color: string
  mode: ThemeMode
  font_preset: FontPreset
  element_style: ElementStyle
  background: ThemeBackground
}

export type ThemeResponse = {
  theme: ThemeSettings
}
```

---

## API client

```typescript
export async function getPageTheme(pageId: string) {
  return apiRequest<ThemeResponse>(`/pages/${pageId}/theme`)
}

export type ThemePatch = Partial<ThemeSettings>

export async function patchPageTheme(pageId: string, body: ThemePatch) {
  return apiRequest<ThemeResponse>(`/pages/${pageId}/theme`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}
```

---

## UI mapping

| UI control | API field | Notes |
|------------|-----------|-------|
| Neon / Pastel / Bold | `preset` | |
| Color picker | `accent_color` | `#RRGGBB` |
| Light / Dark / System | `mode` | `auto` = system |
| Font: Neutral / Sport / Editorial | `font_preset` | |
| Corners: Rounded / Sharp / Pill | `element_style` | Кнопки, инпуты, карточки |
| Background: From preset | `background: { type: 'preset' }` | |
| Background: Solid | `background: { type: 'solid', color }` | |
| Background: Gradient | `background: { type: 'gradient', ... }` | |
| Background: Image | `background: { type: 'image', image_url }` | Upload — позже |

---

## Рендер на публичной странице

`GET /public/pages/:slug` возвращает тот же `settings.theme`.

```typescript
function pageBackgroundCss(background: ThemeBackground): React.CSSProperties {
  switch (background.type) {
    case 'solid':
      return { backgroundColor: background.color }
    case 'gradient':
      return {
        background: `linear-gradient(${background.gradient_angle}deg, ${background.gradient_from}, ${background.gradient_to})`
      }
    case 'image':
      return {
        backgroundImage: `url(${background.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    default:
      return {} // preset — фон из theme.preset на фронте
  }
}
```

`element_style` — CSS variables или классы:

```typescript
const elementRadius: Record<ElementStyle, string> = {
  rounded: '12px',
  sharp: '0',
  pill: '9999px'
}
```

---

## Синхронизация с builder

1. При открытии Theme tab: `GET /pages/:id/theme` (или взять из `GET /pages/:id` → `settings.theme`).
2. При изменении одного поля: `PATCH /pages/:id/theme` с partial body.
3. Не отправлять camelCase — только **snake_case** (`font_preset`, `element_style`, `gradient_from`).

---

## Загрузка фона (позже)

Планируется `POST /pages/:id/background` (multipart), аналогично [pages_avatar_api.md](./pages_avatar_api.md).

До этого `type: 'image'` можно задать только с URL из Bookgo Storage.
