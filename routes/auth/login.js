import bcrypt from 'bcryptjs';
import { query } from '../../utils/db.js';
import { generateToken } from '../../utils/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: req.t('validation.emailAndPasswordRequired')
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: req.t('validation.emailInvalid')
      });
    }

    const result = await query(
      `SELECT id, email, name, password, is_active
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: req.t('auth.login.invalidCredentials')
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: req.t('auth.login.accountDeactivated')
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: req.t('auth.login.invalidCredentials')
      });
    }

    await query(
      `UPDATE users
       SET last_login_at = now(), updated_at = now()
       WHERE id = $1`,
      [user.id]
    );

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name
    });

    return res.status(200).json({
      success: true,
      message: req.t('auth.login.success'),
      data: { token }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('errors.serverError')
    });
  }
}
