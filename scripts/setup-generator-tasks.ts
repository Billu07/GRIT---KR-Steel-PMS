import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';
import { Frequency } from '@prisma/client';

const tasksToAdd = [
  // Daily
  { frequency: 'daily' as Frequency, taskName: 'Check diesel fuel level' },
  { frequency: 'daily' as Frequency, taskName: 'Check engine oil level' },
  { frequency: 'daily' as Frequency, taskName: 'Check coolant level' },
  { frequency: 'daily' as Frequency, taskName: 'Observe abnormal noise or vibration during running' },
  { frequency: 'daily' as Frequency, taskName: 'Check control panel warning indications' },
  // Weekly
  { frequency: 'weekly' as Frequency, taskName: 'Run generator on load test' },
  { frequency: 'weekly' as Frequency, taskName: 'Check battery electrolyte level and terminals' },
  { frequency: 'weekly' as Frequency, taskName: 'Inspect fuel line leakage' },
  { frequency: 'weekly' as Frequency, taskName: 'Check air filter condition' },
  // Monthly
  { frequency: 'monthly' as Frequency, taskName: 'Check engine oil condition' },
  { frequency: 'monthly' as Frequency, taskName: 'Inspect radiator and cooling system' },
  { frequency: 'monthly' as Frequency, taskName: 'Check alternator output voltage and frequency' },
  { frequency: 'monthly' as Frequency, taskName: 'Inspect belt tension and condition' },
  // Quarterly
  { frequency: 'quarterly' as Frequency, taskName: 'Change engine oil and oil filter' },
  { frequency: 'quarterly' as Frequency, taskName: 'Clean or replace air filter' },
  { frequency: 'quarterly' as Frequency, taskName: 'Check fuel filter condition' },
  // Annually
  { frequency: 'yearly' as Frequency, taskName: 'Complete generator servicing' },
  { frequency: 'yearly' as Frequency, taskName: 'Inspect alternator winding and insulation' },
  { frequency: 'yearly' as Frequency, taskName: 'Check AVR and control panel system' },
  // Every 5 Years
  { frequency: 'five_yearly' as Frequency, taskName: 'Major engine overhaul' },
  { frequency: 'five_yearly' as Frequency, taskName: 'Alternator bearing replacement' },
  { frequency: 'five_yearly' as Frequency, taskName: 'Complete performance and load testing' },
];

const START_DATE = new Date('2026-02-02T10:00:00.000Z');
const END_DATE = new Date('2026-02-28T10:00:00.000Z');

async function main() {
  const equipments = await prisma.equipment.findMany({
    where: { name: { in: ['Generator - 1', 'Generator - 2', 'Generator - 3'] } },
    orderBy: { name: 'asc' }
  });

  if (equipments.length === 0) {
    console.log('No equipments found matching the exact names');
    return;
  }

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
          createdBy: 1,
          criticality: 'medium',
        }
      });

      console.log(` Created Task: ${task.taskId} - ${task.taskName} (${task.frequency})`);

      let currentDate = new Date(START_DATE);
      let lastCompleted: Date | null = null;
      let nextDue = new Date(START_DATE);

      while (currentDate <= END_DATE) {
        const usedParts = (task.frequency === 'daily' || task.frequency === 'weekly') ? 'No parts used' : 'Standard consumables';
        const remarks = 'Routine generator maintenance completed. All systems operational.';

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

        if (task.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (task.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (task.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          break;
        }
      }

      if (!lastCompleted) {
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
