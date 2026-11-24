import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleUpload } from '../middleware/uploadProof.js';
import { createBaptismal, createConfirmation } from '../controllers/requestController.js';

const router = Router();
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many submissions. Try again later.' },
});

router.post('/baptismal', submitLimiter, handleUpload, createBaptismal);
router.post('/confirmation', submitLimiter, handleUpload, createConfirmation);

export default router;