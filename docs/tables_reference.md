# Справочник таблиц Bookgo

## Рекомендуемая схема: 2 сущности

```
users          — аккаунт (логин, личные данные)
  └── pages    — публичная страница записи (всё остальное в JSON)
```

SQL: [`simple_schema.sql`](./simple_schema.sql)  
Расширенная схема (если понадобится позже): [`full_schema.sql`](./full_schema.sql)

---

## Связи

```
users 1 ──< N pages
```

Один человек → одна или несколько страниц (`bookgo.app/t/{slug}`).  
Бренды, команды, бронирования — **не отдельные таблицы**, пока не упрёмся в лимиты JSON.

---

## `schema_migrations` (служебная)

| Колонка | Тип |
|---------|-----|
| `id` | SERIAL PK |
| `name` | VARCHAR(255) UNIQUE |
| `applied_at` | TIMESTAMPTZ |

---

## `users`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID PK | |
| `email` | VARCHAR(255) UNIQUE | Логин |
| `password` | VARCHAR(255) | bcrypt |
| `name` | VARCHAR(100) | |
| `phone` | VARCHAR(50) | |
| `avatar` | VARCHAR(500) | |
| `bio` | TEXT | |
| `city` | VARCHAR(255) | |
| `timezone` | VARCHAR(64) | default UTC |
| `lang` | VARCHAR(5) | en \| ru |
| `is_active` | BOOLEAN | |
| `last_login_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

## `pages`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | Кто владелец |
| `slug` | VARCHAR(64) UNIQUE | URL страницы |
| `published` | BOOLEAN | Опубликована |
| `published_at` | TIMESTAMPTZ | |
| `settings` | JSONB | **Весь builder** (см. ниже) |
| `settings_version` | INTEGER | Версия схемы JSON |
| `is_default` | BOOLEAN | Какая page открывается в админке |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Индексы:** `user_id`, `slug` WHERE published, одна `is_default` на user.

### Что лежит в `settings` (как на фронте сейчас)

Один JSON = весь `PageSettings`:

| Ключ | Содержимое |
|------|------------|
| `profile` | name, role, bio, city, avatarUrl, email, phone |
| `availability` | timezone, days, ranges, buffers |
| `services` | categories + services |
| `blocks` | какие секции включены |
| `theme` | preset, accent, mode |
| `stories`, `gallery`, `video`, `location`, `contacts` | |
| `reviews`, `faq`, `cancellation`, `customQuestions` | |

Новые блоки (header, footer) → block library в коде + новый ключ в JSON.  
**100k страниц** → normalize при чтении, без новых таблиц.

---

## Что НЕ в БД

| Было в сложной схеме | Проще так |
|----------------------|-----------|
| `workspaces` | поле `profile.role` или `settings.title` на странице |
| `page_services` | `settings.services` в JSON |
| `availability_rules` | `settings.availability` в JSON |
| `bookings` | отдельная таблица **только когда** запустите запись клиентов |
| `page_views` | позже, одна таблица или внешний аналитик |
| block library | npm-пакет, не таблица |

---

## Когда усложнять

Добавлять таблицы **только по боли**:

| Боль | Что добавить |
|------|----------------|
| Реальные бронирования, календарь | `bookings` (+ maybe `page_services` из JSON) |
| Несколько брендов с командой | `workspaces` |
| Аналитика просмотров | `page_views` |

До этого — **users + pages** достаточно.

---

## Полная схема (архив)

13 таблиц для масштаба — в [`full_schema.sql`](./full_schema.sql).  
Не обязательна на старте.
