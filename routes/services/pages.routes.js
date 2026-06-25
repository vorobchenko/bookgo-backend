import { authenticateToken } from '../../middleware/auth.js';
import { handleAvatarUpload } from '../../middleware/upload-avatar.js';
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
  activatePageServiceHandler,
  createPageServiceCategoryHandler,
  createPageServiceHandler,
  deactivatePageServiceHandler,
  deletePageServiceCategoryHandler,
  deletePageServiceHandler,
  listPageServicesHandler,
  patchPageServiceCategoryHandler,
  patchPageServiceHandler,
  patchPageServicesSettingsHandler
} from '../pages/services-handlers.js';

export default function registerPageRoutes(router) {
  router.get('/pages', authenticateToken, listPages);
  router.post('/pages', authenticateToken, createPage);
  router.get('/pages/:id', authenticateToken, getPage);
  router.patch('/pages/:id', authenticateToken, patchPage);
  router.post('/pages/:id/avatar', authenticateToken, handleAvatarUpload, uploadPageAvatarHandler);
  router.delete('/pages/:id/avatar', authenticateToken, deletePageAvatarHandler);

  router.get('/pages/:id/services', authenticateToken, listPageServicesHandler);
  router.patch('/pages/:id/services/settings', authenticateToken, patchPageServicesSettingsHandler);
  router.post('/pages/:id/services', authenticateToken, createPageServiceHandler);
  router.post(
    '/pages/:id/services/:serviceId/activate',
    authenticateToken,
    activatePageServiceHandler
  );
  router.post(
    '/pages/:id/services/:serviceId/deactivate',
    authenticateToken,
    deactivatePageServiceHandler
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

  router.get('/public/pages/:slug', getPublicPage);
}
