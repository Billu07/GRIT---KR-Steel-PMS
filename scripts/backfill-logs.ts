import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';

async function main() {
  const TODAY = new Date();
  const START_DATE = new Date('2026-02-01T08:00:00.000Z');

  const tasks = await prisma.task.findMany();
  console.log(`Found ${tasks.length} tasks. Processing...`);

  let logsCreated = 0;

  for (const task of tasks) {
    let currentLastCompleted = new Date(START_DATE);
    let nextDue = calculateNextDueDate(currentLastCompleted, task.frequency);
    
    const newLogs = [];
    
    while (nextDue <= TODAY) {
      newLogs.push({
        equipmentId: task.equipmentId,
        taskId: task.id,
        type: 'scheduled' as const,
        targetDate: nextDue,
        maintenanceDate: nextDue,
        performedAt: nextDue,
        usedParts: task.frequency === 'daily' ? 'No parts Used' : '',
        solutionDetails: task.frequency === 'daily' ? 'Work completed properly' : '',
      });
      
      currentLastCompleted = new Date(nextDue);
      nextDue = calculateNextDueDate(currentLastCompleted, task.frequency);
    }
    
    if (newLogs.length > 0) {
      // Create logs
      // @ts-ignore
      await prisma.maintenanceHistory.createMany({
        data: newLogs
      });
      logsCreated += newLogs.length;
    }
    
    // Update task with the new calculated dates
    await prisma.task.update({
      where: { id: task.id },
      data: {
        lastCompletedDate: currentLastCompleted,
        nextDueDate: nextDue,
      }
    });
  }

  console.log(`Successfully created ${logsCreated} historical logs and updated next due dates.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
