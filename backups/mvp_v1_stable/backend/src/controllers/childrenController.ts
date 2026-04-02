import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';

export const getChildren = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const children = await prisma.child.findMany({
      where: { parent_id: parentId },
      select: {
        id: true,
        name: true,
        base_allowance: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    res.json(children);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createChild = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id;
    const { name, pin, base_allowance } = req.body;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || !pin) {
      res.status(400).json({ error: 'Name and PIN are required' });
      return;
    }

    // PIN should ideally be exactly 4 digits.
    if (!/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      return;
    }

    const child = await prisma.child.create({
      data: {
        parent_id: parentId,
        name,
        pin: String(pin), // Store as plain text for kids MVP - they just tap their avatar and enter 4 digits.
        base_allowance: base_allowance || 0,
      },
    });

    res.status(201).json({
      id: child.id,
      name: child.name,
      base_allowance: child.base_allowance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateChild = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id;
    const childId = req.params.id;
    const { name, pin, base_allowance } = req.body;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify child belongs to parent
    const existingChild = await prisma.child.findUnique({
      where: { id: childId as string },
    });

    if (!existingChild || existingChild.parent_id !== parentId) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must be exactly 4 digits' });
      return;
    }

    const updatedChild = await prisma.child.update({
      where: { id: childId as string },
      data: {
        name: name !== undefined ? name : existingChild.name,
        pin: pin !== undefined ? String(pin) : existingChild.pin,
        base_allowance: base_allowance !== undefined ? base_allowance : existingChild.base_allowance,
      },
    });

    res.json({
      id: updatedChild.id,
      name: updatedChild.name,
      base_allowance: updatedChild.base_allowance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
