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

export default function registerPageRoutes(router) {
  router.get('/pages', authenticateToken, listPages);
  router.post('/pages', authenticateToken, createPage);
  router.get('/pages/:id', authenticateToken, getPage);
  router.patch('/pages/:id', authenticateToken, patchPage);
  router.post('/pages/:id/avatar', authenticateToken, handleAvatarUpload, uploadPageAvatarHandler);
  router.delete('/pages/:id/avatar', authenticateToken, deletePageAvatarHandler);
  router.post('/pages/:id/publish', authenticateToken, publishPageHandler);
  router.post('/pages/:id/unpublish', authenticateToken, unpublishPageHandler);
  router.post('/pages/:id/set-default', authenticateToken, setDefaultPageHandler);
  router.delete('/pages/:id', authenticateToken, deletePageHandler);

  router.get('/public/pages/:slug', getPublicPage);
}
