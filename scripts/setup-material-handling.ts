import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';
import { Frequency } from '@prisma/client';

const START_DATE = new Date('2026-02-02T10:00:00.000Z');
const END_DATE = new Date('2026-02-28T10:00:00.000Z');
const INITIAL_DONE_DATE = new Date('2026-02-01T10:00:00.000Z');

async function main() {
  // 1. Find Category
  const category = await prisma.equipmentCategory.findFirst({
    where: { name: { contains: 'Material Handling', mode: 'insensitive' } }
  });

  if (!category) {
    console.error('Material Handling Equipment category not found.');
    return;
  }
  console.log(`Found category: ${category.name} (ID: ${category.id})`);

  // 2. Start Code from EQ-0070
  let nextNum = 70;

  // 3. Define Equipments and Tasks
  const equipmentsToCreate = [
    {
      name: 'SINGLE SHEAVE PULLEY',
      tasks: [
        { frequency: 'daily' as Frequency, taskName: 'Check sheave, side plates, and hook for cracks or deformation' },
        { frequency: 'daily' as Frequency, taskName: 'Ensure smooth rotation and no abnormal noise' },
        { frequency: 'daily' as Frequency, taskName: 'Inspect pin, safety latch, and attachment points' },
        { frequency: 'weekly' as Frequency, taskName: 'Check groove wear and rope seating condition' },
        { frequency: 'weekly' as Frequency, taskName: 'Inspect for corrosion due to marine environment' },
        { frequency: 'weekly' as Frequency, taskName: 'Verify lubrication condition' },
        { frequency: 'monthly' as Frequency, taskName: 'Detailed inspection of bearing/bushing wear' },
        { frequency: 'monthly' as Frequency, taskName: 'Check alignment and structural integrity' },
        { frequency: 'monthly' as Frequency, taskName: 'Verify SWL marking and identification plate' },
        { frequency: 'yearly' as Frequency, taskName: 'Thorough examination by competent person' },
        { frequency: 'yearly' as Frequency, taskName: 'NDT if required by company / class rule' },
        { frequency: 'yearly' as Frequency, taskName: 'Maintain inspection and certification record' },
      ]
    },
    {
      name: 'CHAIN LINK',
      tasks: [
        { frequency: 'daily' as Frequency, taskName: 'Check for bent, cracked, twisted, or elongated links' },
        { frequency: 'daily' as Frequency, taskName: 'Inspect hooks and safety latch' },
        { frequency: 'daily' as Frequency, taskName: 'Check for corrosion and pitting' },
        { frequency: 'weekly' as Frequency, taskName: 'Visual inspection for surface wear' },
        { frequency: 'weekly' as Frequency, taskName: 'Check smooth articulation of links' },
        { frequency: 'weekly' as Frequency, taskName: 'Inspect master link and connecting components' },
        { frequency: 'monthly' as Frequency, taskName: 'Measure chain wear and elongation' },
        { frequency: 'monthly' as Frequency, taskName: 'Inspect attachment points and fittings' },
        { frequency: 'monthly' as Frequency, taskName: 'Verify SWL tag and identification' },
        { frequency: 'yearly' as Frequency, taskName: 'Thorough examination by competent person' },
        { frequency: 'yearly' as Frequency, taskName: 'Proof load test as per shipyard / statutory requirement' },
        { frequency: 'yearly' as Frequency, taskName: 'Maintain certification and inspection record' },
      ]
    }
  ];

  // 4. Find Next Task ID
  const existingTasks = await prisma.task.findMany({ select: { taskId: true } });
  let maxTaskNum = 0;
  existingTasks.forEach(t => {
    if (t.taskId) {
      const match = t.taskId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > maxTaskNum) maxTaskNum = num;
      }
    }
  });

  for (const eqData of equipmentsToCreate) {
    const code = `EQ-${String(nextNum++).padStart(4, '0')}`;
    console.log(`\nCreating Equipment: ${eqData.name} (${code})`);

    const equipment = await prisma.equipment.create({
      data: {
        name: eqData.name,
        code: code,
        categoryId: category.id,
        status: 'active',
        location: 'Shipyard'
      }
    });

    for (const tDef of eqData.tasks) {
      maxTaskNum++;
      const taskIdStr = `TSK-${String(maxTaskNum).padStart(4, '0')}`;

      const task = await prisma.task.create({
        data: {
          taskId: taskIdStr,
          taskName: tDef.taskName,
          frequency: tDef.frequency,
          equipmentId: equipment.id,
          createdBy: 1,
          criticality: 'medium',
        }
      });

      console.log(`  Created Task: ${task.taskId} - ${task.taskName} (${task.frequency})`);

      // Backfill starting from INITIAL_DONE_DATE (Feb 1st)
      let lastCompleted = new Date(INITIAL_DONE_DATE);
      let nextDue = calculateNextDueDate(lastCompleted, task.frequency);

      let logCount = 0;
      while (nextDue <= END_DATE) {
        await prisma.maintenanceHistory.create({
          data: {
            equipmentId: equipment.id,
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

  console.log('\nMaterial Handling Equipment Setup Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
