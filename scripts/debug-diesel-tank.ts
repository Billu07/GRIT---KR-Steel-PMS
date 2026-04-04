import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findFirst({
    where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } },
  });
  if (!eq) {
    console.log('Diesel Tank not found');
    return;
  }
  console.log('Equipment:', eq.name);

  const tasks = await prisma.task.findMany({
    where: { equipmentId: eq.id },
  });
  
  for (const task of tasks) {
      console.log(`Task: ${task.taskName}, Freq: ${task.frequency}, Last Done: ${task.lastCompletedDate}`);
      const logs = await prisma.maintenanceHistory.findMany({
        where: { taskId: task.id, type: 'scheduled' },
        orderBy: { maintenanceDate: 'asc' },
      });
      console.log(`  Logs count: ${logs.length}`);
      if (logs.length > 0) {
        console.log('  Recent Logs:', logs.map(l => l.maintenanceDate?.toISOString().split('T')[0]).slice(0, 3));
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });