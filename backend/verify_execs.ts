import prisma from './src/config/prisma';
import fs from 'fs';

async function main() {
  const execs = await prisma.taskExecution.findMany({
    include: {
      assignment: { include: { task: true, child: true } }
    }
  });
  
  const out = execs.map(ex => ({
      id: ex.id,
      task: ex.assignment.task.name,
      child: ex.assignment.child.name,
      status: ex.status,
      date: ex.date
  }));
  fs.writeFileSync('execs.json', JSON.stringify(out, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
