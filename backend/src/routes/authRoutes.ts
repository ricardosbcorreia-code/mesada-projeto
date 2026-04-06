import express from 'express';
import { registerParent, loginParent, loginChild, refreshToken, registerPushToken } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { authLimiter, refreshLimiter } from '../middlewares/rateLimiter';
import { validate, registerParentSchema, loginParentSchema, loginChildSchema, refreshTokenSchema } from '../middlewares/validators';

const router = express.Router();

router.post('/register', authLimiter, validate(registerParentSchema), registerParent);
router.post('/login', authLimiter, validate(loginParentSchema), loginParent);
router.post('/child-login', authLimiter, validate(loginChildSchema), loginChild);
router.post('/refresh', refreshLimiter, validate(refreshTokenSchema), refreshToken);

router.post('/push-token', authenticate, registerPushToken);

export default router;
