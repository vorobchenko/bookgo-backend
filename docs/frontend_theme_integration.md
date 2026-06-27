# Frontend: Theme API (v2)

Контракт: [pages_theme_api.md](./pages_theme_api.md) · ТЗ: [pages_theme_extension.md](./pages_theme_extension.md)

---

## TypeScript типы

```typescript
export type ElementStyle = 'rounded' | 'sharp' | 'pill'
export type CtaVariant = 'solid' | 'outline' | 'ghost'
export type CtaSize = 'compact' | 'default' | 'large'
export type CtaLabelCase = 'uppercase' | 'capitalize' | 'none'
export type BackgroundPosition = 'center' | 'top' | 'bottom'

export type ThemeCta = {
  variant: CtaVariant
  size: CtaSize
  label_case: CtaLabelCase
}

export type ThemeAtmosphere = {
  grain: boolean
  grain_intensity: number
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
| Font | `font_preset` |
| Corners | `element_style` |
| CTA style | `cta` |
| Background | `background` |
| Grain | `atmosphere` |
| Background file | `POST /pages/:id/background` |

Style presets на фронте → развёрнутый `PATCH /theme` со всеми полями. `secondary_color` в пресете = ~90% `accent_color` (та же гамма, лёгкий light/dark shift).

### Style presets (фронт, `STYLE_PRESETS`)

| Preset | `accent_color` | `secondary_color` |
|--------|----------------|-------------------|
| Volt | `#c6f432` | `#b4dd2f` |
| Aurora | `#a78bfa` | `#987fe3` |
| Ember | `#f5a623` | `#de9721` |
| Ocean | `#60a5fa` | `#5896e3` |
| Forest | `#4ade80` | `#44c975` |
| Ruby | `#f43f5e` | `#dd3a56` |
| Cloud | `#3dd6b0` | `#39c2a0` |
| Sakura | `#f472b6` | `#dd68a5` |
| Pearl | `#c9a227` | `#b79325` |

---

## CSS variables (page-renderer)

| API | CSS variable |
|-----|----------------|
| `accent_color` | `--lime` |
| `secondary_color` | `--accent-secondary` |
| `surface_color` | `--surface` |
| `text_color` | `--text` |
| `text_muted_color` | `--muted` |

---

## Fallback на старом бэкенде

Если поля отсутствуют в GET — подставлять дефолты из [pages_theme_extension.md](./pages_theme_extension.md).
