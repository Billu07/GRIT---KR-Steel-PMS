import { prisma } from '../src/lib/prisma';

async function main() {
  const eq = await prisma.equipment.findFirst({ where: { name: { contains: 'Diesel Tank', mode: 'insensitive' } } });
  if (!eq) { console.log('not found'); return; }
  const tasks = await prisma.task.findMany({ where: { equipmentId: eq.id } });
  tasks.forEach(t => {
    if (t.frequency === 'weekly' || t.frequency === 'monthly') {
      console.log('Task Name:', JSON.stringify(t.taskName));
      console.log('Detail:', JSON.stringify(t.taskDetail));
      console.log('---');
    }
  });
}
main().catch(console.error).finally(async () => { await prisma.$disconnect() });