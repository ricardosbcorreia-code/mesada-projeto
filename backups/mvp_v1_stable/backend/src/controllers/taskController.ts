import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { parent_id: parentId },
      include: {
        assignments: {
          include: {
            child: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id;
    const { name, description, type, value, recurrence, childIds } = req.body;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || !type || value === undefined || !recurrence) {
      res.status(400).json({ error: 'Missing required task fields' });
      return;
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        parent_id: parentId,
        name,
        description,
        type,
        value,
        recurrence,
      }
    });

    // Create assignments if child IDs are provided
    if (childIds && Array.isArray(childIds) && childIds.length > 0) {
      const assignments = childIds.map((childId: string) => ({
        task_id: task.id,
        child_id: childId,
        active: true,
      }));

      await prisma.taskAssignment.createMany({
        data: assignments
      });
    }

    const taskWithAssignments = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignments: true }
    });

    res.status(201).json(taskWithAssignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id;
    const taskId = req.params.id;
    const { name, description, type, value, recurrence, childIds } = req.body;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId as string }
    });

    if (!existingTask || existingTask.parent_id !== parentId) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId as string },
        data: {
          name: name !== undefined ? name : existingTask.name,
          description: description !== undefined ? description : existingTask.description,
          type: type !== undefined ? type : existingTask.type,
          value: value !== undefined ? value : existingTask.value,
          recurrence: recurrence !== undefined ? recurrence : existingTask.recurrence,
        }
      });

      if (childIds && Array.isArray(childIds)) {
        await tx.taskAssignment.deleteMany({
          where: { task_id: taskId as string }
        });

        if (childIds.length > 0) {
          const assignments = childIds.map((childId: string) => ({
            task_id: taskId as string,
            child_id: childId,
            active: true,
          }));

          await tx.taskAssignment.createMany({
            data: assignments
          });
        }
      }

      return await tx.task.findUnique({
        where: { id: taskId as string },
        include: { assignments: { include: { child: { select: { id: true, name: true } } } } }
      });
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
