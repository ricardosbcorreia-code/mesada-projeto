import express from 'express';
import { registerParent, loginParent, loginChild } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerParent);
router.post('/login', loginParent);
router.post('/child-login', loginChild);

export default router;
