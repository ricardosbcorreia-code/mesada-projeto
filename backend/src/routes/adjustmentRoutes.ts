import express from 'express';
import { getMonthlyReport, getHistoryReport } from '../controllers/adjustmentController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/monthly', authenticate, getMonthlyReport);
router.get('/history', authenticate, getHistoryReport);

export default router;
