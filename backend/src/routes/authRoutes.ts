import express from 'express';
import { registerParent, loginParent, loginChild, registerPushToken } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.post('/register', registerParent);
router.post('/login', loginParent);
router.post('/child-login', loginChild);

router.post('/push-token', authenticate, registerPushToken);

export default router;
