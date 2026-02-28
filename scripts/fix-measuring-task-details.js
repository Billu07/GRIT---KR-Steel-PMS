const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function updateTaskDetails() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const equipmentIds = [191, 192, 193, 195, 196];
    
    // Get the tasks that need updating
    const tasks = await prisma.task.findMany({
      where: { 
        equipmentId: { in: equipmentIds },
        OR: [
          { taskDetail: null },
          { taskDetail: '' },
          { taskDetail: '-' }
        ]
      }
    });

    console.log(`Updating details for ${tasks.length} tasks...`);

    for (const task of tasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          taskDetail: task.taskName
        }
      });
    }

    console.log('Task details updated successfully (copied taskName to taskDetail).');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateTaskDetails();
