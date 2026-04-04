import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Aligning all weekly tasks and logs to March 1st...');

  const targetDate = new Date('2026-03-01T00:00:00.000Z');
  const nextDueDate = new Date('2026-03-08T00:00:00.000Z'); // 7 days later
  const startDate = new Date('2026-03-01T00:00:00.000Z');
  const endDate = new Date('2026-03-02T23:59:59.999Z');

  // 1. Update all scheduled logs for weekly tasks that fell on March 1st or 2nd
  const logsToUpdate = await prisma.maintenanceHistory.findMany({
    where: {
      type: 'scheduled',
      maintenanceDate: {
        gte: startDate,
        lte: endDate,
      },
      task: {
        frequency: 'weekly'
      }
    }
  });

  console.log(`Found ${logsToUpdate.length} weekly logs between Mar 1 and Mar 2.`);

  let logsUpdated = 0;
  for (const log of logsToUpdate) {
    // Only update if it's not already exactly the target date (to save some writes, though not strictly necessary)
    await prisma.maintenanceHistory.update({
      where: { id: log.id },
      data: {
        maintenanceDate: targetDate,
        targetDate: targetDate,
      }
    });
    logsUpdated++;
  }
  console.log(`Aligned ${logsUpdated} logs to March 1st.`);

  // 2. Update the tasks themselves to ensure their next due date is synchronized
  const tasksToUpdate = await prisma.task.findMany({
    where: {
      frequency: 'weekly',
      lastCompletedDate: {
        gte: startDate,
        lte: endDate,
      }
    }
  });

  console.log(`Found ${tasksToUpdate.length} weekly tasks with lastCompletedDate between Mar 1 and Mar 2.`);

  let tasksUpdated = 0;
  for (const task of tasksToUpdate) {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        lastCompletedDate: targetDate,
        nextDueDate: nextDueDate,
      }
    });
    tasksUpdated++;
  }
  console.log(`Aligned ${tasksUpdated} tasks to have lastCompletedDate on March 1st and nextDueDate on March 8th.`);
  
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());