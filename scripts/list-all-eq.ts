import { prisma } from '../src/lib/prisma';

async function main() {
  const equipments = await prisma.equipment.findMany({
    select: { id: true, name: true, code: true }
  });
  console.log(JSON.stringify(equipments, null, 2));
}

main().finally(() => prisma.$disconnect());
