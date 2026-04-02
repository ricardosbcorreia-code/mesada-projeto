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
    let earnedXP = 0;

    for (const ex of executions) {
       const taskVal = Number(ex.assignment.task.value);
       
       if (ex.status === 'approved') {
          if (ex.assignment.task.type === 'bonus') {
            bonusesFromTasks += taskVal;
            earnedXP += taskVal * 10;
          } else if (ex.assignment.task.type === 'mandatory') {
            earnedXP += taskVal * 10;
          } else if (ex.assignment.task.type === 'penalty') {
            penaltiesFromTasks += taskVal;
            earnedXP -= taskVal * 10;
          }
       } else if (ex.assignment.task.type === 'mandatory') {
          const today = new Date();
          const midnightToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
          if (ex.status === 'rejected' || ex.date < midnightToday) {
             penaltiesFromMissedMandatory += taskVal;
             earnedXP -= taskVal * 10;
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
         penaltiesFromMissedMandatory,
         earnedXP: Math.max(0, earnedXP)
       },
       executions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getHistoryReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const childId = req.query.childId as string;
    const limit = Number(req.query.limit) || 6;

    if (!childId) {
      res.status(400).json({ error: 'childId is required' }); return;
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) { res.status(404).json({ error: 'Child not found' }); return; }
    if (role === 'parent' && child.parent_id !== req.user?.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    if (role === 'child' && req.user?.id !== childId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const now = new Date();
    // generate last N months
    const months: string[] = [];
    for (let i = limit - 1; i >= 0; i--) {
       const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
       months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const startYear = Number(months[0].split('-')[0]);
    const startMonth = Number(months[0].split('-')[1]);
    const minDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
    const maxDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const executions = await prisma.taskExecution.findMany({
      where: { assignment: { child_id: childId }, date: { gte: minDate, lte: maxDate } },
      include: { assignment: { include: { task: true } } }
    });

    const baseAllowance = Number(child.base_allowance);
    const history = months.map(mStr => {
       const [y, m] = mStr.split('-').map(Number);
       const monthStart = new Date(Date.UTC(y, m - 1, 1));
       const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

       const monthExecs = executions.filter(ex => ex.date >= monthStart && ex.date <= monthEnd);
       
       let bonuses = 0, penalties = 0, missed = 0, earnedXP = 0;
       for (const ex of monthExecs) {
          const val = Number(ex.assignment.task.value);
          if (ex.status === 'approved') {
             if (ex.assignment.task.type === 'bonus') {
               bonuses += val;
               earnedXP += val * 10;
             } else if (ex.assignment.task.type === 'mandatory') {
               earnedXP += val * 10;
             } else if (ex.assignment.task.type === 'penalty') {
               penalties += val;
               earnedXP -= val * 10;
             }
          } else if (ex.assignment.task.type === 'mandatory') {
             const today = new Date();
             const midnightToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
             if (ex.status === 'rejected' || ex.date < midnightToday) {
                missed += val;
                earnedXP -= val * 10;
             }
          }
       }
       const finalAllowance = Math.max(0, baseAllowance + bonuses - penalties - missed);

       return {
         month: mStr,
         baseAllowance,
         finalAllowance,
         breakdown: { bonuses, penalties, missed, earnedXP: Math.max(0, earnedXP) }
       };
    });

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
