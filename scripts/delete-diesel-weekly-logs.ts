import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Deleting accidental weekly logs for Diesel Tank after March 16th...');
  
  const eq = await prisma.equipment.findFirst({
    where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } },
  });
  
  if (!eq) {
    console.log('Diesel Tank not found');
    return;
  }

  // Define the cutoff date (end of day March 16th)
  const cutoffDate = new Date('2026-03-16T23:59:59.999Z');

  // Find the logs
  const logsToDelete = await prisma.maintenanceHistory.findMany({
    where: {
      equipmentId: eq.id,
      type: 'scheduled',
      maintenanceDate: {
        gt: cutoffDate
      },
      task: {
        frequency: 'weekly'
      }
    }
  });

  console.log(`Found ${logsToDelete.length} weekly logs for Diesel Tank after March 16th.`);

  if (logsToDelete.length > 0) {
    const deleteResult = await prisma.maintenanceHistory.deleteMany({
      where: {
        id: {
          in: logsToDelete.map(log => log.id)
        }
      }
    });
    console.log(`Successfully deleted ${deleteResult.count} logs.`);
  } else {
    console.log('No logs to delete.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());