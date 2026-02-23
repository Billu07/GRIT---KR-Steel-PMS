const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function test() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Testing Dashboard API logic...');
    
    const logsToday = await prisma.maintenanceHistory.count();
    console.log('logsToday:', logsToday);

    const scheduledTasks = await prisma.task.count();
    console.log('scheduledTasks:', scheduledTasks);

    const totalAssets = await prisma.equipment.count();
    console.log('totalAssets:', totalAssets);

    // Try both lowercase and PascalCase if necessary, but prisma usually does lowercase
    let inventoryItems = 0;
    try {
        inventoryItems = await prisma.inventory.count();
        console.log('inventoryItems (lowercase):', inventoryItems);
    } catch (e) {
        console.log('inventoryItems (lowercase) failed:', e.message);
    }

    const recentLogs = await prisma.maintenanceHistory.findMany({
      take: 10,
      include: {
        equipment: true,
        task: true,
      },
    });
    console.log('recentLogs count:', recentLogs.length);

    console.log('API Logic Test PASSED');
  } catch (err) {
    console.error('API Logic Test FAILED:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();