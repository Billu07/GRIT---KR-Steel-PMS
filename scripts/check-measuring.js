const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function checkMeasuringEquipment() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const cat = await prisma.equipmentCategory.findFirst({
      where: { name: 'Measuring Equipment' },
      include: {
        equipment: {
          select: {
            id: true,
            code: true,
            name: true,
            tasks: {
              select: {
                id: true,
                taskId: true,
                taskName: true
              }
            }
          }
        }
      }
    });

    if (cat) {
      console.log('CATEGORY_FOUND');
      console.log(JSON.stringify(cat, null, 2));
    } else {
      console.log('CATEGORY_NOT_FOUND');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkMeasuringEquipment();
