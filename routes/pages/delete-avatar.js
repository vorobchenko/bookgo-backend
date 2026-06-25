import { query } from '../../utils/db.js';
import { deleteAvatarByUrl } from '../../services/avatar-storage.js';
import { getPageOwnedByUser } from '../../services/pages.repository.js';
import { loadAssembledPage } from './handlers.js';

export async function deletePageAvatarHandler(req, res) {
  try {
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

    if (currentUrl) {
      await deleteAvatarByUrl(currentUrl);
    }

    await query(
      `UPDATE page_profiles
       SET avatar_url = '', updated_at = now()
       WHERE page_id = $1`,
      [page.id]
    );

    const assembled = await loadAssembledPage(page);

    return res.status(200).json({
      success: true,
      message: req.t('pages.avatar.deleteSuccess'),
      data: { page: assembled }
    });
  } catch (error) {
    console.error('Page avatar delete error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.avatar.deleteError')
    });
  }
}
