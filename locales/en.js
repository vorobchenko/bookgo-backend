export default {
  auth: {
    login: {
      success: 'Successful authorization',
      invalidCredentials: 'Invalid email or password',
      accountDeactivated: 'Account deactivated. Please contact support.'
    },
    logout: {
      success: 'Successfully logged out'
    }
  },
  profile: {
    info: {
      success: 'Profile information successfully retrieved',
      userNotFound: 'User not found',
      accountDeactivated: 'Account deactivated. Please contact support.',
      fetchError: 'Error fetching user data'
    },
    edit: {
      success: 'Profile updated successfully',
      nameTooShort: 'Name is too short. Minimum 2 characters',
      bioTooLong: 'Bio is too long. Maximum 1000 characters',
      languageInvalid: 'Invalid language code',
      updateError: 'Error updating user profile',
      noFields: 'No valid fields to update'
    },
    changePassword: {
      success: 'Password changed successfully',
      required: 'New password and password confirmation are required',
      mismatch: 'Passwords do not match',
      lengthInvalid: 'Password must be 8-128 characters long',
      userNotFound: 'User not found',
      accountDeactivated: 'Account is deactivated',
      samePassword: 'New password must be different from current password',
      updateError: 'Error updating password'
    }
  },
  validation: {
    emailAndPasswordRequired: 'Email and password are required',
    emailInvalid: 'Invalid email format'
  },
  pages: {
    list: {
      success: 'Pages retrieved successfully',
      error: 'Error fetching pages'
    },
    create: {
      success: 'Page created successfully',
      error: 'Error creating page',
      userNotFound: 'User not found'
    },
    get: {
      success: 'Page retrieved successfully',
      notFound: 'Page not found',
      error: 'Error fetching page'
    },
    patch: {
      success: 'Page updated successfully',
      error: 'Error updating page'
    },
    publish: {
      success: 'Page published successfully',
      validationFailed: 'Page is not ready to publish',
      error: 'Error publishing page'
    },
    unpublish: {
      success: 'Page unpublished successfully',
      error: 'Error unpublishing page'
    },
    delete: {
      success: 'Page deleted successfully',
      error: 'Error deleting page'
    },
    setDefault: {
      success: 'Default page updated successfully',
      error: 'Error updating default page'
    },
    public: {
      success: 'Public page retrieved successfully',
      notFound: 'Published page not found',
      error: 'Error fetching public page'
    },
    validation: {
      slugInvalid: 'Slug must be 3–48 characters: lowercase letters, numbers, and hyphens only',
      slugTaken: 'This slug is already taken',
      emailInvalid: 'Invalid email format',
      languageInvalid: 'Invalid language code'
    },
    avatar: {
      uploadSuccess: 'Page photo uploaded successfully',
      deleteSuccess: 'Page photo removed successfully',
      fileRequired: 'Photo file is required',
      fileTooLarge: 'Photo must be 5 MB or smaller',
      fileTypeInvalid: 'Photo must be a JPEG, PNG, WebP, or GIF image',
      uploadInvalid: 'Invalid photo upload',
      uploadError: 'Error uploading page photo',
      deleteError: 'Error removing page photo',
      urlInvalid: 'Photo URL must point to Bookgo storage',
      storageNotConfigured: 'Photo storage is not configured on the server'
    },
    services: {
      listSuccess: 'Services retrieved successfully',
      listError: 'Error fetching services',
      createSuccess: 'Service created successfully',
      createError: 'Error creating service',
      updateSuccess: 'Service updated successfully',
      updateError: 'Error updating service',
      deleteSuccess: 'Service deleted successfully',
      deleteError: 'Error deleting service',
      activateSuccess: 'Service activated successfully',
      deactivateSuccess: 'Service deactivated successfully',
      archiveSuccess: 'Service archived successfully',
      restoreSuccess: 'Service restored successfully',
      reorderSuccess: 'Service order updated successfully',
      reorderError: 'Error updating service order',
      notFound: 'Service not found',
      categoryNotFound: 'Service category not found',
      categoryCreateSuccess: 'Service category created successfully',
      categoryCreateError: 'Error creating service category',
      categoryUpdateSuccess: 'Service category updated successfully',
      categoryUpdateError: 'Error updating service category',
      categoryDeleteSuccess: 'Service category deleted successfully',
      categoryDeleteError: 'Error deleting service category',
      settingsUpdateSuccess: 'Services settings updated successfully',
      settingsUpdateError: 'Error updating services settings',
      photo: {
        uploadSuccess: 'Service photo uploaded successfully',
        deleteSuccess: 'Service photo removed successfully',
        fileRequired: 'Photo file is required',
        fileTooLarge: 'Photo must be 5 MB or smaller',
        fileTypeInvalid: 'Photo must be a JPEG, PNG, WebP, or GIF image',
        uploadInvalid: 'Invalid photo upload',
        uploadError: 'Error uploading service photo',
        deleteError: 'Error removing service photo',
        storageNotConfigured: 'Photo storage is not configured on the server'
      },
      validation: {
        invalid: 'Invalid service data',
        TITLE_REQUIRED: 'Service title is required',
        TITLE_TOO_LONG: 'Title must be 200 characters or fewer',
        DURATION_INVALID: 'Duration must be a positive number of minutes',
        PRICE_INVALID: 'Price must be a non-negative integer in minor units',
        CURRENCY_INVALID: 'Currency must be a 3-letter ISO code',
        CATEGORY_INVALID: 'Category ID must be a valid UUID',
        BODY_INVALID: 'Request body must be a JSON object',
        BODY_EMPTY: 'At least one field is required',
        SORT_ORDER_INVALID: 'Sort order must be a non-negative integer',
        PHOTO_URL_INVALID: 'Photo URL must point to Bookgo storage',
        ORDER_REQUIRED: 'Service order array is required',
        ORDER_INVALID: 'Service order contains invalid or unknown IDs',
        ORDER_DUPLICATE: 'Service order must not contain duplicate IDs',
        ORDER_INCOMPLETE: 'Service order must include every service on the page'
      }
    },
    availability: {
      getSuccess: 'Availability retrieved successfully',
      getError: 'Error fetching availability',
      updateSuccess: 'Availability updated successfully',
      updateError: 'Error updating availability',
      weeklyHoursSuccess: 'Weekly hours updated successfully',
      bookingRulesSuccess: 'Booking rules updated successfully',
      validation: {
        invalid: 'Invalid availability data',
        BODY_INVALID: 'Request body must be a JSON object',
        BODY_EMPTY: 'At least one field is required',
        TIMEZONE_INVALID: 'Timezone must be a non-empty string up to 64 characters',
        BUFFER_AFTER_INVALID: 'Buffer after must be a non-negative integer',
        MIN_NOTICE_INVALID: 'Minimum notice must be a non-negative integer',
        MAX_DAYS_AHEAD_INVALID: 'Book ahead days must be a non-negative integer',
        SLOT_INTERVAL_INVALID: 'Slot interval must be a positive integer number of minutes',
        MAX_BOOKINGS_PER_DAY_INVALID:
          'Max bookings per day must be a non-negative integer (0 = unlimited)',
        DAYS_REQUIRED: 'Days array is required and must not be empty',
        DAY_INVALID: 'Each day must be a JSON object',
        WEEKDAY_INVALID: 'Weekday must be an integer from 0 (Sunday) to 6 (Saturday)',
        RANGES_INVALID: 'Ranges must be an array',
        RANGE_INVALID: 'Each range must be an object with start and end times',
        RANGE_TIME_INVALID: 'Range times must use HH:MM format (24-hour)',
        RANGE_ORDER_INVALID: 'Range start time must be before end time'
      }
    },
    theme: {
      getSuccess: 'Theme retrieved successfully',
      getError: 'Error fetching theme',
      updateSuccess: 'Theme updated successfully',
      updateError: 'Error updating theme',
      validation: {
        invalid: 'Invalid theme data',
        BODY_INVALID: 'Request body must be a JSON object',
        BODY_EMPTY: 'At least one field is required',
        PRESET_INVALID: 'Preset must be neon, pastel, or bold',
        ACCENT_COLOR_INVALID: 'Accent color must be a hex value like #c6f432',
        MODE_INVALID: 'Mode must be light, dark, or auto',
        FONT_PRESET_INVALID: 'Font preset must be neutral, sport, or editorial',
        ELEMENT_STYLE_INVALID: 'Element style must be rounded, sharp, or pill',
        BACKGROUND_REQUIRED: 'Background object is required',
        BACKGROUND_INVALID: 'Background must be a JSON object',
        BACKGROUND_TYPE_INVALID: 'Background type must be preset, solid, gradient, or image',
        BACKGROUND_COLOR_INVALID: 'Background color must be a hex value like #0a0a0a',
        BACKGROUND_GRADIENT_FROM_INVALID: 'Gradient start color must be a hex value',
        BACKGROUND_GRADIENT_TO_INVALID: 'Gradient end color must be a hex value',
        BACKGROUND_GRADIENT_ANGLE_INVALID: 'Gradient angle must be an integer from 0 to 360',
        BACKGROUND_IMAGE_URL_REQUIRED: 'Background image URL is required',
        BACKGROUND_IMAGE_URL_INVALID: 'Background image URL must point to Bookgo storage'
      }
    },
    slots: {
      getSuccess: 'Slots retrieved successfully',
      getError: 'Error fetching slots',
      validation: {
        invalid: 'Invalid slots request',
        SERVICE_ID_INVALID: 'service_id must be a valid UUID',
        SERVICE_NOT_FOUND: 'Service not found or inactive on this page',
        FROM_INVALID: 'from must be a date in YYYY-MM-DD format',
        TO_INVALID: 'to must be a date in YYYY-MM-DD format',
        RANGE_INVALID: 'from must be on or before to'
      }
    }
  },
  errors: {
    tokenMissing: 'Access token not provided',
    tokenInvalid: 'Invalid or expired token',
    routeNotFound: 'Route not found',
    serverError: 'Internal server error'
  }
};
