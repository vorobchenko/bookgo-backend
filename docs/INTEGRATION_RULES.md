# Integration Rules — bookgo-app

Правила интеграции API. Обязательны для разработчиков и AI-агентов.

## Источник правды

| Что | Где |
|-----|-----|
| HTTP-контракт | `docs/auth_api.md`, `docs/profile_api.md` |
| Интеграция во фронт | `docs/frontend_auth_integration.md` |
| Ручные запросы | `postman/*.json` |
| **Не источник правды** | файлы `bookgo-backend/routes/*.js` на фронте |

## DO — делать

1. Все HTTP-вызовы — только через `src/api/` (client + auth + profile).
2. Типы — в `src/types/api/`, сверять с документацией.
3. Токен хранить в `sessionStorage` или `localStorage` (на выбор команды), ключ например `bookgo-auth-token`.
4. Показывать пользователю `message` из ответа API.
5. На каждый запрос передавать `Accept-Language` (из настроек UI или `navigator.language`).
6. После login сохранить token → вызвать `GET /profile/info` для данных аккаунта.

## DO NOT — не делать

1. **Не копировать** код из `bookgo-backend/routes/` в bookgo-app.
2. **Не вызывать** `fetch` из компонентов страниц напрямую.
3. **Не дублировать** валидацию пароля/email на фронте (кроме UX-подсказок до отправки).
4. **Не хардкодить** строки ошибок («Неверный пароль») — только `message` с API.
5. **Не путать** аккаунт (`users` / `/profile/*`) и публичную страницу (`ProfileSettings` в localStorage).
6. **Не вызывать** несуществующие эндпоинты (signup, forgot-password).

## Две сущности «профиль»

| | Аккаунт (API v1) | Публичная страница (пока localStorage) |
|--|------------------|----------------------------------------|
| Где в app | AuthContext + API | `page-settings` / `ProfileSettings` |
| API | `GET/PATCH /profile/*` | нет в v1 |
| Поля | email, name, phone, avatar, bio, city, timezone, lang | + **role**, slug, services, blocks… |
| Email | из `users.email` | дубль для уведомлений на странице |

Поле `role` («Personal trainer») — **только** публичная страница, не `PATCH /profile/edit`.

## Рекомендуемая структура bookgo-app

```
src/
  api/
    client.ts       # baseUrl, headers, parseApiResponse
    auth.ts         # login, logout
    profile.ts      # getProfile, updateProfile, changePassword
  types/api/
    common.ts       # ApiResponse<T>
    auth.ts
    profile.ts
  context/
    AuthContext.tsx # token, user, login, logout, loadProfile
```

## Env

```env
VITE_API_BASE_URL=https://bookgo-backend.up.railway.app
```

## Чеклист PR (фронт)

- [ ] Нет `fetch` вне `src/api/`
- [ ] Ошибки из `message`
- [ ] Есть `Accept-Language`
- [ ] Login поле — **email**, не username
- [ ] `ProfileSettings` не смешан с account user без явного маппинга
