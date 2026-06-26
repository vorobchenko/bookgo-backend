# Page availability API (Schedule)

Управление блоком **Schedule** в builder: рабочие часы, дни для бронирования, правила бронирования.

Данные в `page_availability` → `settings.availability` при `GET /pages/:id`.

**Альтернатива:** полная замена через `PATCH /pages/:id` с `settings.availability`.

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Все эндпоинты требуют `Authorization: Bearer <token>` и владение страницей.

---

## UI → API

| Секция в UI | Эндпоинт |
|-------------|----------|
| Weekly hours + timezone | `PATCH /pages/:id/availability/weekly-hours` |
| Booking days | `PATCH /pages/:id/availability/booking-days` |
| Booking rules | `PATCH /pages/:id/availability/booking-rules` |
| Всё сразу | `PATCH /pages/:id/availability` |

---

## Типы

### `AvailabilityDay`

| Поле | Тип | Описание |
|------|-----|----------|
| `weekday` | integer | `0` = Sunday … `6` = Saturday |
| `label` | string | Только в ответе (не хранится в БД) |
| `letter` | string | Только в ответе |
| `working` | boolean | Есть рабочие часы в этот день |
| `bookable` | boolean | Клиент может бронировать в этот день |
| `ranges` | array | Интервалы `{ id, start, end }`, время `HH:MM` |

`working` и `bookable` независимы: можно работать в субботу, но не принимать брони.

### `AvailabilitySettings`

```json
{
  "timezone": "Europe/Warsaw",
  "buffer_before_minutes": 0,
  "buffer_after_minutes": 15,
  "min_notice_hours": 4,
  "max_days_ahead": 60,
  "days": [ /* AvailabilityDay[] — всегда 7 дней */ ]
}
```

### `AvailabilityMeta`

| Поле | Тип | Описание |
|------|-----|----------|
| `working_days_count` | integer | Дней с `working: true` |
| `bookable_days_count` | integer | Дней с `bookable: true` |
| `has_bookable_hours` | boolean | Есть ли день с `bookable` и хотя бы одним `range` |

---

## GET /pages/:id/availability

### Ответ 200

```json
{
  "success": true,
  "message": "Расписание успешно получено",
  "data": {
    "availability": {
      "timezone": "UTC",
      "buffer_before_minutes": 0,
      "buffer_after_minutes": 15,
      "min_notice_hours": 4,
      "max_days_ahead": 60,
      "days": [
        {
          "weekday": 0,
          "label": "Sunday",
          "letter": "S",
          "working": false,
          "bookable": false,
          "ranges": []
        },
        {
          "weekday": 1,
          "label": "Monday",
          "letter": "M",
          "working": true,
          "bookable": true,
          "ranges": [{ "id": "rng-1", "start": "09:00", "end": "17:00" }]
        }
      ]
    },
    "meta": {
      "working_days_count": 5,
      "bookable_days_count": 5,
      "has_bookable_hours": true
    }
  }
}
```

---

## PATCH /pages/:id/availability

Частичное обновление любых полей. Если передан `days`, массив **заменяет** сохранённые дни целиком (после нормализации).

### Тело

Любое подмножество полей `AvailabilitySettings`.

---

## PATCH /pages/:id/availability/weekly-hours

Секция **Weekly hours** + timezone.

### Тело

```json
{
  "timezone": "Europe/Warsaw",
  "days": [
    {
      "weekday": 1,
      "working": true,
      "ranges": [{ "id": "rng-1", "start": "09:00", "end": "17:00" }]
    },
    {
      "weekday": 6,
      "working": false,
      "ranges": []
    }
  ]
}
```

- `days` обязателен, не пустой
- Обновляет только переданные `weekday`; `bookable` у существующих дней сохраняется
- `timezone` опционален

---

## PATCH /pages/:id/availability/booking-days

Секция **Booking days** (переключатели Sun–Sat).

### Тело

```json
{
  "days": [
    { "weekday": 0, "bookable": false },
    { "weekday": 1, "bookable": true },
    { "weekday": 6, "bookable": false }
  ]
}
```

- Обновляет только `bookable` для указанных дней
- `working` и `ranges` не меняются

---

## PATCH /pages/:id/availability/booking-rules

Секция **Booking rules**.

### Тело

```json
{
  "buffer_before_minutes": 0,
  "buffer_after_minutes": 15,
  "min_notice_hours": 4,
  "max_days_ahead": 60
}
```

Хотя бы одно поле обязательно.

---

## Ответ мутаций

Все `PATCH` возвращают:

```json
{
  "success": true,
  "message": "...",
  "data": {
    "availability": { },
    "meta": { }
  }
}
```

Обновляй стейт builder из `data.availability`.

---

## Ошибки валидации (400)

| code | Причина |
|------|---------|
| `WEEKDAY_INVALID` | weekday не 0–6 |
| `RANGE_TIME_INVALID` | время не `HH:MM` |
| `RANGE_ORDER_INVALID` | start ≥ end |
| `DAYS_REQUIRED` | пустой или отсутствующий `days` |
| `BODY_EMPTY` | нет полей для обновления |

---

**→ [frontend_availability_integration.md](./frontend_availability_integration.md)** — TypeScript, API client, сценарии UI.
