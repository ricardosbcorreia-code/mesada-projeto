import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('FATAL: JWT_SECRET or JWT_REFRESH_SECRET environment variable is not defined.');
}

const generateTokens = (payload: object) => {
  const accessToken = jwt.sign(payload, JWT_SECRET as string, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET as string, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

export const registerParent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

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
      select: { id: true, name: true, email: true },
    });

    const tokens = generateTokens({ id: parent.id, role: 'parent' });

    res.status(201).json({ parent, ...tokens });
  } catch (error) {
    console.error('[Register] ERROR:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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

    const tokens = generateTokens({ id: parent.id, role: 'parent' });

    res.json({ parent: { id: parent.id, name: parent.name, email: parent.email }, ...tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const loginChild = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentEmail, pin } = req.body;

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

    // Children stay logged in for 30d, but we still give a refresh token
    const tokens = generateTokens({ id: child.id, role: 'child', parent_id: child.parent_id });

    res.json({ child: { id: child.id, name: child.name, base_allowance: child.base_allowance }, ...tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET as string) as any;
      
      // Remove iat and exp from payload to create new one
      const { iat, exp, ...payload } = decoded;
      const tokens = generateTokens(payload);

      res.json(tokens);
    } catch (err) {
      res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }
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
