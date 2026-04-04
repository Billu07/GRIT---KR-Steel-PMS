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

  // Find the highest existing task ID number to continue sequence
  const allTasks = await prisma.task.findMany({
    select: { taskId: true }
  });

  let maxNum = 0;
  allTasks.forEach(t => {
    if (t.taskId) {
      const match = t.taskId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  console.log(`Current max task number: ${maxNum}`);

  let currentNum = maxNum + 1;
  for (const task of dieselTasks) {
    if (task.taskId && task.taskId.startsWith('EQ-')) {
      const newTaskId = `TSK-${String(currentNum).padStart(4, '0')}`;
      console.log(`Updating Task "${task.taskName}" (ID: ${task.id}): ${task.taskId} -> ${newTaskId}`);
      
      await prisma.task.update({
        where: { id: task.id },
        data: { taskId: newTaskId }
      });
      
      currentNum++;
    } else {
      console.log(`Skipping Task "${task.taskName}" (ID: ${task.id}): Already has standard ID ${task.taskId}`);
    }
  }

  console.log('Done fixing Diesel Tank Task IDs.');
}

main().catch(console.error).finally(() => prisma.$disconnect());