export function validateNewPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}
