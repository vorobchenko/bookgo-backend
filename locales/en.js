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
  errors: {
    tokenMissing: 'Access token not provided',
    tokenInvalid: 'Invalid or expired token',
    routeNotFound: 'Route not found',
    serverError: 'Internal server error'
  }
};
