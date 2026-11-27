import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { listMarriages } from '../controllers/marriageController.js';
import { listRequests, listBaptisms, listMasses, searchRegistry, act, getFile, getCertificatePdf } from '../controllers/staffController.js';

const router = Router();
router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/requests', listRequests);
router.get('/baptisms', listBaptisms);
router.get('/masses', listMasses);
router.get('/registry', searchRegistry);
router.post('/requests/:id/:action', act);
router.get('/files/:id', getFile);
router.get('/marriages', listMarriages);
router.get('/requests/:id/certificate.pdf', getCertificatePdf);

export default router;