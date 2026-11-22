import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { listRequests, searchRegistry, act, getFile } from '../controllers/staffController.js';

const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/requests', listRequests);
router.get('/registry', searchRegistry);
router.post('/requests/:id/:action', act);
router.get('/files/:id', getFile);

export default router;
