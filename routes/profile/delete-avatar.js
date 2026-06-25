import { query } from '../../utils/db.js';
import { deleteAvatarByUrl } from '../../services/avatar-storage.js';

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

export default async function removeAvatar(req, res) {
  try {
    const userId = req.user.id;
    const currentResult = await query(
      `SELECT avatar FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    );
    const currentUser = currentResult.rows[0];

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: req.t('profile.info.userNotFound')
      });
    }

    if (currentUser.avatar) {
      await deleteAvatarByUrl(currentUser.avatar);
    }

    const updateResult = await query(
      `UPDATE users
       SET avatar = NULL, updated_at = now()
       WHERE id = $1 AND is_active = true
       RETURNING ${PROFILE_COLUMNS}`,
      [userId]
    );

    const user = updateResult.rows[0];

    return res.status(200).json({
      success: true,
      message: req.t('profile.avatar.deleteSuccess'),
      data: { user }
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('profile.avatar.deleteError')
    });
  }
}
