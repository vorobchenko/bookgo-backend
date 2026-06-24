# Frontend Integration — Auth & Profile

Документация для интеграции **bookgo-app** с API авторизации и профиля аккаунта.

Перед началом: [INTEGRATION_RULES.md](./INTEGRATION_RULES.md), [API_CONVENTIONS.md](./API_CONVENTIONS.md)

Контракты: [auth_api.md](./auth_api.md), [profile_api.md](./profile_api.md)

**Pages (builder):** [frontend_pages_integration.md](./frontend_pages_integration.md)

---

## Base URL

```env
# .env.local в bookgo-app
VITE_API_BASE_URL=https://bookgo-backend.up.railway.app
```

Локальная разработка бэкенда:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

## Общий формат ответа

```typescript
type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}
```

При ошибке `success === false` — показывать `message` пользователю.

Всегда отправлять:

```typescript
headers: {
  'Content-Type': 'application/json',
  'Accept-Language': 'ru', // или 'en'
}
```

Для защищённых запросов:

```typescript
'Authorization': `Bearer ${token}`
```

---

## TypeScript типы

Создать `src/types/api/common.ts`:

```typescript
export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type ApiErrorResponse = {
  success: false
  message: string
  valid_languages?: string[]
}
```

`src/types/api/auth.ts`:

```typescript
export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponseData = {
  token: string
}
```

`src/types/api/profile.ts`:

```typescript
export type UserLang = 'en' | 'ru'

export type AccountUser = {
  id: string
  email: string
  name: string | null
  phone: string | null
  avatar: string | null
  bio: string | null
  city: string | null
  timezone: string
  lang: UserLang
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type ProfileInfoResponseData = {
  user: AccountUser
}

export type ProfileEditRequest = Partial<{
  name: string
  phone: string
  avatar: string
  bio: string
  city: string
  timezone: string
  lang: UserLang
}>

export type ProfileEditResponseData = {
  user: AccountUser
}

export type ChangePasswordRequest = {
  new_password: string
  password_confirm: string
}

export type ChangePasswordResponseData = {
  user: {
    id: string
    email: string
    updated_at: string
  }
}
```

---

## API client

`src/api/client.ts`:

```typescript
import type { ApiResponse } from '../types/api/common'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

function getAcceptLanguage(): string {
  const stored = localStorage.getItem('bookgo-ui-lang')
  if (stored === 'ru' || stored === 'en') return stored
  return navigator.language.startsWith('ru') ? 'ru' : 'en'
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<ApiResponse<T>> {
  const { token, headers, ...rest } = options

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': getAcceptLanguage(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const body = (await response.json()) as ApiResponse<T> & { success: boolean; message: string }

  if (!response.ok || body.success === false) {
    throw new ApiError(body.message || 'Request failed', response.status)
  }

  return body
}
```

---

## Auth API

`src/api/auth.ts`:

```typescript
import { apiRequest } from './client'
import type { LoginRequest, LoginResponseData } from '../types/api/auth'

export async function loginApi(payload: LoginRequest) {
  return apiRequest<LoginResponseData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    }),
  })
}

export async function logoutApi(token: string) {
  return apiRequest<null>('/auth/logout', {
    method: 'POST',
    token,
  })
}
```

### POST /auth/login

**Когда:** форма входа на `LoginPage`.

**Request:**

```json
{
  "email": "hello@dodotap.com",
  "password": "secret"
}
```

**Успех (200):**

```json
{
  "success": true,
  "message": "Успешная авторизация",
  "data": {
    "token": "eyJhbG..."
  }
}
```

**Ошибки для UI:**

| HTTP | message (ru) | Действие на фронте |
|------|----------------|-------------------|
| 400 | Email и пароль обязательны | подсветить форму |
| 400 | Некорректный формат email | подсветить email |
| 401 | Неверный email или пароль | общая ошибка под формой |
| 401 | Аккаунт деактивирован… | показать message |

После успеха:

1. `sessionStorage.setItem('bookgo-auth-token', data.token)`
2. Вызвать `GET /profile/info`
3. Редирект на `/`

### POST /auth/logout

**Когда:** кнопка «Выйти».

**Успех (200):**

```json
{
  "success": true,
  "message": "Вы успешно вышли из системы",
  "data": null
}
```

На фронте **обязательно** удалить token и user из state/storage, даже если запрос упал (сеть).

---

## Profile API

`src/api/profile.ts`:

```typescript
import { apiRequest } from './client'
import type {
  ProfileInfoResponseData,
  ProfileEditRequest,
  ProfileEditResponseData,
  ChangePasswordRequest,
  ChangePasswordResponseData,
} from '../types/api/profile'

export function getProfileApi(token: string) {
  return apiRequest<ProfileInfoResponseData>('/profile/info', { token })
}

export function updateProfileApi(token: string, payload: ProfileEditRequest) {
  return apiRequest<ProfileEditResponseData>('/profile/edit', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export function changePasswordApi(token: string, payload: ChangePasswordRequest) {
  return apiRequest<ChangePasswordResponseData>('/profile/change-password', {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  })
}
```

### GET /profile/info

**Когда:**

