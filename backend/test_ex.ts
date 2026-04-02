import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ex = await prisma.taskExecution.findMany({
    include: { assignment: { include: { task: true } } }
  });
  console.log(JSON.stringify(ex, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
