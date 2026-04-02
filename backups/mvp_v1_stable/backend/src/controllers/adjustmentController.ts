import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/prisma';

export const getMonthlyReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const childId = req.query.childId as string;
    const monthStr = req.query.month as string; // format YYYY-MM

    if (!childId || !monthStr) {
      res.status(400).json({ error: 'childId and month (YYYY-MM) are required' });
      return;
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    if (role === 'parent' && child.parent_id !== req.user?.id) {
       res.status(403).json({ error: 'Forbidden' }); return;
    }
    if (role === 'child' && req.user?.id !== childId) {
       res.status(403).json({ error: 'Forbidden' }); return;
    }

    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 1. Get Base Allowance
    const baseAllowance = Number(child.base_allowance);

    // 2. Fetch all task executions for the month
    const executions = await prisma.taskExecution.findMany({
      where: {
         assignment: { child_id: childId },
         date: { gte: startDate, lte: endDate }
      },
      include: {
        assignment: { include: { task: true } }
      },
      orderBy: { date: 'asc' }
    });

    let bonusesFromTasks = 0;
    let penaltiesFromTasks = 0;
    let penaltiesFromMissedMandatory = 0;

    for (const ex of executions) {
       const taskVal = Number(ex.assignment.task.value);
       
       if (ex.status === 'approved') {
          if (ex.assignment.task.type === 'bonus') bonusesFromTasks += taskVal;
          if (ex.assignment.task.type === 'penalty') penaltiesFromTasks += taskVal;
       } else if (ex.assignment.task.type === 'mandatory') {
          // If rejected, it's a penalty immediately.
          // If pending/completed, it's a penalty ONLY if the date has passed.
          const today = new Date();
          const midnightToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
          if (ex.status === 'rejected' || ex.date < midnightToday) {
             penaltiesFromMissedMandatory += taskVal;
          }
       }
    }

    // 3. Calculate Final
    const finalAllowance = baseAllowance 
                         + bonusesFromTasks 
                         - penaltiesFromTasks 
                         - penaltiesFromMissedMandatory;

    res.json({
       baseAllowance,
       finalAllowance: Math.max(0, finalAllowance),
       breakdown: {
         bonusesFromTasks,
         penaltiesFromTasks,
         penaltiesFromMissedMandatory
       },
       executions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
