import { prisma } from '../src/lib/prisma';

async function main() {
  const safetyKeywords = [
    'Safety Harness', 'First Aid Kit', 'Cutting Torch', 
    'Bilge Alarm', 'Man Transfer Basket', 'SCBA', 'Oxygen Cylinder'
  ];

  console.log('Searching for safety equipments...');

  const equipments = await prisma.equipment.findMany({
    where: {
      OR: safetyKeywords.map(k => ({ name: { contains: k, mode: 'insensitive' } }))
    },
    select: { id: true, name: true, code: true }
  });

  console.log(`Found ${equipments.length} equipments:`);
  console.log(JSON.stringify(equipments, null, 2));
}

main().finally(() => prisma.$disconnect());
