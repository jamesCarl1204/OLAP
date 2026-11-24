import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleUpload, handleBaptismUploads } from '../middleware/uploadProof.js';
import { createBaptismal, createConfirmation, createNoRecord } from '../controllers/requestController.js';
import { createRegistration } from '../controllers/baptismController.js';
import { createMass } from '../controllers/massController.js';

const router = Router();
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many submissions. Try again later.' },
});

router.post('/baptismal', submitLimiter, handleUpload, createBaptismal);
router.post('/confirmation', submitLimiter, handleUpload, createConfirmation);
router.post('/no-record/:kind', submitLimiter, handleUpload, createNoRecord);
router.post('/baptism-registration', submitLimiter, handleBaptismUploads, createRegistration);
router.post('/mass-intention', submitLimiter, handleUpload, createMass);

export default router;