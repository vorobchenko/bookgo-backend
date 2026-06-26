import { deleteAvatarByUrl } from '../../services/avatar-storage.js';
import { getPageOwnedByUser } from '../../services/pages.repository.js';
import {
  getPageTheme,
  setPageThemeBackground
} from '../../services/page-theme.repository.js';
import { DEFAULT_THEME_BACKGROUND } from '../../services/page-defaults.js';
import { backgroundImageUrlFromTheme } from '../../utils/theme-background.js';

export async function deletePageBackgroundHandler(req, res) {
  try {
    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const currentTheme = await getPageTheme(page.id);
    const currentImageUrl = backgroundImageUrlFromTheme(currentTheme?.theme?.background);

    if (currentImageUrl) {
      await deleteAvatarByUrl(currentImageUrl);
    }

    const result = await setPageThemeBackground(page.id, { ...DEFAULT_THEME_BACKGROUND });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.background.deleteSuccess'),
      data: { theme: result.theme }
    });
  } catch (error) {
    console.error('Page background delete error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.background.deleteError')
    });
  }
}
