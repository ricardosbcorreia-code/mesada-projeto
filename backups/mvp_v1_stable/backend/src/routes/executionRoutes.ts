import express from 'express';
import { getExecutions, updateExecutionStatus } from '../controllers/executionController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticate, getExecutions);
router.patch('/:id/status', authenticate, updateExecutionStatus);

export default router;
