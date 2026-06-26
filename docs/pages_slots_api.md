# Page slots API

Вычисляемые **слоты для бронирования** по расписанию страницы, правилам booking rules и длительности услуги.

Используется публичным booking UI (`bookgo-frontend`) вместо клиентского `generateAvailability()`.

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

---

## Эндпоинты

| Аудитория | Метод | Путь |
|-----------|-------|------|
| Публичная витрина | GET | `/public/pages/:slug/slots` |
| Builder (preview) | GET | `/pages/:id/slots` |

Публичный эндпоинт — без auth, только `published=true`.  
Авторизованный — владелец страницы, `Authorization: Bearer <token>`.

---

## Query params

| Параметр | Обязателен | Описание |
|----------|------------|----------|
| `service_id` | да | UUID активной услуги на странице |
| `from` | нет | Начало диапазона, `YYYY-MM-DD` (по умолчанию — сегодня в `timezone` страницы) |
| `to` | нет | Конец диапазона, `YYYY-MM-DD` (по умолчанию — сегодня + `max_days_ahead`) |

Пример:

```
GET /public/pages/max-volkov/slots?service_id=8b2f4c2e-1a3b-4c5d-9e0f-123456789abc
GET /public/pages/max-volkov/slots?service_id=...&from=2026-06-26&to=2026-07-09
```

---

## Логика генерации

1. Берётся weekly schedule из `page_availability.days` (рабочие дни + `ranges`).
2. Шаг сетки — `slot_interval_minutes` (например 15 → 16:30, 16:45, 17:00).
3. Слот допустим, если `start + duration_minutes` услуги помещается в `range.end`.
4. Отсекаются слоты раньше `now + min_notice_hours` (в timezone страницы).
5. Горизонт ограничен `max_days_ahead` от сегодня.
6. Пока нет таблицы `bookings` — все подходящие слоты `available: true`. `times` = только доступные метки времени.

---

## Ответ 200

```json
{
  "success": true,
  "message": "Slots retrieved successfully",
  "data": {
    "timezone": "Europe/Warsaw",
    "service_id": "8b2f4c2e-1a3b-4c5d-9e0f-123456789abc",
    "duration_minutes": 60,
    "slot_interval_minutes": 15,
    "min_notice_hours": 4,
    "max_days_ahead": 60,
    "from": "2026-06-26",
    "to": "2026-07-09",
    "days": [
      {
        "date": "2026-06-26",
        "weekday": "Thu",
        "day_num": 26,
        "month": "Jun",
        "has_free": true,
        "times": ["16:30", "16:45", "17:00"],
        "slots": [
          {
            "start": "2026-06-26T16:30:00",
            "label": "16:30",
            "available": true
          }
        ]
      },
      {
        "date": "2026-06-27",
        "weekday": "Fri",
        "day_num": 27,
        "month": "Jun",
        "has_free": false,
        "times": [],
        "slots": []
      }
    ]
  }
}
```

### Поля дня

| Поле | Тип | Описание |
|------|-----|----------|
| `date` | string | `YYYY-MM-DD` |
| `weekday` | string | `Sun` … `Sat` — для day strip |
| `day_num` | integer | Число месяца |
| `month` | string | `Jan` … `Dec` |
| `has_free` | boolean | Есть ли хотя бы один `available` слот |
| `times` | string[] | Доступные времена `HH:mm` (упрощённый вид) |
| `slots` | array | Полные объекты для UI |

### Объект слота

| Поле | Тип | Описание |
|------|-----|----------|
| `start` | string | Локальное время `YYYY-MM-DDTHH:mm:00` (без offset) |
| `label` | string | `HH:mm` для кнопки |
| `available` | boolean | Можно выбрать |

Нерабочий день: `times: []`, `slots: []`, `has_free: false` → UI показывает «REST DAY».

---

## Ошибки

| HTTP | Код | Когда |
|------|-----|-------|
| 400 | `SERVICE_ID_INVALID` | Нет или невалидный `service_id` |
| 400 | `FROM_INVALID` / `TO_INVALID` | Неверный формат даты |
| 400 | `RANGE_INVALID` | `from > to` |
| 404 | `SERVICE_NOT_FOUND` | Услуга не найдена или `is_active = false` |
| 404 | — | Страница не найдена / не опубликована (public) |

---

## Связанные документы

- [pages_availability_api.md](./pages_availability_api.md) — настройки расписания (builder)
- [frontend_slots_integration.md](./frontend_slots_integration.md) — интеграция для `bookgo-frontend`
