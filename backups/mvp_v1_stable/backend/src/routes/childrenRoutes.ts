import express from 'express';
import { getChildren, createChild, updateChild } from '../controllers/childrenController';
import { authenticate, requireParent } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticate, requireParent, getChildren);
router.post('/', authenticate, requireParent, createChild);
router.put('/:id', authenticate, requireParent, updateChild);

export default router;
