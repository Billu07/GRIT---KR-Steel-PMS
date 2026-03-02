import { prisma } from '../src/lib/prisma';
import { calculateNextDueDate } from '../src/lib/dateUtils';
import { Frequency } from '@prisma/client';

const START_DATE = new Date('2026-02-02T10:00:00.000Z');
const END_DATE = new Date('2026-02-28T10:00:00.000Z');
const INITIAL_DONE_DATE = new Date('2026-02-01T10:00:00.000Z');

interface TaskDef {
  frequency: Frequency;
  taskName: string;
}

const equipmentTasks: Record<string, TaskDef[]> = {
  "Safety Harness": [
    { frequency: 'daily', taskName: 'Check webbing for cuts, frays, burns' },
    { frequency: 'daily', taskName: 'Inspect D-ring and metal fittings' },
    { frequency: 'daily', taskName: 'Ensure no fall impact and tag is valid' },
    { frequency: 'monthly', taskName: 'Detailed stitching inspection' },
    { frequency: 'monthly', taskName: 'Check lanyard / shock absorber condition' },
    { frequency: 'monthly', taskName: 'Verify ID label and inspection record' },
    { frequency: 'yearly', taskName: 'Inspection by competent person' },
    { frequency: 'yearly', taskName: 'Remove from service if failed' },
    { frequency: 'yearly', taskName: 'Maintain documented record' },
  ],
  "First Aid Kit": [
    { frequency: 'daily', taskName: 'Ensure kit is available and accessible' },
    { frequency: 'daily', taskName: 'Check box condition and seal' },
    { frequency: 'daily', taskName: 'Confirm no critical items missing' },
    { frequency: 'monthly', taskName: 'Check expiry dates' },
    { frequency: 'monthly', taskName: 'Replace used or expired items' },
    { frequency: 'monthly', taskName: 'Update inventory checklist' },
    { frequency: 'yearly', taskName: 'Full stock review' },
    { frequency: 'yearly', taskName: 'Replace near-expiry items' },
    { frequency: 'yearly', taskName: 'Update as per risk assessment' },
  ],
  "Cutting Torch and Flashback Arrestor (07Nos)": [
    { frequency: 'daily', taskName: 'Check for leakage or physical damage' },
    { frequency: 'daily', taskName: 'Ensure correct installation direction' },
    { frequency: 'daily', taskName: 'Inspect hose connections' },
    { frequency: 'monthly', taskName: 'Clean inlet/outlet ports' },
    { frequency: 'monthly', taskName: 'Check for blockage' },
    { frequency: 'monthly', taskName: 'Verify manufacturer marking' },
    { frequency: 'yearly', taskName: 'Functional test by competent person' },
    { frequency: 'yearly', taskName: 'Replace if performance doubtful' },
    { frequency: 'yearly', taskName: 'Record inspection' },
  ],
  "Cutting Torch and Flashback Arrestor (20 Nos)": [
    { frequency: 'daily', taskName: 'Check for leakage or physical damage' },
    { frequency: 'daily', taskName: 'Ensure correct installation direction' },
    { frequency: 'daily', taskName: 'Inspect hose connections' },
    { frequency: 'monthly', taskName: 'Clean inlet/outlet ports' },
    { frequency: 'monthly', taskName: 'Check for blockage' },
    { frequency: 'monthly', taskName: 'Verify manufacturer marking' },
    { frequency: 'yearly', taskName: 'Functional test by competent person' },
    { frequency: 'yearly', taskName: 'Replace if performance doubtful' },
    { frequency: 'yearly', taskName: 'Record inspection' },
  ],
  "Bilge Alarm Monitor": [
    { frequency: 'daily', taskName: 'Confirm power supply ON' },
    { frequency: 'daily', taskName: 'Check normal panel indication' },
    { frequency: 'daily', taskName: 'Ensure no fault alarm' },
    { frequency: 'monthly', taskName: 'Test alarm simulation' },
    { frequency: 'monthly', taskName: 'Inspect sensor cleanliness' },
    { frequency: 'monthly', taskName: 'Record test result' },
    { frequency: 'yearly', taskName: 'Full functional system test' },
    { frequency: 'yearly', taskName: 'Sensor calibration (if applicable)' },
    { frequency: 'yearly', taskName: 'Maintain inspection record' },
  ],
  "Man Transferring Basket": [
    { frequency: 'daily', taskName: 'Inspect frame and welds' },
    { frequency: 'daily', taskName: 'Check slings and shackles' },
    { frequency: 'daily', taskName: 'Verify safety net and base condition' },
    { frequency: 'monthly', taskName: 'Inspect weld joints' },
    { frequency: 'monthly', taskName: 'Check lifting points' },
    { frequency: 'monthly', taskName: 'Verify SWL marking' },
    { frequency: 'yearly', taskName: 'Load test as per certification' },
    { frequency: 'yearly', taskName: 'Inspection by competent authority' },
    { frequency: 'yearly', taskName: 'Renew certificate' },
  ],
  "Self-Contained Breathing Apparatus (SCBA)": [
    { frequency: 'daily', taskName: 'Check cylinder pressure' },
    { frequency: 'daily', taskName: 'Inspect mask and straps' },
    { frequency: 'daily', taskName: 'Verify regulator function' },
    { frequency: 'monthly', taskName: 'Test low-pressure alarm' },
    { frequency: 'monthly', taskName: 'Inspect cylinder condition' },
    { frequency: 'monthly', taskName: 'Clean and disinfect mask' },
    { frequency: 'yearly', taskName: 'Full servicing by authorized provider' },
    { frequency: 'yearly', taskName: 'Hydrostatic test (if due)' },
    { frequency: 'yearly', taskName: 'Maintain service record' },
  ],
  "Medical oxygen cylinders": [
    { frequency: 'daily', taskName: 'Check cylinder pressure' },
    { frequency: 'daily', taskName: 'Inspect regulator and flow meter' },
    { frequency: 'daily', taskName: 'Ensure cylinder secured upright' },
    { frequency: 'monthly', taskName: 'Check test date stamped on cylinder' },
    { frequency: 'monthly', taskName: 'Inspect hose and mask' },
    { frequency: 'monthly', taskName: 'Verify no leakage' },
    { frequency: 'yearly', taskName: 'Hydrostatic testing as per regulation' },
    { frequency: 'yearly', taskName: 'Regulator servicing' },
    { frequency: 'yearly', taskName: 'Maintain certification record' },
  ],
  "Medical oxygen cylinder for ambulance ": [
    { frequency: 'daily', taskName: 'Check cylinder pressure' },
    { frequency: 'daily', taskName: 'Inspect regulator and flow meter' },
    { frequency: 'daily', taskName: 'Ensure cylinder secured upright' },
    { frequency: 'monthly', taskName: 'Check test date stamped on cylinder' },
    { frequency: 'monthly', taskName: 'Inspect hose and mask' },
    { frequency: 'monthly', taskName: 'Verify no leakage' },
    { frequency: 'yearly', taskName: 'Hydrostatic testing as per regulation' },
    { frequency: 'yearly', taskName: 'Regulator servicing' },
    { frequency: 'yearly', taskName: 'Maintain certification record' },
  ]
};

async function main() {
  const equipments = await prisma.equipment.findMany({
    where: { name: { in: Object.keys(equipmentTasks) } }
  });

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
    const tasks = equipmentTasks[eq.name];

    for (const tDef of tasks) {
      maxNum++;
      const taskIdStr = `TSK-${String(maxNum).padStart(4, '0')}`;

      const task = await prisma.task.create({
        data: {
          taskId: taskIdStr,
          taskName: tDef.taskName,
          frequency: tDef.frequency,
          equipmentId: eq.id,
          createdBy: 1,
          criticality: 'medium',
        }
      });

      console.log(` Created Task: ${task.taskId} - ${task.taskName} (${task.frequency})`);

      let lastCompleted = new Date(INITIAL_DONE_DATE);
      let nextDue = calculateNextDueDate(lastCompleted, task.frequency);

      let logCount = 0;
      while (nextDue <= END_DATE) {
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

  console.log('\nSafety Equipment Setup Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