- сразу после login;
- при загрузке app, если token есть в storage;
- после `PATCH /profile/edit`.

**Успех (200):**

```json
{
  "success": true,
  "message": "Информация о профиле успешно получена",
  "data": {
    "user": {
      "id": "ee3d5d07-7ed4-4a40-90ed-11650d0c2386",
      "email": "hello@dodotap.com",
      "name": "Admin",
      "phone": null,
      "avatar": null,
      "bio": null,
      "city": null,
      "timezone": "UTC",
      "lang": "en",
      "is_active": true,
      "last_login_at": "2026-06-24T07:51:08.873Z",
      "created_at": "2026-06-24T07:50:12.000Z",
      "updated_at": "2026-06-24T07:51:08.873Z"
    }
  }
}
```

**401 / 403** — токен невалиден → logout, редирект на `/login`.

### PATCH /profile/edit

**Когда:** форма настроек **аккаунта** (не путать с публичной страницей).

**Request (пример):**

```json
{
  "name": "Maxim",
  "phone": "+48123456789",
  "city": "Warsaw",
  "timezone": "Europe/Warsaw",
  "lang": "ru",
  "bio": "Coach",
  "avatar": "https://cdn.example.com/avatar.jpg"
}
```

**Успех (200):** `data.user` — полный обновлённый объект.

**Ошибки:**

| HTTP | message | |
|------|---------|--|
| 400 | Имя слишком короткое… | name < 2 chars |
| 400 | Биография слишком длинная… | bio > 1000 |
| 400 | Некорректный код языка | + `valid_languages: ["en","ru"]` |
| 400 | Нет полей для обновления | пустой body |

### PUT /profile/change-password

**Request:**

```json
{
  "new_password": "new-password-8ch",
  "password_confirm": "new-password-8ch"
}
```

**Успех (200):**

```json
{
  "success": true,
  "message": "Пароль успешно изменен",
  "data": {
    "user": {
      "id": "ee3d5d07-7ed4-4a40-90ed-11650d0c2386",
      "email": "hello@dodotap.com",
      "updated_at": "2026-06-24T08:15:00.000Z"
    }
  }
}
```

---

## AuthContext (рефакторинг)

Заменить demo `verifyCredentials` в `src/lib/auth.ts`.

```typescript
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi, logoutApi } from '../api/auth'
import { getProfileApi } from '../api/profile'
import type { AccountUser } from '../types/api/profile'
import { ApiError } from '../api/client'

const TOKEN_KEY = 'bookgo-auth-token'

type AuthContextValue = {
  authenticated: boolean
  loading: boolean
  user: AccountUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null)
      return
    }
    const res = await getProfileApi(token)
    setUser(res.data.user)
  }, [token])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await getProfileApi(token)
        if (!cancelled) setUser(res.data.user)
      } catch (err) {
        if (!cancelled) {
          sessionStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi({ email, password })
    sessionStorage.setItem(TOKEN_KEY, res.data.token)
    setToken(res.data.token)
    const profile = await getProfileApi(res.data.token)
    setUser(profile.data.user)
  }, [])

  const logout = useCallback(async () => {
    const current = token
    sessionStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    if (current) {
      try {
        await logoutApi(current)
      } catch {
        // ignore — уже разлогинены локально
      }
    }
  }, [token])

  const value = useMemo(
    () => ({
      authenticated: Boolean(token && user),
      loading,
      user,
      login,
      logout,
      refreshProfile,
    }),
    [token, user, loading, login, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### LoginPage

- Поле **Email** (не «Login» / username)
- `type="email"`, `autoComplete="email"`
- `await login(email, password)` — async, показать loading
- при `ApiError` — `error.message` под формой

```typescript
try {
  await login(email, password)
  navigate(from, { replace: true })
} catch (err) {
  setError(err instanceof ApiError ? err.message : 'Login failed')
}
```

### ProtectedRoute

Пока `loading` — спиннер. Если `!authenticated` — `/login`.

---

## Маппинг: AccountUser ↔ ProfileSettings

**Не синхронизировать автоматически** без явного решения продукта.

| AccountUser (API) | ProfileSettings (localStorage) |
|-------------------|-------------------------------|
| `name` | `name` |
| `email` | `email` (контакт на странице) |
| `phone` | `phone` |
| `avatar` | `avatarUrl` |
| `bio` | `bio` |
| `city` | `city` |
| `timezone` | `timezone` |
| — | `role` (только публичная страница) |

Публичная страница остаётся в `page-settings` до появления API `trainer_pages`.

---

## Порядок интеграции

1. `VITE_API_BASE_URL` + типы + `api/client.ts`
2. `api/auth.ts`, `api/profile.ts`
3. Рефакторинг `AuthContext` + `LoginPage` (email)
4. `ProtectedRoute` + loading state
5. (опционально) экран смены пароля → `changePasswordApi`
6. (опционально) синхронизация полей аккаунта в settings

---

## Тестирование

Postman: [`../postman/bookgo-api.postman_collection.json`](../postman/bookgo-api.postman_collection.json)

Порядок: **Login** → **Profile info** → **Profile edit** → **Change password** → **Logout**
