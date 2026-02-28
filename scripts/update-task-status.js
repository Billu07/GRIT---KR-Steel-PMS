const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function updateTaskStatus() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const equipmentIds = [191, 192, 193, 195, 196];
    const tasks = await prisma.task.findMany({
      where: { equipmentId: { in: equipmentIds } }
    });

    for (const task of tasks) {
      let lastCompletedDate = null;
      let nextDueDate = null;

      if (task.frequency === 'daily') {
        lastCompletedDate = new Date(2026, 1, 28);
        nextDueDate = new Date(2026, 2, 1);
      } else if (task.frequency === 'weekly') {
        lastCompletedDate = new Date(2026, 1, 22);
        nextDueDate = new Date(2026, 2, 1);
      } else {
        // Monthly/Quarterly/Yearly remain as Feb 1 / Next due calculated previously
        continue;
      }

      await prisma.task.update({
        where: { id: task.id },
        data: {
          lastCompletedDate,
          nextDueDate
        }
      });
    }

    console.log('Task statuses updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateTaskStatus();
