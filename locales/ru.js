export default {
  auth: {
    login: {
      success: 'Успешная авторизация',
      invalidCredentials: 'Неверный email или пароль',
      accountDeactivated: 'Аккаунт деактивирован. Обратитесь в поддержку.'
    },
    logout: {
      success: 'Вы успешно вышли из системы'
    }
  },
  profile: {
    info: {
      success: 'Информация о профиле успешно получена',
      userNotFound: 'Пользователь не найден',
      accountDeactivated: 'Аккаунт деактивирован. Обратитесь в поддержку.',
      fetchError: 'Ошибка получения данных пользователя'
    },
    edit: {
      success: 'Профиль успешно обновлен',
      nameTooShort: 'Имя слишком короткое. Минимум 2 символа',
      bioTooLong: 'Биография слишком длинная. Максимум 1000 символов',
      languageInvalid: 'Некорректный код языка',
      updateError: 'Ошибка обновления профиля пользователя',
      noFields: 'Нет полей для обновления'
    },
    changePassword: {
      success: 'Пароль успешно изменен',
      required: 'Новый пароль и подтверждение пароля обязательны',
      mismatch: 'Пароли не совпадают',
      lengthInvalid: 'Пароль должен быть длиной от 8 до 128 символов',
      userNotFound: 'Пользователь не найден',
      accountDeactivated: 'Аккаунт деактивирован',
      samePassword: 'Новый пароль должен отличаться от текущего пароля',
      updateError: 'Ошибка обновления пароля'
    }
  },
  validation: {
    emailAndPasswordRequired: 'Email и пароль обязательны',
    emailInvalid: 'Некорректный формат email'
  },
  errors: {
    tokenMissing: 'Токен доступа не предоставлен',
    tokenInvalid: 'Неверный или просроченный токен',
    routeNotFound: 'Маршрут не найден',
    serverError: 'Внутренняя ошибка сервера'
  }
};
