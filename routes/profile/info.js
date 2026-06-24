import { query } from '../../utils/db.js';

const PROFILE_COLUMNS = `
  id,
  email,
  name,
  phone,
  avatar,
  bio,
  city,
  timezone,
  lang,
  is_active,
  last_login_at,
  created_at,
  updated_at
`;

export default async function info(req, res) {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT ${PROFILE_COLUMNS}
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: req.t('profile.info.userNotFound')
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: req.t('profile.info.accountDeactivated')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('profile.info.success'),
      data: { user }
    });
  } catch (error) {
    console.error('Profile info error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('profile.info.fetchError')
    });
  }
}
