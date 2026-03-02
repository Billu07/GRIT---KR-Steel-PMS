import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';
import { Frequency } from '@prisma/client';

const tasksToAdd = [
  // Daily
  { frequency: 'daily' as Frequency, taskName: 'Inspect drum for fraying, cracks, or misalignment' },
  { frequency: 'daily' as Frequency, taskName: 'Check cable exit path and guide sheaves' },
  { frequency: 'daily' as Frequency, taskName: 'Confirm brake engagement and release' },
  // Weekly
  { frequency: 'weekly' as Frequency, taskName: 'Lubricate winch gearbox and bearings' },
  { frequency: 'weekly' as Frequency, taskName: 'Inspect mounting bolts and frame integrity' },
  // Quarterly
  { frequency: 'quarterly' as Frequency, taskName: 'Test load capacity under controlled conditions (partial load)' },
  { frequency: 'quarterly' as Frequency, taskName: 'Verify overload protection devices' },
  // Semi-Annually
  { frequency: 'semi_annually' as Frequency, taskName: 'Perform full dynamic load test (up to 110% of rated capacity)' },
  // Annually
  { frequency: 'yearly' as Frequency, taskName: 'Disassemble and inspect internal gears and brakes' },
  { frequency: 'yearly' as Frequency, taskName: 'Replace worn bushings and seals' },
  // Every 5 Years
  { frequency: 'five_yearly' as Frequency, taskName: 'Full rebuild or replacement recommended based on usage history and NDT result' },
];

const START_DATE = new Date('2026-02-02T10:00:00.000Z');
const END_DATE = new Date('2026-02-28T10:00:00.000Z');

async function main() {
  const equipments = await prisma.equipment.findMany({
    where: { name: { in: ['Winch-1', 'Winch-2', 'Winch-3'] } },
    orderBy: { name: 'asc' }
  });

  if (equipments.length === 0) {
    console.log('No equipments found');
    return;
  }

  // Get max task id
  const existingTasks = await prisma.task.findMany({ select: { taskId: true } });
  let maxNum = 0;
  existingTasks.forEach(t => {
    if (t.taskId) {
      const match = t.taskId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });

  for (const eq of equipments) {
    console.log(`\nProcessing ${eq.name}...`);
    for (const t of tasksToAdd) {
      maxNum++;
      const taskIdStr = `TSK-${String(maxNum).padStart(4, '0')}`;
      
      const task = await prisma.task.create({
        data: {
          taskId: taskIdStr,
          taskName: t.taskName,
          frequency: t.frequency,
          equipmentId: eq.id,
          createdBy: 1, // Admin
          criticality: 'medium',
        }
      });

      console.log(` Created Task: ${task.taskId} - ${task.taskName} (${task.frequency})`);

      // Backfill
      let currentDate = new Date(START_DATE);
      let lastCompleted: Date | null = null;
      let nextDue = new Date(START_DATE);

      // We only log if the task was "due" or performed in Feb.
      // For Daily/Weekly, it happens multiple times.
      // For Monthly/Quarterly/etc., it might only happen once in Feb (at the start).
      
      while (currentDate <= END_DATE) {
        const usedParts = (task.frequency === 'daily' || task.frequency === 'weekly') ? 'No parts used' : 'Standard consumables';
        const remarks = 'Routine maintenance completed. All systems operational.';

        await prisma.maintenanceHistory.create({
          data: {
            equipmentId: eq.id,
            taskId: task.id,
            type: 'scheduled',
            maintenanceDate: currentDate,
            targetDate: nextDue,
            maintenanceDetails: task.frequency.toUpperCase(),
            solutionDetails: task.taskName,
            usedParts: usedParts,
            remarks: remarks,
          }
        });

        lastCompleted = new Date(currentDate);
        nextDue = calculateNextDueDate(lastCompleted, task.frequency);

        // Move to next occurrence
        if (task.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (task.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else {
          // For frequencies longer than a month, we only log it once in this Feb backfill window
          break;
        }
      }

      // If it wasn't backfilled (e.g. 5-yearly task that wasn't "due" in Feb),
      // we should still set a nextDueDate.
      if (!lastCompleted) {
         // Set nextDueDate to Feb 2nd so it shows as due in the system if not done.
         // Or keep it as null. Usually tasks need a nextDueDate.
         await prisma.task.update({
           where: { id: task.id },
           data: { nextDueDate: START_DATE }
         });
      } else {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            lastCompletedDate: lastCompleted,
            nextDueDate: nextDue
          }
        });
        console.log(`   Backfilled up to ${lastCompleted.toISOString().split('T')[0]}. Next due: ${nextDue.toISOString().split('T')[0]}`);
      }
    }
  }
  console.log('\nDone!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
