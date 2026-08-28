import express from 'express';
import { registerParent, loginParent, loginChild, refreshToken, registerPushToken, googleLogin, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { authLimiter, refreshLimiter } from '../middlewares/rateLimiter';
import { validate, registerParentSchema, loginParentSchema, loginChildSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '../middlewares/validators';

const router = express.Router();

router.post('/register', authLimiter, validate(registerParentSchema), registerParent);
router.post('/login', authLimiter, validate(loginParentSchema), loginParent);
router.post('/child-login', authLimiter, validate(loginChildSchema), loginChild);
router.post('/google', authLimiter, googleLogin);
router.post('/refresh', refreshLimiter, validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

router.post('/push-token', authenticate, registerPushToken);

export default router;
