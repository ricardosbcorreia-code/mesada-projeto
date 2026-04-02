import express from 'express';
import { getMonthlyReport } from '../controllers/adjustmentController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/monthly', authenticate, getMonthlyReport);

export default router;
