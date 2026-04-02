import express from 'express';
import { getChildren, createChild, updateChild, deleteChild } from '../controllers/childrenController';
import { authenticate, requireParent } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticate, requireParent, getChildren);
router.post('/', authenticate, requireParent, createChild);
router.put('/:id', authenticate, requireParent, updateChild);
router.delete('/:id', authenticate, requireParent, deleteChild);

export default router;
