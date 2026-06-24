import { authenticateToken } from '../../middleware/auth.js';
import profileInfo from '../profile/info.js';
import profileEdit from '../profile/edit.js';
import profileChangePassword from '../profile/change-password.js';

export default function registerProfileRoutes(router) {
  router.get('/profile/info', authenticateToken, profileInfo);
  router.patch('/profile/edit', authenticateToken, profileEdit);
  router.put('/profile/change-password', authenticateToken, profileChangePassword);
}
