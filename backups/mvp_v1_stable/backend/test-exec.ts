import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    include: { assignments: true }
  });
  console.log("TASKS:");
  console.dir(tasks, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
