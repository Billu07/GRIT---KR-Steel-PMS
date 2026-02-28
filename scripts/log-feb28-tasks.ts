import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';

async function main() {
  console.log('Starting bulk log for tasks due on or before Feb 28, 2026...');
  
  const targetDateStr = '2026-02-28T23:59:59.999Z';
  const maintenanceDateObj = new Date('2026-02-28T10:00:00.000Z'); // log at 10 AM

  const tasks = await prisma.task.findMany({
    where: {
      nextDueDate: {
        lte: new Date(targetDateStr),
      },
    }
  });

  console.log(`Found ${tasks.length} tasks due on or before Feb 28, 2026.`);

  let successCount = 0;

  for (const task of tasks) {
    try {
      const usedParts = (task.frequency === 'daily' || task.frequency === 'weekly') ? 'No parts used' : 'Standard consumables';
      const remarks = 'Routine inspection completed successfully. All systems operational and within normal parameters.';
      
      const nextDue = calculateNextDueDate(maintenanceDateObj, task.frequency);

      // Create maintenance log
      await prisma.maintenanceHistory.create({
        data: {
          equipmentId: task.equipmentId,
          taskId: task.id,
          type: 'scheduled',
          maintenanceDate: maintenanceDateObj,
          targetDate: task.nextDueDate,
          maintenanceDetails: task.frequency.toUpperCase(),
          solutionDetails: task.taskName,
          usedParts: usedParts,
          remarks: remarks,
        }
      });

      // Update task
      await prisma.task.update({
        where: { id: task.id },
        data: {
          lastCompletedDate: maintenanceDateObj,
          nextDueDate: nextDue,
        }
      });

      successCount++;
    } catch (err) {
      console.error(`Failed to log task ${task.taskId}:`, err);
    }
  }

  console.log(`Successfully logged ${successCount} tasks for Feb 28, 2026.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });