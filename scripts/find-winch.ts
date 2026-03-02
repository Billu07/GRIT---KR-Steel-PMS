import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findMany({
    where: {
      name: { in: ['Winch-1', 'Winch-2', 'Winch-3'] }
    }
  });
  console.log('Equipments found:', eq.length);
  console.log(eq.map(e => ({ id: e.id, name: e.name })));
}

main().finally(() => prisma.$disconnect());
