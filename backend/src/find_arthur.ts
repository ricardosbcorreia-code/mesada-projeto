import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const child = await prisma.child.findFirst({
    where: { name: { contains: 'Arthur' } }
  });
  console.log(JSON.stringify(child, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
