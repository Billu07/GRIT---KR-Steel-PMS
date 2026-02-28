const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function bulkAddTasksCorrected() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const lastCompletedDate = new Date('2026-02-01');
    const idsToDelete = [485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509];
    
    console.log('Cleaning up previous incorrect tasks...');
    await prisma.task.deleteMany({ where: { id: { in: idsToDelete } } });

    const equipmentMap = {
      'LUX LEVEL METER': 191,
      'MULTI GAS DETECTOR 1': 193,
      'SOUND LEVEL METER': 192,
      'MULTI GAS DETECTOR 2': 195,
      'MULTI GAS DETECTOR 3': 196
    };

    const taskData = [
      {
        eq: 'LUX LEVEL METER',
        tasks: [
          { name: 'Clean sensor and check physical condition', freq: 'daily' },
          { name: 'Verify display and battery status', freq: 'daily' },
          { name: 'Basic functional check', freq: 'daily' },
          { name: 'Inspect probe/cable (if applicable)', freq: 'weekly' },
          { name: 'Verify stable reading', freq: 'weekly' },
          { name: 'Accuracy check with reference source', freq: 'monthly' },
          { name: 'Verify calibration due date', freq: 'monthly' },
          { name: 'Record inspection', freq: 'monthly' },
          { name: 'Cross-check reading with calibrated reference instrument', freq: 'quarterly' },
          { name: 'Inspect internal condition (battery terminals, connectors)', freq: 'quarterly' },
          { name: 'Review usage log', freq: 'quarterly' },
          { name: 'Full calibration by accredited laboratory', freq: 'yearly' },
          { name: 'Obtain calibration certificate', freq: 'yearly' },
          { name: 'Update calibration label and record', freq: 'yearly' }
        ]
      },
      {
        eq: 'MULTI GAS DETECTOR 1',
        tasks: [
          { name: 'Visual inspection', freq: 'daily' },
          { name: 'Battery check', freq: 'daily' },
          { name: 'Self-test', freq: 'daily' },
          { name: 'Bump test', freq: 'daily' },
          { name: 'Verify alarm functions', freq: 'daily' },
          { name: 'Clean sensor inlet and check filter', freq: 'weekly' },
          { name: 'Inspect accessories', freq: 'weekly' },
          { name: 'Full calibration with certified gas', freq: 'monthly' },
          { name: 'Record calibration data', freq: 'monthly' },
          { name: 'Sensor performance evaluation', freq: 'quarterly' },
          { name: 'Replace filters if required', freq: 'quarterly' },
          { name: 'Pump flow check (if pump type)', freq: 'quarterly' },
          { name: 'Full calibration by authorized service provider', freq: 'yearly' },
          { name: 'Sensor replacement if life expired', freq: 'yearly' },
          { name: 'Firmware update (if applicable)', freq: 'yearly' },
          { name: 'Maintain certification record', freq: 'yearly' }
        ]
      },
      {
        eq: 'MULTI GAS DETECTOR 2',
        tasks: [
          { name: 'Visual inspection', freq: 'daily' },
          { name: 'Battery check', freq: 'daily' },
          { name: 'Self-test', freq: 'daily' },
          { name: 'Bump test', freq: 'daily' },
          { name: 'Verify alarm functions', freq: 'daily' },
          { name: 'Clean sensor inlet and check filter', freq: 'weekly' },
          { name: 'Inspect accessories', freq: 'weekly' },
          { name: 'Full calibration with certified gas', freq: 'monthly' },
          { name: 'Record calibration data', freq: 'monthly' },
          { name: 'Sensor performance evaluation', freq: 'quarterly' },
          { name: 'Replace filters if required', freq: 'quarterly' },
          { name: 'Pump flow check (if pump type)', freq: 'quarterly' },
          { name: 'Full calibration by authorized service provider', freq: 'yearly' },
          { name: 'Sensor replacement if life expired', freq: 'yearly' },
          { name: 'Firmware update (if applicable)', freq: 'yearly' },
          { name: 'Maintain certification record', freq: 'yearly' }
        ]
      },
      {
        eq: 'MULTI GAS DETECTOR 3',
        tasks: [
          { name: 'Visual inspection', freq: 'daily' },
          { name: 'Battery check', freq: 'daily' },
          { name: 'Self-test', freq: 'daily' },
          { name: 'Bump test', freq: 'daily' },
          { name: 'Verify alarm functions', freq: 'daily' },
          { name: 'Clean sensor inlet and check filter', freq: 'weekly' },
          { name: 'Inspect accessories', freq: 'weekly' },
          { name: 'Full calibration with certified gas', freq: 'monthly' },
          { name: 'Record calibration data', freq: 'monthly' },
          { name: 'Sensor performance evaluation', freq: 'quarterly' },
          { name: 'Replace filters if required', freq: 'quarterly' },
          { name: 'Pump flow check (if pump type)', freq: 'quarterly' },
          { name: 'Full calibration by authorized service provider', freq: 'yearly' },
          { name: 'Sensor replacement if life expired', freq: 'yearly' },
          { name: 'Firmware update (if applicable)', freq: 'yearly' },
          { name: 'Maintain certification record', freq: 'yearly' }
        ]
      },
      {
        eq: 'SOUND LEVEL METER',
        tasks: [
          { name: 'Clean microphone', freq: 'daily' },
          { name: 'Battery check', freq: 'daily' },
          { name: 'Quick calibrator check', freq: 'daily' },
          { name: 'Verify measurement settings', freq: 'weekly' },
          { name: 'Inspect windscreen', freq: 'weekly' },
          { name: 'Calibration check with acoustic calibrator', freq: 'monthly' },
          { name: 'Record result', freq: 'monthly' },
          { name: 'Cross-verification with reference instrument', freq: 'quarterly' },
          { name: 'Inspect microphone sensitivity', freq: 'quarterly' },
          { name: 'Full calibration by accredited laboratory', freq: 'yearly' },
          { name: 'Obtain valid calibration certificate', freq: 'yearly' },
          { name: 'Update calibration label', freq: 'yearly' }
        ]
      }
    ];

    // Get current max Task ID
    const existingTasks = await prisma.task.findMany({ select: { taskId: true } });
    let maxNum = 0;
    existingTasks.forEach(t => {
      const match = t.taskId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });

    console.log(`Starting bulk task creation from TSK-${String(maxNum + 1).padStart(4, '0')}...`);

    const createdTasks = [];
    for (const group of taskData) {
      const equipmentId = equipmentMap[group.eq];
      for (const t of group.tasks) {
        maxNum++;
        const taskId = `TSK-${String(maxNum).padStart(4, '0')}`;
        
        let nextDueDate = new Date(lastCompletedDate);
        if (t.freq === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
        else if (t.freq === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (t.freq === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        else if (t.freq === 'quarterly') nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        else if (t.freq === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

        await prisma.task.create({
          data: {
            taskId,
            taskName: t.name,
            frequency: t.freq,
            equipmentId: equipmentId,
            lastCompletedDate: lastCompletedDate,
            nextDueDate: nextDueDate,
            criticality: 'medium',
            createdBy: 1
          }
        });
        createdTasks.push(taskId);
      }
    }

    console.log(`Successfully created ${createdTasks.length} tasks.`);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

bulkAddTasksCorrected();
