import { verifyToken } from '../utils/jwt.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: req.t('errors.tokenMissing')
    });
  }

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch {
    return res.status(403).json({
      success: false,
      message: req.t('errors.tokenInvalid')
    });
  }
}
