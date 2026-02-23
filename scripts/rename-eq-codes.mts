import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Renaming existing equipment codes...');

  const allEquipment = await prisma.equipment.findMany({
    orderBy: { id: 'asc' }
  });

  for (let i = 0; i < allEquipment.length; i++) {
    const eq = allEquipment[i];
    const newCode = `EQ-${String(i + 1).padStart(4, '0')}`;
    
    if (eq.code !== newCode) {
      console.log(`Renaming ${eq.name}: ${eq.code} -> ${newCode}`);
      try {
        await prisma.equipment.update({
          where: { id: eq.id },
          data: { code: newCode }
        });
      } catch (e) {
        console.error(`Failed to rename ${eq.code}:`, e);
      }
    }
  }

  console.log('Finished renaming equipment.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });