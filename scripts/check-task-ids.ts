import { prisma } from '../src/lib/prisma';

async function main() {
  const tasks = await prisma.task.findMany({
    select: { taskId: true },
    orderBy: { taskId: 'desc' },
    take: 10
  });
  console.log('Recent Task IDs:', tasks.map(t => t.taskId));

  const dieselTank = await prisma.equipment.findFirst({
    where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } }
  });

  if (dieselTank) {
    const dieselTasks = await prisma.task.findMany({
      where: { equipmentId: dieselTank.id }
    });
    console.log('Diesel Tank Tasks:');
    dieselTasks.forEach(t => console.log(`- ID: ${t.id}, taskId: ${t.taskId}, Name: ${t.taskName}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());