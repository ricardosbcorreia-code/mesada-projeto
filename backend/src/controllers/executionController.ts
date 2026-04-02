import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';
import { sendPushNotification } from '../services/notificationService';

// Helper to determine if a task should be executed today based on recurrence
const shouldCreateExecution = (task: any, date: Date): boolean => {
  const { recurrence_type, recurrence_interval, recurrence_days, recurrence_month, created_at } = task;
  
  // Normalize dates to midnight for calculations
  const start = new Date(created_at);
  const startDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const todayDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  
  const diffTime = todayDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return false; // Task hasn't started yet

  const interval = recurrence_interval || 1;

  if (recurrence_type === 'daily') {
    return diffDays % interval === 0;
  }
  
  if (recurrence_type === 'weekly') {
    const dayOfWeek = todayDate.getUTCDay(); // 0-6
    if (!recurrence_days.includes(dayOfWeek)) return false;
    
    // Calculate weeks diff. A week starts on Sunday (0)
    // To be precise: (Weeks since start week) % interval === 0
    const startWeek = Math.floor((startDate.getTime() / (1000 * 60 * 60 * 24 * 7)));
    const todayWeek = Math.floor((todayDate.getTime() / (1000 * 60 * 60 * 24 * 7)));
    return (todayWeek - startWeek) % interval === 0;
  }
  
  if (recurrence_type === 'monthly') {
    const dayOfMonth = todayDate.getUTCDate();
    return recurrence_days.includes(dayOfMonth);
  }
  
  if (recurrence_type === 'yearly') {
    const month = todayDate.getUTCMonth() + 1; // 1-12
    const dayOfMonth = todayDate.getUTCDate();
    return month === recurrence_month && recurrence_days.includes(dayOfMonth);
  }
  
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
      if (shouldCreateExecution(assignment.task, targetDate)) {
        // Check if execution already exists for this date
        const existing = await prisma.taskExecution.findFirst({
          where: {
            assignment_id: assignment.id,
            date: searchDate,
          }
        });

        if (!existing) {
          // Create execution
          const newExecution = await prisma.taskExecution.create({
            data: {
              assignment_id: assignment.id,
              date: searchDate,
              status: 'pending'
            }
          });

          // Create SubTaskCompletion entries for each subtask of this task
          const subtasks = await prisma.subTask.findMany({
            where: { task_id: assignment.task.id },
            orderBy: { order: 'asc' }
          });

          if (subtasks.length > 0) {
            await prisma.subTaskCompletion.createMany({
              data: subtasks.map(st => ({
                subtask_id: st.id,
                execution_id: newExecution.id,
                checked: false,
              }))
            });
          }
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
          include: {
            task: {
              include: { subtasks: { orderBy: { order: 'asc' } } }
            },
            child: { select: { name: true } }
          }
        },
        subtask_completions: true
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

    if (status === 'completed') {
      const parent = await prisma.parent.findUnique({
        where: { id: execution.assignment.task.parent_id },
        select: { expo_push_token: true }
      });
      if (parent?.expo_push_token) {
        await sendPushNotification(
          parent.expo_push_token,
          'Tarefa Entregue! 📝',
          `A tarefa "${execution.assignment.task.name}" foi entregue e aguarda aprovação.`
        );
      }
    } else if (status === 'approved' || status === 'rejected') {
      const child = await prisma.child.findUnique({
        where: { id: execution.assignment.child_id },
        select: { expo_push_token: true }
      });
      if (child?.expo_push_token) {
        const title = status === 'approved' ? 'Tarefa Aprovada! ✅' : 'Tarefa Rejeitada ❌';
        const body = status === 'approved' 
          ? `Sua tarefa "${execution.assignment.task.name}" foi aprovada.` 
          : `Sua tarefa "${execution.assignment.task.name}" precisa ser refeita.`;
        await sendPushNotification(child.expo_push_token, title, body);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/executions/:id/subtasks/:subtaskId
export const toggleSubTaskCompletion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const executionId = req.params.id as string;
    const subtaskId = req.params.subtaskId as string;
    const { checked } = req.body;

    if (typeof checked !== 'boolean') {
      res.status(400).json({ error: 'checked (boolean) is required' });
      return;
    }

    // Only children can toggle their checklist items
    if (role !== 'child') {
      res.status(403).json({ error: 'Only children can update subtask completions' });
      return;
    }

    // Verify the execution belongs to this child
    const execution = await (prisma as any).taskExecution.findUnique({
      where: { id: executionId },
      include: { assignment: true }
    });

    if (!execution || execution.assignment.child_id !== req.user?.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const updated = await (prisma as any).subTaskCompletion.update({
      where: { subtask_id_execution_id: { subtask_id: subtaskId, execution_id: executionId } },
      data: { checked, checked_at: checked ? new Date() : null }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
