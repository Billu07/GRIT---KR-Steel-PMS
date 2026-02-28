const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function findLifeJacket() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const categories = await prisma.equipmentCategory.findMany({
        include: {
            equipment: {
                where: { name: { contains: 'Life Jacket', mode: 'insensitive' } }
            }
        }
    });
    console.log(JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

findLifeJacket();
