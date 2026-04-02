import prisma from './src/config/prisma';

async function main() {
  try {
    console.log('Testing connection...');
    await prisma.$connect();
    console.log('Connected successfully!');
    const count = await prisma.parent.count();
    console.log('Parent count:', count);
  } catch (e) {
    console.error('Connection failed:');
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
