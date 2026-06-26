# Frontend: Theme API (v2)

Контракт: [pages_theme_api.md](./pages_theme_api.md) · ТЗ: [pages_theme_extension.md](./pages_theme_extension.md)

---

## TypeScript типы

```typescript
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ElementStyle = 'rounded' | 'sharp' | 'pill'
export type CtaVariant = 'solid' | 'outline' | 'ghost'
export type CtaSize = 'compact' | 'default' | 'large'
export type CtaLabelCase = 'uppercase' | 'capitalize' | 'none'
export type BackgroundPosition = 'center' | 'top' | 'bottom'
export type CardStyle = 'solid' | 'glass'

export type ThemeCta = {
  variant: CtaVariant
  size: CtaSize
  label_case: CtaLabelCase
}

export type ThemeAtmosphere = {
  grain: boolean
  grain_intensity: number
  card_style: CardStyle
}

export type ThemeBackgroundSolid = {
  type: 'solid'
  color: string
  overlay_color: string
  overlay_opacity: number
}

export type ThemeBackgroundGradient = {
  type: 'gradient'
  gradient_from: string
  gradient_to: string
  gradient_angle: number
  overlay_color: string
  overlay_opacity: number
}

export type ThemeBackgroundImage = {
  type: 'image'
  image_url: string
  position: BackgroundPosition
  overlay_color: string
  overlay_opacity: number
}

export type ThemeBackground =
  | ThemeBackgroundSolid
  | ThemeBackgroundGradient
  | ThemeBackgroundImage

export type ThemeSettings = {
  accent_color: string
  secondary_color: string
  surface_color: string
  text_color: string
  text_muted_color: string
  mode: ThemeMode
  font_preset: string
  element_style: ElementStyle
  cta: ThemeCta
  atmosphere: ThemeAtmosphere
  background: ThemeBackground
}
```

---

## API client

```typescript
export async function getPageTheme(pageId: string) {
  return apiRequest<{ theme: ThemeSettings }>(`/pages/${pageId}/theme`)
}

export type ThemePatch = Partial<{
  accent_color: string
  secondary_color: string
  surface_color: string
  text_color: string
  text_muted_color: string
  mode: ThemeMode
  font_preset: string
  element_style: ElementStyle
  cta: Partial<ThemeCta>
  atmosphere: Partial<ThemeAtmosphere>
  background: Partial<ThemeBackground>
}>

export async function patchPageTheme(pageId: string, body: ThemePatch) {
  return apiRequest<{ theme: ThemeSettings }>(`/pages/${pageId}/theme`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function uploadPageBackground(pageId: string, file: File) {
  const formData = new FormData()
  formData.append('background', file)
  return apiRequest<{ image_url: string; theme: ThemeSettings }>(
    `/pages/${pageId}/background`,
    { method: 'POST', body: formData }
  )
}

export async function deletePageBackground(pageId: string) {
  return apiRequest<{ theme: ThemeSettings }>(`/pages/${pageId}/background`, {
    method: 'DELETE'
  })
}
```

---

## UI mapping

| Секция билдера | API |
|----------------|-----|
| Accent | `accent_color` |
| Secondary | `secondary_color` |
| Surface / cards | `surface_color` |
| Text | `text_color`, `text_muted_color` |
| Color mode | `mode` |
| Font | `font_preset` |
| Corners | `element_style` |
| CTA style | `cta` |
| Background | `background` |
| Grain / glass | `atmosphere` |
| Background file | `POST /pages/:id/background` |

Style presets на фронте → развёрнутый `PATCH /theme` со всеми полями.

---

## CSS variables (page-renderer)

| API | CSS variable |
|-----|----------------|
| `accent_color` | `--lime` |
| `secondary_color` | `--accent-secondary` |
| `surface_color` | `--surface` |
| `text_color` | `--text` |
| `text_muted_color` | `--muted` |
| `atmosphere.card_style` | `data-card-style="glass"` |

---

## Fallback на старом бэкенде

Если поля отсутствуют в GET — подставлять дефолты из [pages_theme_extension.md](./pages_theme_extension.md).
