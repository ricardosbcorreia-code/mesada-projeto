import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';

// Helper to determine if a task should be executed today based on recurrence
const shouldCreateExecution = (recurrence: string, date: Date): boolean => {
  // In a real app we'd check days of week. For MVP:
  // daily: every day
  // weekly: once a week (e.g., Monday)
  // monthly: once a month (e.g., 1st day)
  
  if (recurrence === 'daily') return true;
  
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  
  if (recurrence === 'weekly' && dayOfWeek === 1) return true; // Mondays
  if (recurrence === 'monthly' && dayOfMonth === 1) return true; // 1st of month
  
  return false;
};

// GET /api/executions?childId=X&date=Y
export const getExecutions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.id; // Could be parent or child (if child, we check child role)
    const role = req.user?.role;
    
    // Determine childId to query
    let targetChildId: string;
    
    if (role === 'child') {
      targetChildId = req.user!.id;
    } else {
      targetChildId = req.query.childId as string;
      if (!targetChildId) {
        res.status(400).json({ error: 'childId is required for parent request' });
        return;
      }
      // verify parent owns child
      const childCheck = await prisma.child.findUnique({ where: { id: targetChildId } });
      if (!childCheck || childCheck.parent_id !== parentId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    }

    const dateStr = req.query.date as string;
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    // Normalize date to midnight UTC for DB comparison
    const searchDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

    // 1. Fetch all active assignments for this child
    const assignments = await prisma.taskAssignment.findMany({
      where: { child_id: targetChildId, active: true },
      include: { task: true }
    });

    // 2. Generate executions for today if they don't exist yet (Lazy generation MVP approach)
    for (const assignment of assignments) {
      if (shouldCreateExecution(assignment.task.recurrence, targetDate)) {
        // Check if execution already exists for this date
        const existing = await prisma.taskExecution.findFirst({
          where: {
            assignment_id: assignment.id,
            date: searchDate,
          }
        });

        if (!existing) {
          await prisma.taskExecution.create({
             data: {
               assignment_id: assignment.id,
               date: searchDate,
               status: 'pending'
             }
          });
        }
      }
    }

    // 3. Return executions for the date
    const executions = await prisma.taskExecution.findMany({
      where: {
        assignment: { child_id: targetChildId },
        date: searchDate
      },
      include: {
        assignment: {
          include: { task: true }
        }
      }
    });

    res.json(executions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/executions/:id/status
export const updateExecutionStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const executionId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'completed', 'approved', 'rejected'].includes(status)) {
       res.status(400).json({ error: 'Invalid status' });
       return;
    }

    const execution = await prisma.taskExecution.findUnique({
      where: { id: executionId as string },
      include: {
        assignment: {
          include: { task: true }
        }
      }
    });

    if (!execution) {
      res.status(404).json({ error: 'Execution not found' });
      return;
    }

    // Authorization checks
    if (role === 'child') {
      // Children can only change pending -> completed
      if (execution.assignment.child_id !== req.user?.id) {
        res.status(403).json({ error: 'Forbidden' }); return;
      }
      if (status !== 'completed' && status !== 'pending') {
         res.status(403).json({ error: 'Children can only mark tasks as completed or pending' }); return;
      }
    } else {
      // Parent
      if (execution.assignment.task.parent_id !== req.user?.id) {
         res.status(403).json({ error: 'Forbidden' }); return;
      }
    }

    const updated = await prisma.taskExecution.update({
      where: { id: executionId as string },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
