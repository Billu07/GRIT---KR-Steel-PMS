import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findMany({
    where: {
      name: { contains: 'enerator' }
    }
  });
  console.log('Equipments found:', eq.length);
  console.log(eq.map(e => ({ id: e.id, name: e.name })));
}

main().finally(() => prisma.$disconnect());
