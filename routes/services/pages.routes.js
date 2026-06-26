import { authenticateToken } from '../../middleware/auth.js';
import { handleAvatarUpload, handleServicePhotoUpload } from '../../middleware/upload-avatar.js';
import {
  createPage,
  deletePageHandler,
  getPage,
  getPublicPage,
  listPages,
  patchPage,
  publishPageHandler,
  setDefaultPageHandler,
  unpublishPageHandler
} from '../pages/handlers.js';
import { deletePageAvatarHandler } from '../pages/delete-avatar.js';
import { uploadPageAvatarHandler } from '../pages/upload-avatar.js';
import {
  archivePageServiceHandler,
  createPageServiceCategoryHandler,
  createPageServiceHandler,
  deletePageServiceCategoryHandler,
  deletePageServiceHandler,
  listPageServicesHandler,
  patchPageServiceCategoryHandler,
  patchPageServiceHandler,
  patchPageServicesSettingsHandler,
  reorderPageServicesHandler,
  restorePageServiceHandler
} from '../pages/services-handlers.js';
import {
  deleteServicePhotoHandler,
  uploadServicePhotoHandler
} from '../pages/service-photo.js';
import {
  getPageThemeHandler,
  patchPageThemeHandler
} from '../pages/theme-handlers.js';
import {
  getPageAvailabilityHandler,
  patchPageAvailabilityHandler,
  patchPageBookingRulesHandler,
  patchPageWeeklyHoursHandler
} from '../pages/availability-handlers.js';
import { getPageSlotsHandler, getPublicPageSlotsHandler } from '../pages/slots-handlers.js';

export default function registerPageRoutes(router) {
  router.get('/pages', authenticateToken, listPages);
  router.post('/pages', authenticateToken, createPage);
  router.get('/pages/:id', authenticateToken, getPage);
  router.patch('/pages/:id', authenticateToken, patchPage);
  router.post('/pages/:id/avatar', authenticateToken, handleAvatarUpload, uploadPageAvatarHandler);
  router.delete('/pages/:id/avatar', authenticateToken, deletePageAvatarHandler);

  router.get('/pages/:id/theme', authenticateToken, getPageThemeHandler);
  router.patch('/pages/:id/theme', authenticateToken, patchPageThemeHandler);

  router.get('/pages/:id/availability', authenticateToken, getPageAvailabilityHandler);
  router.patch(
    '/pages/:id/availability/weekly-hours',
    authenticateToken,
    patchPageWeeklyHoursHandler
  );
  router.patch(
    '/pages/:id/availability/booking-rules',
    authenticateToken,
    patchPageBookingRulesHandler
  );
  router.patch('/pages/:id/availability', authenticateToken, patchPageAvailabilityHandler);

  router.get('/pages/:id/slots', authenticateToken, getPageSlotsHandler);

  router.get('/pages/:id/services', authenticateToken, listPageServicesHandler);
  router.patch('/pages/:id/services/settings', authenticateToken, patchPageServicesSettingsHandler);
  router.put('/pages/:id/services/order', authenticateToken, reorderPageServicesHandler);
  router.post('/pages/:id/services', authenticateToken, createPageServiceHandler);
  router.post(
    '/pages/:id/services/:serviceId/archive',
    authenticateToken,
    archivePageServiceHandler
  );
  router.post(
    '/pages/:id/services/:serviceId/restore',
    authenticateToken,
    restorePageServiceHandler
  );
  router.post(
    '/pages/:id/services/:serviceId/activate',
    authenticateToken,
    restorePageServiceHandler
  );
  router.post(
    '/pages/:id/services/:serviceId/deactivate',
    authenticateToken,
    archivePageServiceHandler
  );
  router.post(
    '/pages/:id/services/:serviceId/photo',
    authenticateToken,
    handleServicePhotoUpload,
    uploadServicePhotoHandler
  );
  router.delete(
    '/pages/:id/services/:serviceId/photo',
    authenticateToken,
    deleteServicePhotoHandler
  );
  router.patch('/pages/:id/services/:serviceId', authenticateToken, patchPageServiceHandler);
  router.delete('/pages/:id/services/:serviceId', authenticateToken, deletePageServiceHandler);

  router.post(
    '/pages/:id/service-categories',
    authenticateToken,
    createPageServiceCategoryHandler
  );
  router.patch(
    '/pages/:id/service-categories/:categoryId',
    authenticateToken,
    patchPageServiceCategoryHandler
  );
  router.delete(
    '/pages/:id/service-categories/:categoryId',
    authenticateToken,
    deletePageServiceCategoryHandler
  );

  router.post('/pages/:id/publish', authenticateToken, publishPageHandler);
  router.post('/pages/:id/unpublish', authenticateToken, unpublishPageHandler);
  router.post('/pages/:id/set-default', authenticateToken, setDefaultPageHandler);
  router.delete('/pages/:id', authenticateToken, deletePageHandler);

  router.get('/public/pages/:slug/slots', getPublicPageSlotsHandler);
  router.get('/public/pages/:slug', getPublicPage);
}
