import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findFirst({ where: { name: { contains: 'Magnetic Excavator', mode: 'insensitive' } } });
  if (!eq) { console.log('not found'); return; }
  
  // Find all weekly tasks for this equipment
  const weeklyTasks = await prisma.task.findMany({ 
    where: { equipmentId: eq.id, frequency: 'weekly' } 
  });
  
  console.log(`Found ${weeklyTasks.length} weekly tasks for ${eq.name}`);
  
  // Let's align all of them to have lastCompletedDate = March 1st
  const targetDate = new Date('2026-03-01T00:00:00.000Z');
  
  for (const task of weeklyTasks) {
    // Also find any scheduled logs for this task around March 1-2 and move them to March 1
    const logs = await prisma.maintenanceHistory.findMany({
      where: {
        taskId: task.id,
        type: 'scheduled',
        maintenanceDate: {
          gte: new Date('2026-03-01T00:00:00.000Z'),
          lte: new Date('2026-03-03T00:00:00.000Z')
        }
      }
    });
    
    for (const log of logs) {
      await prisma.maintenanceHistory.update({
        where: { id: log.id },
        data: {
          maintenanceDate: targetDate,
          targetDate: targetDate
        }
      });
      console.log(`Moved log ${log.id} to March 1st`);
    }
  }
  console.log('Done aligning logs.');
}

main().catch(console.error).finally(() => prisma.$disconnect());