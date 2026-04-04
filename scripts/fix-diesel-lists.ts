import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findFirst({ where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } } });
  if (!eq) { console.log('not found'); return; }

  const tasks = await prisma.task.findMany({ where: { equipmentId: eq.id } });
  
  for (const t of tasks) {
    if (t.taskName.match(/^\d+\./)) {
      // Looks like a numbered list
      console.log('Fixing task:', t.id);
      
      // Attempt to split by numbers like " 2.", " 3.", etc.
      let listStr = t.taskName.replace(/\s+(\d+\.)/g, '\n$1');
      listStr = listStr.replace(/\t/g, ' '); // remove tabs
      
      const newName = `${t.frequency.charAt(0).toUpperCase() + t.frequency.slice(1)} Routine Inspection`;
      
      console.log('New Name:', newName);
      console.log('New Detail:\n', listStr);
      
      await prisma.task.update({
        where: { id: t.id },
        data: {
          taskName: newName,
          taskDetail: listStr
        }
      });
      
      // If there are maintenance history logs, we might also want to update the solutionDetails or maintenanceDetails if they copied the old taskName
      const logs = await prisma.maintenanceHistory.findMany({ where: { taskId: t.id } });
      for (const log of logs) {
        if (log.solutionDetails === t.taskName) {
           await prisma.maintenanceHistory.update({
             where: { id: log.id },
             data: { solutionDetails: newName }
           });
        }
      }
    }
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect() });