import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';

async function main() {
  const equipmentNames = [
    'Winch-1', 'Winch-2', 'Winch-3',
    'Generator - 1', 'Generator - 2', 'Generator - 3'
  ];

  console.log('Starting data correction for:', equipmentNames.join(', '));

  const equipments = await prisma.equipment.findMany({
    where: { name: { in: equipmentNames } },
    include: { tasks: true }
  });

  if (equipments.length === 0) {
    console.log('No equipments found.');
    return;
  }

  const initialDoneDate = new Date('2026-02-01T10:00:00.000Z');
  const endOfFeb = new Date('2026-02-28T23:59:59.999Z');

  for (const eq of equipments) {
    console.log(`\nCorrecting ${eq.name}...`);
    for (const task of eq.tasks) {
      // 1. Delete ALL Feb logs for this task to start clean
      await prisma.maintenanceHistory.deleteMany({
        where: {
          taskId: task.id,
          maintenanceDate: {
            gte: new Date('2026-02-01T00:00:00.000Z'),
            lte: new Date('2026-02-28T23:59:59.999Z')
          }
        }
      });

      // 2. Start from Feb 1st
      let lastCompleted = new Date(initialDoneDate);
      let nextDue = calculateNextDueDate(lastCompleted, task.frequency);

      console.log(`  Task: ${task.taskName} (${task.frequency})`);

      let logCount = 0;
      // 3. Backfill loop: only create logs if they fall within Feb 2nd - Feb 28th
      while (nextDue <= endOfFeb) {
        await prisma.maintenanceHistory.create({
          data: {
            equipmentId: eq.id,
            taskId: task.id,
            type: 'scheduled',
            maintenanceDate: nextDue,
            targetDate: nextDue,
            maintenanceDetails: task.frequency.toUpperCase(),
            solutionDetails: task.taskName,
            usedParts: (task.frequency === 'daily' || task.frequency === 'weekly') ? 'No parts used' : 'Standard consumables',
            remarks: 'Routine maintenance completed. All systems operational.',
          }
        });

        lastCompleted = new Date(nextDue);
        nextDue = calculateNextDueDate(lastCompleted, task.frequency);
        logCount++;
      }

      // 4. Update task with final values
      await prisma.task.update({
        where: { id: task.id },
        data: {
          lastCompletedDate: lastCompleted,
          nextDueDate: nextDue
        }
      });
      
      console.log(`    Created ${logCount} logs. Final Last Done: ${lastCompleted.toISOString().split('T')[0]}, Next Due: ${nextDue.toISOString().split('T')[0]}`);
    }
  }

  console.log('\nData correction complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
