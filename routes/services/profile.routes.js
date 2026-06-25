import { authenticateToken } from '../../middleware/auth.js';
import { handleAvatarUpload } from '../../middleware/upload-avatar.js';
import profileInfo from '../profile/info.js';
import profileEdit from '../profile/edit.js';
import profileChangePassword from '../profile/change-password.js';
import profileUploadAvatar from '../profile/upload-avatar.js';
import profileDeleteAvatar from '../profile/delete-avatar.js';

export default function registerProfileRoutes(router) {
  router.get('/profile/info', authenticateToken, profileInfo);
  router.patch('/profile/edit', authenticateToken, profileEdit);
  router.put('/profile/change-password', authenticateToken, profileChangePassword);
  router.post('/profile/avatar', authenticateToken, handleAvatarUpload, profileUploadAvatar);
  router.delete('/profile/avatar', authenticateToken, profileDeleteAvatar);
}
