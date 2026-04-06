import express from 'express';
import { getChildren, createChild, updateChild, deleteChild } from '../controllers/childrenController';
import { authenticate, requireParent } from '../middlewares/auth';
import { validate, createChildSchema, updateChildSchema } from '../middlewares/validators';

const router = express.Router();

router.get('/', authenticate, requireParent, getChildren);
router.post('/', authenticate, requireParent, validate(createChildSchema), createChild);
router.put('/:id', authenticate, requireParent, validate(updateChildSchema), updateChild);
router.delete('/:id', authenticate, requireParent, deleteChild);

export default router;
