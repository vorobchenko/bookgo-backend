# Auth API

Контракт эндпоинтов авторизации (v1).

Base URL: `https://bookgo-backend.up.railway.app`

Общие правила: [API_CONVENTIONS.md](./API_CONVENTIONS.md)

---

## POST /auth/login

Вход по email и паролю. Возвращает JWT.

### Авторизация

Не требуется.

### Request body

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `email` | `string` | да | Email (нормализуется в lowercase) |
| `password` | `string` | да | Пароль |

```json
{
  "email": "hello@dodotap.com",
  "password": "your-password"
}
```

### Пример запроса

```bash
curl -X POST https://bookgo-backend.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept-Language: ru" \
  -d '{"email":"hello@dodotap.com","password":"your-password"}'
```

### Ответы

#### 200 — успех

```json
{
  "success": true,
  "message": "Успешная авторизация",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVlZTNkNWQwLTdlZDQtNGE0MC05MGVkLTExNjUwZDBjMjM4NiIsImVtYWlsIjoiaGVsbG9AZG9kb3RhcC5jb20iLCJuYW1lIjoiQWRtaW4iLCJpYXQiOjE3ODIyODc0ODYsImV4cCI6MTc4NDg3OTQ4Nn0.example"
  }
}
```

#### 400 — пустые поля

```json
{
  "success": false,
  "message": "Email и пароль обязательны"
}
```

#### 400 — невалидный email

```json
{
  "success": false,
  "message": "Некорректный формат email"
}
```

#### 401 — неверные учётные данные

```json
{
  "success": false,
  "message": "Неверный email или пароль"
}
```

#### 401 — аккаунт деактивирован

```json
{
  "success": false,
  "message": "Аккаунт деактивирован. Обратитесь в поддержку."
}
```

#### 500 — сервер

```json
{
  "success": false,
  "message": "Внутренняя ошибка сервера"
}
```

---

## POST /auth/logout

Завершение сессии на клиенте. Сервер возвращает успех; JWT stateless — **токен нужно удалить на фронте**.

### Авторизация

`Authorization: Bearer <token>`

### Request body

Нет.

### Пример запроса

```bash
curl -X POST https://bookgo-backend.up.railway.app/auth/logout \
  -H "Authorization: Bearer <token>" \
  -H "Accept-Language: en"
```

### Ответы

#### 200 — успех

```json
{
  "success": true,
  "message": "Successfully logged out",
  "data": null
}
```

#### 401 — нет токена

```json
{
  "success": false,
  "message": "Access token not provided"
}
```

#### 403 — невалидный токен

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```
