const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'revisor.google@tarefamesada.com';
  const password = 'RevisorGoogle@2026';
  const name = 'Google Reviewer';

  let parent = await prisma.parent.findUnique({ where: { email } });
  const hash = await bcrypt.hash(password, 10);

  if (parent) {
    parent = await prisma.parent.update({
      where: { email },
      data: { password_hash: hash, name }
    });
    console.log('Parent updated:', parent);
  } else {
    parent = await prisma.parent.create({
      data: {
        name,
        email,
        password_hash: hash
      }
    });
    console.log('Parent created:', parent);
  }

  // Also create a sample child for this parent so the reviewer has data to see
  let child = await prisma.child.findFirst({ where: { parent_id: parent.id } });
  if (!child) {
    child = await prisma.child.create({
      data: {
        name: 'Lucas (Filho Demo)',
        pin: '1234',
        parent_id: parent.id,
        base_allowance: 50.00
      }
    });
    console.log('Sample child created:', child);
  }

  console.log('SUCCESS');
}

main().catch(console.error).finally(() => prisma.$disconnect());
