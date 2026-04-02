import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const childId = '32766861-55db-4204-b8a7-4cbf-b82cc356d0';
  const now = new Date();
  const minDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const maxDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const executions = await prisma.taskExecution.findMany({
    where: { assignment: { child_id: childId }, date: { gte: minDate, lte: maxDate } },
    include: { assignment: { include: { task: true } } }
  });

  let earnedXP = 0;
  for (const ex of executions) {
    const val = Number(ex.assignment.task.value);
    if (ex.status === 'approved') {
       if (ex.assignment.task.type === 'bonus' || ex.assignment.task.type === 'mandatory') {
         earnedXP += val * 10;
       } else if (ex.assignment.task.type === 'penalty') {
         earnedXP -= val * 10;
       }
    } else if (ex.assignment.task.type === 'mandatory') {
       const midnightToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
       if (ex.status === 'rejected' || ex.date < midnightToday) {
          earnedXP -= val * 10;
       }
    }
  }

  console.log('Resulting XP for Arthur (current month):', earnedXP);
  console.log('Executions counted:', executions.length);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
