import { deleteAvatarByUrl, uploadServicePhoto } from '../../services/avatar-storage.js';
import { getPageOwnedByUser } from '../../services/pages.repository.js';
import { updatePageServiceItem } from '../../services/page-services.repository.js';
import { isS3StorageConfigured } from '../../utils/s3-storage.js';
import { isUuid } from '../../utils/slug.js';
import { query } from '../../utils/db.js';

async function getOwnedService(pageId, serviceId, userId) {
  const page = await getPageOwnedByUser(pageId, userId);
  if (!page) {
    return { page: null, service: null };
  }

  const result = await query(
    `SELECT photo_url FROM page_service_items WHERE id = $1 AND page_id = $2`,
    [serviceId, pageId]
  );

  return {
    page,
    service: result.rows[0] ?? null
  };
}

export async function uploadServicePhotoHandler(req, res) {
  try {
    if (!isS3StorageConfigured()) {
      return res.status(503).json({
        success: false,
        message: req.t('pages.services.photo.storageNotConfigured')
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: req.t('pages.services.photo.fileRequired')
      });
    }

    const { id: pageId, serviceId } = req.params;
    if (!isUuid(serviceId)) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    const { page, service } = await getOwnedService(pageId, serviceId, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    const currentUrl = service.photo_url ?? '';
    const uploaded = await uploadServicePhoto(page.id, serviceId, req.file);

    const result = await updatePageServiceItem(page.id, serviceId, {
      photoUrl: uploaded.url
    });

    if (currentUrl && currentUrl !== uploaded.url) {
      await deleteAvatarByUrl(currentUrl);
    }

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.photo.uploadSuccess'),
      data: {
        photoUrl: uploaded.url,
        ...result
      }
    });
  } catch (error) {
    console.error('Service photo upload error:', error);

    if (error.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({
        success: false,
        message: req.t('pages.services.photo.fileTypeInvalid')
      });
    }

    return res.status(500).json({
      success: false,
      message: req.t('pages.services.photo.uploadError')
    });
  }
}

export async function deleteServicePhotoHandler(req, res) {
  try {
    const { id: pageId, serviceId } = req.params;
    if (!isUuid(serviceId)) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    const { page, service } = await getOwnedService(pageId, serviceId, req.user.id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.get.notFound')
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: req.t('pages.services.notFound')
      });
    }

    const currentUrl = service.photo_url ?? '';
    if (currentUrl) {
      await deleteAvatarByUrl(currentUrl);
    }

    const result = await updatePageServiceItem(page.id, serviceId, { photoUrl: '' });

    return res.status(200).json({
      success: true,
      message: req.t('pages.services.photo.deleteSuccess'),
      data: result
    });
  } catch (error) {
    console.error('Service photo delete error:', error);
    return res.status(500).json({
      success: false,
      message: req.t('pages.services.photo.deleteError')
    });
  }
}
