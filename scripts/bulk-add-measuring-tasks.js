const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function bulkAddTasks() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const lastCompletedDate = new Date('2026-02-01');

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
          { name: 'Daily Maintenance', freq: 'daily', detail: 'Clean sensor and check physical condition; Verify display and battery status; Basic functional check' },
          { name: 'Weekly Maintenance', freq: 'weekly', detail: 'Inspect probe/cable (if applicable); Verify stable reading' },
          { name: 'Monthly Maintenance', freq: 'monthly', detail: 'Accuracy check with reference source; Verify calibration due date; Record inspection' },
          { name: 'Quarterly Maintenance', freq: 'quarterly', detail: 'Cross-check reading with calibrated reference instrument; Inspect internal condition (battery terminals, connectors); Review usage log' },
          { name: 'Annual Maintenance', freq: 'yearly', detail: 'Full calibration by accredited laboratory; Obtain calibration certificate; Update calibration label and record' }
        ]
      },
      {
        eq: 'MULTI GAS DETECTOR 1',
        tasks: [
          { name: 'Daily Maintenance', freq: 'daily', detail: 'Visual inspection; Battery check; Self-test; Bump test; Verify alarm functions' },
          { name: 'Weekly Maintenance', freq: 'weekly', detail: 'Clean sensor inlet and check filter; Inspect accessories' },
          { name: 'Monthly Maintenance', freq: 'monthly', detail: 'Full calibration with certified gas; Record calibration data' },
          { name: 'Quarterly Maintenance', freq: 'quarterly', detail: 'Sensor performance evaluation; Replace filters if required; Pump flow check (if pump type)' },
          { name: 'Annual Maintenance', freq: 'yearly', detail: 'Full calibration by authorized service provider; Sensor replacement if life expired; Firmware update (if applicable); Maintain certification record' }
        ]
      },
      {
        eq: 'MULTI GAS DETECTOR 2',
        tasks: [
          { name: 'Daily Maintenance', freq: 'daily', detail: 'Visual inspection; Battery check; Self-test; Bump test; Verify alarm functions' },
          { name: 'Weekly Maintenance', freq: 'weekly', detail: 'Clean sensor inlet and check filter; Inspect accessories' },
          { name: 'Monthly Maintenance', freq: 'monthly', detail: 'Full calibration with certified gas; Record calibration data' },
          { name: 'Quarterly Maintenance', freq: 'quarterly', detail: 'Sensor performance evaluation; Replace filters if required; Pump flow check (if pump type)' },
          { name: 'Annual Maintenance', freq: 'yearly', detail: 'Full calibration by authorized service provider; Sensor replacement if life expired; Firmware update (if applicable); Maintain certification record' }
        ]
      },
      {
        eq: 'MULTI GAS DETECTOR 3',
        tasks: [
          { name: 'Daily Maintenance', freq: 'daily', detail: 'Visual inspection; Battery check; Self-test; Bump test; Verify alarm functions' },
          { name: 'Weekly Maintenance', freq: 'weekly', detail: 'Clean sensor inlet and check filter; Inspect accessories' },
          { name: 'Monthly Maintenance', freq: 'monthly', detail: 'Full calibration with certified gas; Record calibration data' },
          { name: 'Quarterly Maintenance', freq: 'quarterly', detail: 'Sensor performance evaluation; Replace filters if required; Pump flow check (if pump type)' },
          { name: 'Annual Maintenance', freq: 'yearly', detail: 'Full calibration by authorized service provider; Sensor replacement if life expired; Firmware update (if applicable); Maintain certification record' }
        ]
      },
      {
        eq: 'SOUND LEVEL METER',
        tasks: [
          { name: 'Daily Maintenance', freq: 'daily', detail: 'Clean microphone; Battery check; Quick calibrator check' },
          { name: 'Weekly Maintenance', freq: 'weekly', detail: 'Verify measurement settings; Inspect windscreen' },
          { name: 'Monthly Maintenance', freq: 'monthly', detail: 'Calibration check with acoustic calibrator; Record result' },
          { name: 'Quarterly Maintenance', freq: 'quarterly', detail: 'Cross-verification with reference instrument; Inspect microphone sensitivity' },
          { name: 'Annual Maintenance', freq: 'yearly', detail: 'Full calibration by accredited laboratory; Obtain valid calibration certificate; Update calibration label' }
        ]
      }
    ];

    // Get current max Task ID
    const tasks = await prisma.task.findMany({ select: { taskId: true } });
    let maxNum = 0;
    tasks.forEach(t => {
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
      if (!equipmentId) {
        console.error(`Equipment ID not found for ${group.eq}`);
        continue;
      }

      for (const t of group.tasks) {
        maxNum++;
        const taskId = `TSK-${String(maxNum).padStart(4, '0')}`;
        
        // Calculate nextDueDate
        let nextDueDate = new Date(lastCompletedDate);
        if (t.freq === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
        else if (t.freq === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (t.freq === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        else if (t.freq === 'quarterly') nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        else if (t.freq === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

        const newTask = await prisma.task.create({
          data: {
            taskId,
            taskName: t.name,
            frequency: t.freq === 'quarterly' ? 'quarterly' : t.freq,
            taskDetail: t.detail,
            equipmentId: equipmentId,
            lastCompletedDate: lastCompletedDate,
            nextDueDate: nextDueDate,
            criticality: 'medium',
            createdBy: 1
          }
        });
        createdTasks.push(newTask.taskId);
      }
    }

    console.log(`Successfully created ${createdTasks.length} tasks: ${createdTasks.join(', ')}`);
  } catch (err) {
    console.error('ERROR during bulk task creation:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

bulkAddTasks();
