import { authenticateToken } from '../../middleware/auth.js';
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

export default function registerPageRoutes(router) {
  router.get('/pages', authenticateToken, listPages);
  router.post('/pages', authenticateToken, createPage);
  router.get('/pages/:id', authenticateToken, getPage);
  router.patch('/pages/:id', authenticateToken, patchPage);
  router.post('/pages/:id/publish', authenticateToken, publishPageHandler);
  router.post('/pages/:id/unpublish', authenticateToken, unpublishPageHandler);
  router.post('/pages/:id/set-default', authenticateToken, setDefaultPageHandler);
  router.delete('/pages/:id', authenticateToken, deletePageHandler);

  router.get('/public/pages/:slug', getPublicPage);
}
