# Pages API

Base URL: same as auth (`/pages`, `/public/pages/:slug`).

Headers: `Authorization: Bearer <token>`, `Accept-Language: en|ru` (admin routes).

---

## GET /pages

List pages for the authenticated user.

**Response `data.pages[]`:** preview fields + `preview: { name, role, avatar_url }`. No full `settings`.

---

## POST /pages

**Body (optional):**

```json
{
  "slug": "my-coaching",
  "is_default": true
}
```

If `slug` omitted — generated from user name/email. First page is `is_default` automatically.

Creates: `pages`, `page_profiles` (from user), `page_themes`, `page_availability` (empty days).

---

## GET /pages/:id

Full page with assembled `settings` (`PageSettings`).

---

## PATCH /pages/:id

**Body:**

```json
{
  "slug": "new-slug",
  "settings": {
    "profile": { "name": "...", "lang": "en" },
    "services": { "use_categories": true, "categories": [], "services": [] },
    "availability": { "timezone": "Europe/Warsaw", "days": [] },
    "blocks": [],
    "faq": [],
    "theme": {
      "accent_color": "#c6f432",
      "secondary_color": "#3dd6b0",
      "surface_color": "#1a1a1a",
      "text_color": "#ffffff",
      "text_muted_color": "#8a8a8a",
      "mode": "auto",
      "font_preset": "sport",
      "element_style": "rounded",
      "cta": { "variant": "solid", "size": "default", "label_case": "uppercase" },
      "atmosphere": { "grain": false, "grain_intensity": 0.12, "card_style": "solid" },
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

Partial merge — only provided keys are updated.

When `settings.services` is sent, categories and items are **replaced** for that page.

For single-service operations (create, edit, delete, activate/deactivate), prefer dedicated routes:

**Full contract:** [pages_services_api.md](./pages_services_api.md)

---

## POST /pages/:id/avatar

Upload page profile photo (`multipart/form-data`, field `avatar`). Updates `settings.profile.avatar_url`.

**Full contract:** [pages_avatar_api.md](./pages_avatar_api.md)

---

## DELETE /pages/:id/avatar

Remove page profile photo from storage and clear `avatar_url`.

**Full contract:** [pages_avatar_api.md](./pages_avatar_api.md)

---

## POST /pages/:id/publish

Runs publish validation (name, language, active service, working hours). Returns `400` with `data.validation.errors` if invalid.

---

## POST /pages/:id/unpublish

Sets `published=false`, clears `published_at`.

---

## GET /public/pages/:slug

No auth. Only published pages. Same response shape as `GET /pages/:id`.

---

## Errors

| Status | When |
|--------|------|
| 400 | Invalid slug, email, language, avatar URL, publish validation failed |
| 404 | Page not found / not published (public) |
| 409 | Slug already taken |
