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
    }
  },
  errors: {
    tokenMissing: 'Access token not provided',
    tokenInvalid: 'Invalid or expired token',
    routeNotFound: 'Route not found',
    serverError: 'Internal server error'
  }
};
