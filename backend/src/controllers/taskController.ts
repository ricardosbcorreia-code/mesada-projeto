import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';
import { sendPushNotification } from '../services/notificationService';

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
        subtasks: { orderBy: { order: 'asc' } },
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
    const { 
      name, description, type, value, childIds, subtasks,
      recurrence_type, recurrence_interval, recurrence_days, recurrence_month 
    } = req.body;

    if (!parentId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || !type || value === undefined || !recurrence_type) {
      res.status(400).json({ error: 'Missing required task fields' });
      return;
    }

    // Create the task with subtasks
    const task = await prisma.task.create({
      data: {
        parent_id: parentId,
        name,
        description,
        type,
        value,
        recurrence_type,
        recurrence_interval: recurrence_interval || 1,
        recurrence_days: recurrence_days || [],
        recurrence_month: recurrence_month || null,
        subtasks: subtasks && Array.isArray(subtasks) && subtasks.length > 0
          ? { create: subtasks.map((label: string, idx: number) => ({ label, order: idx })) }
          : undefined,
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

      const childrenTokens = await prisma.child.findMany({
        where: { id: { in: childIds } },
        select: { expo_push_token: true, name: true }
      });

      for (const child of childrenTokens) {
        if (child.expo_push_token) {
          await sendPushNotification(
            child.expo_push_token, 
            'Nova Missão! 🚀', 
            `Sua nova tarefa: ${name}`
          );
        }
      }
    }

    const taskWithAssignments = await prisma.task.findUnique({
      where: { id: task.id },
      include: { assignments: true, subtasks: { orderBy: { order: 'asc' } } }
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
    const { 
      name, description, type, value, childIds, subtasks,
      recurrence_type, recurrence_interval, recurrence_days, recurrence_month
    } = req.body;

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
          recurrence_type: recurrence_type !== undefined ? recurrence_type : (existingTask as any).recurrence_type,
          recurrence_interval: recurrence_interval !== undefined ? recurrence_interval : (existingTask as any).recurrence_interval,
          recurrence_days: recurrence_days !== undefined ? recurrence_days : (existingTask as any).recurrence_days,
          recurrence_month: recurrence_month !== undefined ? recurrence_month : (existingTask as any).recurrence_month,
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

      // Sync subtasks if provided
      if (subtasks && Array.isArray(subtasks)) {
        await tx.subTask.deleteMany({ where: { task_id: taskId as string } });
        if (subtasks.length > 0) {
          await tx.subTask.createMany({
            data: subtasks.map((label: string, idx: number) => ({
              task_id: taskId as string,
              label,
              order: idx,
            }))
          });
        }
      }

      return await tx.task.findUnique({
        where: { id: taskId as string },
        include: {
          subtasks: { orderBy: { order: 'asc' } },
          assignments: { include: { child: { select: { id: true, name: true } } } }
        }
      });
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
