import { query } from '../../utils/db.js';

const EDITABLE_FIELDS = ['name', 'phone', 'bio', 'city', 'timezone', 'lang'];
const VALID_LANGS = ['en', 'ru'];

export default async function editProfile(req, res) {
  try {
    const userId = req.user.id;
    const body = req.body || {};

    if (body.name !== undefined && body.name !== null && String(body.name).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.edit.nameTooShort')
      });
    }

    if (body.bio !== undefined && body.bio !== null && String(body.bio).length > 1000) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.edit.bioTooLong')
      });
    }

    if (body.lang !== undefined && body.lang !== null && !VALID_LANGS.includes(body.lang)) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.edit.languageInvalid'),
        valid_languages: VALID_LANGS
      });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        let value = body[field];
        if (typeof value === 'string') {
          value = value.trim();
          if (value === '') {
            value = null;
          }
        }
        updates.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex += 1;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: req.t('profile.edit.noFields')
      });
    }

    updates.push('updated_at = now()');
    values.push(userId);

    const result = await query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND is_active = true
       RETURNING id, email, name, phone, avatar, bio, city, timezone, lang, is_active, last_login_at, created_at, updated_at`,
      values
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: req.t('profile.info.userNotFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('profile.edit.success'),
      data: { user }
    });
  } catch (error) {
    console.error('Profile edit error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('profile.edit.updateError')
    });
  }
}
