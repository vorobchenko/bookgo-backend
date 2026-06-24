import jwt from 'jsonwebtoken';

export function generateToken(payload, expiresIn = null) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  const tokenExpiration = expiresIn || process.env.JWT_EXPIRES_IN;

  if (!tokenExpiration || tokenExpiration === 'never') {
    return jwt.sign(payload, secret);
  }

  return jwt.sign(payload, secret, { expiresIn: tokenExpiration });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.verify(token, secret);
}
