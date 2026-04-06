import express from 'express';
import { getTasks, createTask, updateTask } from '../controllers/taskController';
import { authenticate, requireParent } from '../middlewares/auth';
import { validate, createTaskSchema, updateTaskSchema } from '../middlewares/validators';

const router = express.Router();

// Child can view tasks assigned via tracking endpoints, this is for Parents to manage Tasks.
router.get('/', authenticate, requireParent, getTasks);
router.post('/', authenticate, requireParent, validate(createTaskSchema), createTask);
router.put('/:id', authenticate, requireParent, validate(updateTaskSchema), updateTask);

export default router;
