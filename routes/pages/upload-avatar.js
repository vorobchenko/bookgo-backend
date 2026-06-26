import { query } from '../../utils/db.js';
import { deleteAvatarByUrl, uploadPageAvatar } from '../../services/avatar-storage.js';
import { getPageOwnedByUser } from '../../services/pages.repository.js';
import { isS3StorageConfigured } from '../../utils/s3-storage.js';
import { loadAssembledPage } from './handlers.js';

export async function uploadPageAvatarHandler(req, res) {
  try {
    if (!isS3StorageConfigured()) {
      return res.status(503).json({
        success: false,
        message: req.t('pages.avatar.storageNotConfigured')
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: req.t('pages.avatar.fileRequired')
      });
    }

    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const profileResult = await query(
      `SELECT avatar_url FROM page_profiles WHERE page_id = $1`,
      [page.id]
    );
    const currentUrl = profileResult.rows[0]?.avatar_url ?? '';

    const uploaded = await uploadPageAvatar(page.id, req.file);

    await query(
      `UPDATE page_profiles
       SET avatar_url = $1, updated_at = now()
       WHERE page_id = $2`,
      [uploaded.url, page.id]
    );

    if (currentUrl && currentUrl !== uploaded.url) {
      await deleteAvatarByUrl(currentUrl);
    }

    const assembled = await loadAssembledPage(page);

    return res.status(200).json({
      success: true,
      message: req.t('pages.avatar.uploadSuccess'),
      data: {
        avatar_url: uploaded.url,
        page: assembled
      }
    });
  } catch (error) {
    console.error('Page avatar upload error:', error);

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: req.t('pages.avatar.fileTypeInvalid')
      });
    }

    return res.status(500).json({
      success: false,
      message: req.t('pages.avatar.uploadError')
    });
  }
}
