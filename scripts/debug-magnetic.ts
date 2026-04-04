import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findFirst({ where: { name: { contains: 'Magnetic Excavator', mode: 'insensitive' } } });
  if (!eq) { console.log('not found'); return; }
  const tasks = await prisma.task.findMany({ where: { equipmentId: eq.id } });
  console.log('Tasks:', tasks.map(t => t.id + ' ' + t.taskName + ' ' + t.frequency));
  const logs = await prisma.maintenanceHistory.findMany({ where: { equipmentId: eq.id, type: 'scheduled' }, orderBy: { maintenanceDate: 'asc' } });
  console.log('Logs for EQ:', logs.map(l => l.maintenanceDate?.toISOString().split('T')[0] + ' Task:' + l.taskId));
}
main().catch(console.error).finally(() => prisma.$disconnect());