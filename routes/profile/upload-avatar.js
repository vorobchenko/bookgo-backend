import { query } from '../../utils/db.js';
import { deleteAvatarByUrl, uploadUserAvatar } from '../../services/avatar-storage.js';
import { isS3StorageConfigured } from '../../utils/s3-storage.js';

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

export default async function uploadAvatar(req, res) {
  try {
    if (!isS3StorageConfigured()) {
      return res.status(503).json({
        success: false,
        message: req.t('profile.avatar.storageNotConfigured')
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.avatar.fileRequired')
      });
    }

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

    const uploaded = await uploadUserAvatar(userId, req.file);

    const updateResult = await query(
      `UPDATE users
       SET avatar = $1, updated_at = now()
       WHERE id = $2 AND is_active = true
       RETURNING ${PROFILE_COLUMNS}`,
      [uploaded.url, userId]
    );

    const user = updateResult.rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: req.t('profile.info.userNotFound')
      });
    }

    if (currentUser.avatar && currentUser.avatar !== uploaded.url) {
      await deleteAvatarByUrl(currentUser.avatar);
    }

    return res.status(200).json({
      success: true,
      message: req.t('profile.avatar.uploadSuccess'),
      data: {
        avatar: uploaded.url,
        user
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: req.t('profile.avatar.fileTypeInvalid')
      });
    }

    return res.status(500).json({
      success: false,
      message: req.t('profile.avatar.uploadError')
    });
  }
}
