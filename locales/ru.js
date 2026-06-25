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
  pages: {
    list: {
      success: 'Список страниц успешно получен',
      error: 'Ошибка получения списка страниц'
    },
    create: {
      success: 'Страница успешно создана',
      error: 'Ошибка создания страницы',
      userNotFound: 'Пользователь не найден'
    },
    get: {
      success: 'Страница успешно получена',
      notFound: 'Страница не найдена',
      error: 'Ошибка получения страницы'
    },
    patch: {
      success: 'Страница успешно обновлена',
      error: 'Ошибка обновления страницы'
    },
    publish: {
      success: 'Страница успешно опубликована',
      validationFailed: 'Страница не готова к публикации',
      error: 'Ошибка публикации страницы'
    },
    unpublish: {
      success: 'Публикация страницы снята',
      error: 'Ошибка снятия публикации'
    },
    delete: {
      success: 'Страница удалена',
      error: 'Ошибка удаления страницы'
    },
    setDefault: {
      success: 'Страница по умолчанию обновлена',
      error: 'Ошибка обновления страницы по умолчанию'
    },
    public: {
      success: 'Публичная страница успешно получена',
      notFound: 'Опубликованная страница не найдена',
      error: 'Ошибка получения публичной страницы'
    },
    validation: {
      slugInvalid: 'Slug: 3–48 символов, только строчные латинские буквы, цифры и дефис',
      slugTaken: 'Этот slug уже занят',
      emailInvalid: 'Некорректный формат email',
      languageInvalid: 'Некорректный код языка'
    },
    avatar: {
      uploadSuccess: 'Фото страницы успешно загружено',
      deleteSuccess: 'Фото страницы удалено',
      fileRequired: 'Нужно выбрать файл фото',
      fileTooLarge: 'Фото должно быть не больше 5 МБ',
      fileTypeInvalid: 'Фото должно быть в формате JPEG, PNG, WebP или GIF',
      uploadInvalid: 'Некорректная загрузка фото',
      uploadError: 'Ошибка загрузки фото страницы',
      deleteError: 'Ошибка удаления фото страницы',
      urlInvalid: 'URL фото должен указывать на хранилище Bookgo',
      storageNotConfigured: 'Хранилище фото не настроено на сервере'
    },
    services: {
      listSuccess: 'Услуги успешно получены',
      listError: 'Ошибка получения услуг',
      createSuccess: 'Услуга создана',
      createError: 'Ошибка создания услуги',
      updateSuccess: 'Услуга обновлена',
      updateError: 'Ошибка обновления услуги',
      deleteSuccess: 'Услуга удалена',
      deleteError: 'Ошибка удаления услуги',
      activateSuccess: 'Услуга активирована',
      deactivateSuccess: 'Услуга деактивирована',
      archiveSuccess: 'Услуга отправлена в архив',
      restoreSuccess: 'Услуга восстановлена из архива',
      reorderSuccess: 'Порядок услуг обновлён',
      reorderError: 'Ошибка изменения порядка услуг',
      notFound: 'Услуга не найдена',
      categoryNotFound: 'Категория услуг не найдена',
      categoryCreateSuccess: 'Категория услуг создана',
      categoryCreateError: 'Ошибка создания категории услуг',
      categoryUpdateSuccess: 'Категория услуг обновлена',
      categoryUpdateError: 'Ошибка обновления категории услуг',
      categoryDeleteSuccess: 'Категория услуг удалена',
      categoryDeleteError: 'Ошибка удаления категории услуг',
      settingsUpdateSuccess: 'Настройки услуг обновлены',
      settingsUpdateError: 'Ошибка обновления настроек услуг',
      photo: {
        uploadSuccess: 'Фото услуги загружено',
        deleteSuccess: 'Фото услуги удалено',
        fileRequired: 'Нужно выбрать файл фото',
        fileTooLarge: 'Фото должно быть не больше 5 МБ',
        fileTypeInvalid: 'Фото должно быть в формате JPEG, PNG, WebP или GIF',
        uploadInvalid: 'Некорректная загрузка фото',
        uploadError: 'Ошибка загрузки фото услуги',
        deleteError: 'Ошибка удаления фото услуги',
        storageNotConfigured: 'Хранилище фото не настроено на сервере'
      },
      validation: {
        invalid: 'Некорректные данные услуги',
        TITLE_REQUIRED: 'Название услуги обязательно',
        TITLE_TOO_LONG: 'Название не длиннее 200 символов',
        DURATION_INVALID: 'Длительность — целое число минут больше 0',
        PRICE_INVALID: 'Цена — неотрицательное целое в минорных единицах',
        CURRENCY_INVALID: 'Валюта — трёхбуквенный ISO-код',
        CATEGORY_INVALID: 'ID категории должен быть UUID',
        BODY_INVALID: 'Тело запроса должно быть JSON-объектом',
        BODY_EMPTY: 'Нужно передать хотя бы одно поле',
        SORT_ORDER_INVALID: 'Порядок сортировки — неотрицательное целое',
        PHOTO_URL_INVALID: 'URL фото должен указывать на хранилище Bookgo',
        ORDER_REQUIRED: 'Нужен массив order с ID услуг',
        ORDER_INVALID: 'В order есть неверные или чужие ID услуг',
        ORDER_DUPLICATE: 'В order не должно быть повторяющихся ID',
        ORDER_INCOMPLETE: 'В order должны быть все услуги страницы'
      }
    }
  },
  errors: {
    tokenMissing: 'Токен доступа не предоставлен',
    tokenInvalid: 'Неверный или просроченный токен',
    routeNotFound: 'Маршрут не найден',
    serverError: 'Внутренняя ошибка сервера'
  }
};
