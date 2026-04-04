import { prisma } from '../src/lib/prisma';

async function main() {
  const task = await prisma.task.findFirst({
    where: { taskId: { contains: '984529' } }
  });
  console.log('Task found:', task);
}

main().catch(console.error).finally(() => prisma.$disconnect());