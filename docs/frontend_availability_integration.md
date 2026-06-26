# Frontend: Schedule / Availability API

Интеграция блока **Schedule** (`bookgo-app` → `bookgo-backend`).

Контракт: [pages_availability_api.md](./pages_availability_api.md)

---

## TypeScript типы

```typescript
export type AvailabilityRange = {
  id: string
  start: string // "09:00"
  end: string   // "17:00"
}

export type AvailabilityDay = {
  weekday: number // 0 Sun … 6 Sat
  label: string
  letter: string
  working: boolean
  bookable: boolean
  ranges: AvailabilityRange[]
}

export type AvailabilitySettings = {
  timezone: string
  buffer_before_minutes: number
  buffer_after_minutes: number
  min_notice_hours: number
  max_days_ahead: number
  days: AvailabilityDay[]
}

export type AvailabilityMeta = {
  working_days_count: number
  bookable_days_count: number
  has_bookable_hours: boolean
}

export type AvailabilityResponse = {
  availability: AvailabilitySettings
  meta: AvailabilityMeta
}
```

---

## API client

```typescript
export async function getPageAvailability(pageId: string) {
  return apiRequest<AvailabilityResponse>(`/pages/${pageId}/availability`)
}

export async function patchPageWeeklyHours(
  pageId: string,
  body: { timezone?: string; days: Array<Pick<AvailabilityDay, 'weekday' | 'working' | 'ranges'>> }
) {
  return apiRequest<AvailabilityResponse>(
    `/pages/${pageId}/availability/weekly-hours`,
    { method: 'PATCH', body: JSON.stringify(body) }
  )
}

export async function patchPageBookingDays(
  pageId: string,
  body: { days: Array<Pick<AvailabilityDay, 'weekday' | 'bookable'>> }
) {
  return apiRequest<AvailabilityResponse>(
    `/pages/${pageId}/availability/booking-days`,
    { method: 'PATCH', body: JSON.stringify(body) }
  )
}

export async function patchPageBookingRules(
  pageId: string,
  body: Partial<
    Pick<
      AvailabilitySettings,
      | 'buffer_before_minutes'
      | 'buffer_after_minutes'
      | 'min_notice_hours'
      | 'max_days_ahead'
    >
  >
) {
  return apiRequest<AvailabilityResponse>(
    `/pages/${pageId}/availability/booking-rules`,
    { method: 'PATCH', body: JSON.stringify(body) }
  )
}
```

---

## Сценарии UI

### Weekly hours

1. Пользователь меняет timezone или слоты дня
2. `PATCH .../weekly-hours` с изменёнными `days` (только затронутые `weekday`)
3. `setAvailability(data.availability)` в store

### Booking days

1. Toggle Sun–Sat
2. `PATCH .../booking-days` с `{ weekday, bookable }` для изменённых дней

### Booking rules

1. Debounce полей buffer / notice / book ahead
2. `PATCH .../booking-rules`

### Публикация

`meta.has_bookable_hours` совпадает с проверкой publish: нужен хотя бы один `bookable` день с `ranges.length > 0`.

---

## Не отправлять в PATCH

- `label`, `letter` — только в ответе GET, бэкенд игнорирует при записи

---

## Миграция с PATCH /pages/:id

Раньше: `PATCH /pages/:id` с `settings.availability`.

Теперь предпочтительно dedicated API — меньше payload, не затрагивает другие блоки.

`GET /pages/:id` по-прежнему возвращает `settings.availability` для полной загрузки builder.
