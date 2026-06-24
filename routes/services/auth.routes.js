import login from '../auth/login.js';
import logout from '../auth/logout.js';
import { authenticateToken } from '../../middleware/auth.js';

export default function registerAuthRoutes(router) {
  router.post('/auth/login', login);
  router.post('/auth/logout', authenticateToken, logout);
}
