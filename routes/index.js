import express from 'express';
import registerAuthRoutes from './services/auth.routes.js';
import registerProfileRoutes from './services/profile.routes.js';
import registerPageRoutes from './services/pages.routes.js';

const router = express.Router();

registerAuthRoutes(router);
registerProfileRoutes(router);
registerPageRoutes(router);

export default router;
