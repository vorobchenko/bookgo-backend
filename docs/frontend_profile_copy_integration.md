# Frontend Integration — Profile headline (hero)

Две строки заголовка на **карточке витрины**: «BOOK YOUR» / «NEXT SESSION».

Редактируются через **`settings.profile.headline_line1`** и **`settings.profile.headline_line2`** → `PATCH /pages/:id`.

См. также: [frontend_pages_integration.md](./frontend_pages_integration.md)

---

## Маппинг UI → `settings.profile`

```
┌─────────────────────────────────────────┐
│ [avatar]  Maksym Vorobchenko  ← name    │
│           Warsaw · CEO …      ← city, role │
│                                         │
│     BOOK YOUR                 ← headline_line1 │
│     NEXT SESSION              ← headline_line2 (accent) │
│                                         │
│  We develop mobile apps       ← bio     │
└─────────────────────────────────────────┘
```

| Поле API | Где на экране | По умолчанию |
|----------|---------------|--------------|
| `headline_line1` | Первая строка hero | `BOOK YOUR` |
| `headline_line2` | Вторая строка (accent) | `NEXT SESSION` |
| `name`, `role`, `city`, `bio` | остальной profile | см. builder |

`headline_line2` рендерится цветом `theme.accent_color`.

Тексты «TRAIN WITH», «Meet …», подпись About-ссылки — **не в API**, остаются на фронте (i18n / хардкод).

---

## TypeScript

```typescript
export type ProfileSettings = {
  name: string
  role: string
  bio: string
  city: string
  lang: 'en' | 'ru'
  avatar_url: string
  email: string
  phone: string
  headline_line1: string
  headline_line2: string
}
```

---

## Сохранение

```json
{
  "settings": {
    "profile": {
      "name": "Maksym Vorobchenko",
      "role": "CEO 'DodoTap'",
      "bio": "We develop mobile apps",
      "city": "Warsaw",
      "lang": "en",
      "headline_line1": "BOOK YOUR",
      "headline_line2": "NEXT SESSION"
    }
  }
}
```

При `PATCH` передавай **весь** объект `profile` или мержи с текущим стейтом.

---

## Рендер

```tsx
<h1>
  <span>{profile.headline_line1}</span>
  <span style={{ color: theme.accent_color }}>{profile.headline_line2}</span>
</h1>
```

---

## Ограничения

`headline_line1`, `headline_line2` — до **200** символов каждый.
