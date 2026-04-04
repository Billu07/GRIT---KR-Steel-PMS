import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Fixing Diesel Tank Task IDs...');

  const dieselTank = await prisma.equipment.findFirst({
    where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } }
  });

  if (!dieselTank) {
    console.log('Diesel Tank not found.');
    return;
  }

  const dieselTasks = await prisma.task.findMany({
    where: { equipmentId: dieselTank.id },
    orderBy: { id: 'asc' }
  });

  // Let's use 1001 as the starting point for these manual/new tasks to keep them separate but consistent
  let currentNum = 1001;
  
  for (const task of dieselTasks) {
    const newTaskId = `TSK-${String(currentNum).padStart(4, '0')}`;
    console.log(`Updating Task "${task.taskName}" (ID: ${task.id}): ${task.taskId} -> ${newTaskId}`);
    
    await prisma.task.update({
      where: { id: task.id },
      data: { taskId: newTaskId }
    });
    
    currentNum++;
  }

  console.log('Done fixing Diesel Tank Task IDs.');
}

main().catch(console.error).finally(() => prisma.$disconnect());