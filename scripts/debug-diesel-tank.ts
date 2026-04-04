import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const eq = await prisma.equipment.findFirst({
    where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } },
  });
  if (!eq) {
    console.log('Diesel Tank not found');
    return;
  }
  console.log('Equipment:', eq);

  const tasks = await prisma.task.findMany({
    where: { equipmentId: eq.id },
  });
  console.log('Tasks:', tasks);

  const logs = await prisma.maintenanceHistory.findMany({
    where: { equipmentId: eq.id },
    orderBy: { performedAt: 'desc' },
  });
  console.log('Logs count:', logs.length);
  if (logs.length > 0) {
    console.log('Recent Logs:', logs.slice(0, 5));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });