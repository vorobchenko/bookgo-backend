import bcrypt from 'bcryptjs';
import { query } from '../../utils/db.js';
import { validateNewPassword } from '../../utils/password.js';

export default async function changePassword(req, res) {
  try {
    const { new_password, password_confirm } = req.body;
    const userId = req.user.id;

    if (!new_password || !password_confirm) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.changePassword.required')
      });
    }

    if (new_password !== password_confirm) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.changePassword.mismatch')
      });
    }

    if (!validateNewPassword(new_password)) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.changePassword.lengthInvalid')
      });
    }

    const result = await query(
      'SELECT id, email, password, is_active FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: req.t('profile.changePassword.userNotFound')
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: req.t('profile.changePassword.accountDeactivated')
      });
    }

    const isSamePassword = await bcrypt.compare(new_password, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.changePassword.samePassword')
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 8);

    await query(
      `UPDATE users
       SET password = $1, updated_at = now()
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    return res.status(200).json({
      success: true,
      message: req.t('profile.changePassword.success'),
      data: {
        user: {
          id: user.id,
          email: user.email,
          updated_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('errors.serverError')
    });
  }
}
