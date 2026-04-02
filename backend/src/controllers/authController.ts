import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-mvp';

export const registerParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    console.log(`[Register] Attempt for email: ${email}`);

    if (!name || !email || !password) {
      console.log('[Register] Missing fields');
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existingUser = await prisma.parent.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const parent = await prisma.parent.create({
      data: {
        name,
        email,
        password_hash,
      },
      select: { id: true, name: true, email: true }, // Don't return hash
    });

    const token = jwt.sign({ id: parent.id, role: 'parent' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ parent, token });
  } catch (error) {
    console.error('[Register] ERROR:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) });
  }
};

export const loginParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const parent = await prisma.parent.findUnique({ where: { email } });
    if (!parent) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, parent.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ id: parent.id, role: 'parent' }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ parent: { id: parent.id, name: parent.name, email: parent.email }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const loginChild = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentEmail, pin } = req.body;

    if (!parentEmail || !pin) {
      res.status(400).json({ error: 'Parent email and PIN are required' });
      return;
    }

    const parent = await prisma.parent.findUnique({ 
      where: { email: parentEmail },
      include: { children: true }
    });

    if (!parent) {
      res.status(401).json({ error: 'E-mail do responsável não encontrado.' });
      return;
    }

    const child = parent.children.find(c => c.pin === String(pin));

    if (!child) {
      res.status(401).json({ error: 'PIN inválido para esta família.' });
      return;
    }

    const token = jwt.sign({ id: child.id, role: 'child', parent_id: child.parent_id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ child: { id: child.id, name: child.name, base_allowance: child.base_allowance }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const registerPushToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    if (role === 'parent') {
      await prisma.parent.update({
        where: { id: userId },
        data: { expo_push_token: token }
      });
    } else if (role === 'child') {
      await prisma.child.update({
        where: { id: userId },
        data: { expo_push_token: token }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
