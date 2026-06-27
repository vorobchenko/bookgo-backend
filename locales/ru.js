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
    background: {
      uploadSuccess: 'Фон успешно загружен',
      deleteSuccess: 'Фон удалён',
      fileRequired: 'Нужно выбрать файл фона',
      fileTooLarge: 'Фон должен быть не больше 10 МБ',
      fileTypeInvalid: 'Фон должен быть в формате JPEG, PNG или WebP',
      uploadInvalid: 'Некорректная загрузка фона',
      uploadError: 'Ошибка загрузки фона',
      deleteError: 'Ошибка удаления фона',
      storageNotConfigured: 'Хранилище не настроено на сервере'
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
    },
    availability: {
      getSuccess: 'Расписание успешно получено',
      getError: 'Ошибка получения расписания',
      updateSuccess: 'Расписание обновлено',
      updateError: 'Ошибка обновления расписания',
      weeklyHoursSuccess: 'Рабочие часы обновлены',
      bookingRulesSuccess: 'Правила бронирования обновлены',
      validation: {
        invalid: 'Некорректные данные расписания',
        BODY_INVALID: 'Тело запроса должно быть JSON-объектом',
        BODY_EMPTY: 'Нужно передать хотя бы одно поле',
        TIMEZONE_INVALID: 'Timezone — непустая строка до 64 символов',
        BUFFER_AFTER_INVALID: 'Буфер после — неотрицательное целое',
        MIN_NOTICE_INVALID: 'Мин. уведомление — неотрицательное целое',
        MAX_DAYS_AHEAD_INVALID: 'Горизонт бронирования — неотрицательное целое',
        SLOT_INTERVAL_INVALID: 'Интервал слота — целое число минут больше 0',
        MAX_BOOKINGS_PER_DAY_INVALID:
          'Макс. записей в день — неотрицательное целое (0 = без лимита)',
        DAYS_REQUIRED: 'Нужен непустой массив days',
        DAY_INVALID: 'Каждый день — JSON-объект',
        WEEKDAY_INVALID: 'weekday — целое от 0 (воскресенье) до 6 (суббота)',
        RANGES_INVALID: 'ranges должен быть массивом',
        RANGE_INVALID: 'Каждый диапазон — объект со start и end',
        RANGE_TIME_INVALID: 'Время в формате HH:MM (24 часа)',
        RANGE_ORDER_INVALID: 'start должен быть раньше end'
      }
    },
    theme: {
      getSuccess: 'Тема успешно получена',
      getError: 'Ошибка получения темы',
      updateSuccess: 'Тема обновлена',
      updateError: 'Ошибка обновления темы',
      validation: {
        invalid: 'Некорректные данные темы',
        BODY_INVALID: 'Тело запроса должно быть JSON-объектом',
        BODY_EMPTY: 'Нужно передать хотя бы одно поле',
        ACCENT_COLOR_INVALID: 'Accent color — hex, например #c6f432',
        SECONDARY_COLOR_INVALID: 'secondary_color — hex',
        SURFACE_COLOR_INVALID: 'surface_color — hex',
        TEXT_COLOR_INVALID: 'text_color — hex',
        TEXT_MUTED_COLOR_INVALID: 'text_muted_color — hex',
        FONT_PRESET_INVALID: 'font_preset — непустая строка до 64 символов',
        ELEMENT_STYLE_INVALID: 'element_style: rounded, sharp или pill',
        CTA_INVALID: 'cta должен быть JSON-объектом',
        CTA_VARIANT_INVALID: 'cta.variant: solid, outline или ghost',
        CTA_SIZE_INVALID: 'cta.size: compact, default или large',
        CTA_LABEL_CASE_INVALID: 'cta.label_case: uppercase, capitalize или none',
        ATMOSPHERE_INVALID: 'atmosphere должен быть JSON-объектом',
        ATMOSPHERE_GRAIN_INTENSITY_INVALID: 'grain_intensity от 0 до 1',
        BACKGROUND_REQUIRED: 'Нужен объект background',
        BACKGROUND_INVALID: 'background должен быть JSON-объектом',
        BACKGROUND_TYPE_INVALID: 'type: solid, gradient или image',
        BACKGROUND_COLOR_INVALID: 'color — hex, например #0a0a0a',
        BACKGROUND_GRADIENT_INVALID: 'Нужны gradient_from, gradient_to и gradient_angle',
        BACKGROUND_GRADIENT_FROM_INVALID: 'gradient_from — hex',
        BACKGROUND_GRADIENT_TO_INVALID: 'gradient_to — hex',
        BACKGROUND_GRADIENT_ANGLE_INVALID: 'gradient_angle — целое от 0 до 360',
        BACKGROUND_IMAGE_URL_REQUIRED: 'Нужен image_url',
        BACKGROUND_IMAGE_URL_INVALID: 'image_url должен указывать на хранилище Bookgo',
        BACKGROUND_OVERLAY_OPACITY_INVALID: 'overlay_opacity от 0 до 1',
        BACKGROUND_POSITION_INVALID: 'position: center, top или bottom'
      },
      aiStyle: {
        generateSuccess: 'AI-стили сгенерированы и сохранены',
        generateError: 'Ошибка генерации AI-стилей',
        generateFailed: 'Не удалось создать темы по этому изображению',
        listError: 'Ошибка получения AI-стилей',
        applySuccess: 'AI-стиль применён',
        applyError: 'Ошибка применения AI-стиля',
        rateLimit: 'Слишком много генераций. Попробуйте позже.',
        providerUnavailable: 'AI-сервис временно недоступен',
        storageNotConfigured: 'Хранилище файлов не настроено',
        brandFileRequired: 'Нужен файл бренда',
        brandFileInvalid: 'Файл: JPEG, PNG, WebP или SVG',
        brandFileTooLarge: 'Файл бренда — не больше 5 МБ',
        brandUploadInvalid: 'Некорректная загрузка бренда',
        validation: {
          invalid: 'Некорректный запрос AI-стиля',
          HINT_TOO_LONG: 'hint — не больше 200 символов',
          STYLE_ID_INVALID: 'style_id невалиден или не принадлежит странице'
        }
      }
    },
    slots: {
      getSuccess: 'Слоты успешно получены',
      getError: 'Ошибка получения слотов',
      validation: {
        invalid: 'Некорректный запрос слотов',
        SERVICE_ID_INVALID: 'service_id должен быть валидным UUID',
        SERVICE_NOT_FOUND: 'Услуга не найдена или неактивна на этой странице',
        FROM_INVALID: 'from — дата в формате YYYY-MM-DD',
        TO_INVALID: 'to — дата в формате YYYY-MM-DD',
        RANGE_INVALID: 'from должен быть не позже to'
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
