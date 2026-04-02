import express from 'express';
import { getExecutions, updateExecutionStatus, toggleSubTaskCompletion } from '../controllers/executionController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticate, getExecutions);
router.patch('/:id/status', authenticate, updateExecutionStatus);
router.patch('/:id/subtasks/:subtaskId', authenticate, toggleSubTaskCompletion);

export default router;
