import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Backfilling March 7th logs for Diesel Tank...');
  const eq = await prisma.equipment.findFirst({
    where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } },
  });
  if (!eq) {
    console.log('Diesel Tank not found');
    return;
  }

  const tasks = await prisma.task.findMany({
    where: { equipmentId: eq.id },
  });

  const targetDate = new Date('2026-03-07T00:00:00.000Z');
  let addedCount = 0;

  for (const task of tasks) {
    // Check if a log already exists for March 7th
    const existingLog = await prisma.maintenanceHistory.findFirst({
      where: {
        taskId: task.id,
        type: 'scheduled',
        maintenanceDate: {
          gte: new Date('2026-03-07T00:00:00.000Z'),
          lte: new Date('2026-03-07T23:59:59.999Z'),
        }
      }
    });

    if (!existingLog) {
      await prisma.maintenanceHistory.create({
        data: {
          equipmentId: eq.id,
          taskId: task.id,
          type: 'scheduled',
          targetDate: targetDate,
          maintenanceDate: targetDate,
          informationDate: targetDate,
          performedAt: new Date(),
          remarks: 'Initial completion log (backfilled)',
        }
      });
      addedCount++;
      console.log(`Backfilled log for task: ${task.taskName}`);
    }
  }

  console.log(`Successfully backfilled ${addedCount} logs for March 7th.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());