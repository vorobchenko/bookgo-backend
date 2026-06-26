# Frontend: Slots API

Интеграция шага **выбор времени** (`bookgo-frontend` → `bookgo-backend`).

Контракт: [pages_slots_api.md](./pages_slots_api.md)

Заменяет `generateAvailability()` из `src/data.ts` — типы и UI остаются теми же.

---

## TypeScript типы

```typescript
export type Slot = {
  start: string
  label: string
  available: boolean
}

export type DayAvailability = {
  date: string
  weekday: string
  day_num: number
  month: string
  has_free: boolean
  times: string[]
  slots: Slot[]
}

export type PageSlotsResponse = {
  timezone: string
  service_id: string
  duration_minutes: number
  slot_interval_minutes: number
  min_notice_hours: number
  max_days_ahead: number
  from: string
  to: string
  days: DayAvailability[]
}
```

`times` — только доступные метки (`HH:mm`), удобно для простого рендера.  
`slots` — полный список с `available` для зачёркнутых занятых слотов (когда появятся bookings).

---

## API client

```typescript
export async function getPublicPageSlots(
  slug: string,
  params: { service_id: string; from?: string; to?: string }
) {
  const query = new URLSearchParams({ service_id: params.service_id })
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)

  return apiRequest<PageSlotsResponse>(
    `/public/pages/${slug}/slots?${query.toString()}`
  )
}
```

---

## Подключение в BookingPage

```typescript
// было:
const days = useMemo(
  () => (service ? generateAvailability(service) : []),
  [service],
)

// станет:
const [days, setDays] = useState<DayAvailability[]>([])

useEffect(() => {
  if (!service) {
    setDays([])
    return
  }
  getPublicPageSlots(pageSlug, { service_id: service.id })
    .then((data) => setDays(data.days))
    .catch(console.error)
}, [service, pageSlug])
```

Маппинг snake_case → camelCase не нужен, если типы обновить на `day_num` / `has_free` (как в API).

Либо тонкий адаптер:

```typescript
function mapDay(day: DayAvailability) {
  return {
    ...day,
    dayNum: day.day_num,
    hasFree: day.has_free,
  }
}
```

---

## UI mapping (BookingPage)

| UI | Поле API |
|----|----------|
| Day strip chip | `weekday`, `day_num`, `month` |
| Disabled day | `has_free === false` |
| Slot button label | `slot.label` |
| Slot selected | `slot.start` |
| Unavailable slot | `available === false` |
| Empty day message | `slots.length === 0` → «REST DAY» |
| Summary line | `slot.start.slice(0, 10)` + `slot.label` |

---

## Отличия от mock

| Mock | API |
|------|-----|
| Шаг = `durationMinutes` | Шаг = `slot_interval_minutes`, длительность услуги влияет на последний слот дня |
| Фиксированные часы 08–19 | Часы из `availability.days[].ranges` |
| Случайный `available` | `min_notice_hours` + в будущем bookings |
| 14 дней hardcoded | По умолчанию весь горизонт `max_days_ahead` (можно сузить через `to`) |

---

## Builder preview

Для превью в админке:

```
GET /pages/:pageId/slots?service_id=...
Authorization: Bearer <token>
```

Тот же формат ответа.
