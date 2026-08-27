import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'parent' | 'child';
    parent_id?: string;
    google_id?: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as AuthenticatedRequest['user'];
    req.user = decoded;
    return next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireParent = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'parent') {
    res.status(403).json({ error: 'Forbidden: Requires Parent role' });
    return;
  }
  next();
};

export const requireChild = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'child') {
    res.status(403).json({ error: 'Forbidden: Requires Child role' });
    return;
  }
  next();
};
