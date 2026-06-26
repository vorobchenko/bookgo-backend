import { deleteAvatarByUrl, uploadPageBackground } from '../../services/avatar-storage.js';
import { getPageOwnedByUser } from '../../services/pages.repository.js';
import {
  getPageTheme,
  setPageThemeBackground
} from '../../services/page-theme.repository.js';
import { isS3StorageConfigured } from '../../utils/s3-storage.js';
import { backgroundImageUrlFromTheme } from '../../utils/theme-background.js';

export async function uploadPageBackgroundHandler(req, res) {
  try {
    if (!isS3StorageConfigured()) {
      return res.status(503).json({
        success: false,
        message: req.t('pages.background.storageNotConfigured')
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: req.t('pages.background.fileRequired')
      });
    }

    const page = await getPageOwnedByUser(req.params.id, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    const currentTheme = await getPageTheme(page.id);
    const currentBackground = currentTheme?.theme?.background;
    const currentImageUrl = backgroundImageUrlFromTheme(currentBackground);

    const uploaded = await uploadPageBackground(page.id, req.file);

    const nextBackground = {
      type: 'image',
      image_url: uploaded.url,
      position: currentBackground?.position ?? 'center',
      overlay_color: currentBackground?.overlay_color ?? '#000000',
      overlay_opacity: currentBackground?.overlay_opacity ?? 0.5
    };

    const result = await setPageThemeBackground(page.id, nextBackground);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    if (currentImageUrl && currentImageUrl !== uploaded.url) {
      await deleteAvatarByUrl(currentImageUrl);
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.background.uploadSuccess'),
      data: {
        image_url: uploaded.url,
        theme: result.theme
      }
    });
  } catch (error) {
    console.error('Page background upload error:', error);

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: req.t('pages.background.fileTypeInvalid')
      });
    }

    return res.status(500).json({
      success: false,
      message: req.t('pages.background.uploadError')
    });
  }
}
