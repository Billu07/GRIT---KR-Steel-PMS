const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function backfillLogs() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Get all tasks for the measuring equipment
    const equipmentIds = [191, 192, 193, 195, 196]; // LUX, Sound, Gas 1, 2, 3
    const tasks = await prisma.task.findMany({
      where: { equipmentId: { in: equipmentIds } },
      include: { equipment: true }
    });

    console.log(`Found ${tasks.length} tasks to backfill.`);

    const startDay = 2;
    const endDay = 28;
    const year = 2026;
    const month = 1; // February (0-indexed)

    let logCount = 0;
    const batchSize = 100;
    let currentBatch = [];

    for (let day = startDay; day <= endDay; day++) {
      const currentDate = new Date(year, month, day);
      const isSunday = currentDate.getDay() === 0;

      for (const task of tasks) {
        let shouldLog = false;

        // Daily tasks: Log every day
        if (task.frequency === 'daily') {
          shouldLog = true;
        }
        // Weekly tasks: Log on Sundays (Feb 8, 15, 22)
        else if (task.frequency === 'weekly' && isSunday) {
          shouldLog = true;
        }

        if (shouldLog) {
          const usedParts = (task.frequency === 'daily' || task.frequency === 'weekly') ? 'no parts used' : '';
          const remarks = `Completed ${task.taskName} for ${task.equipment.name}. Everything in good condition.`;
          
          currentBatch.push({
            equipmentId: task.equipmentId,
            taskId: task.id,
            maintenanceDate: currentDate,
            performedAt: currentDate,
            targetDate: currentDate,
            maintenanceDetails: `Routine ${task.frequency} maintenance: ${task.taskName}`,
            remarks: remarks,
            usedParts: usedParts,
            type: 'scheduled',
            workType: 'new'
          });

          if (currentBatch.length >= batchSize) {
            await prisma.maintenanceHistory.createMany({ data: currentBatch });
            logCount += currentBatch.length;
            currentBatch = [];
            console.log(`Log status: ${logCount} created...`);
          }
        }
      }
    }

    if (currentBatch.length > 0) {
      await prisma.maintenanceHistory.createMany({ data: currentBatch });
      logCount += currentBatch.length;
    }

    console.log(`Successfully created ${logCount} maintenance logs.`);

  } catch (err) {
    console.error('ERROR during backfill:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

backfillLogs();
