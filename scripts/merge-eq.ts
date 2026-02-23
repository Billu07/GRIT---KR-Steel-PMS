import { prisma } from '../src/lib/prisma';
async function main() {
  const orgEq = await prisma.equipment.findFirst({ where: { code: 'EQ-0028' }});
  const dupEq = await prisma.equipment.findFirst({ where: { code: 'EQ-0045' }});
  if (!orgEq || !dupEq) {
    console.log('Could not find one or both equipment items');
    return;
  }
  console.log(`Moving tasks from ${dupEq.code} (${dupEq.id}) to ${orgEq.code} (${orgEq.id})`);
  const result = await prisma.task.updateMany({
    where: { equipmentId: dupEq.id },
    data: { equipmentId: orgEq.id }
  });
  console.log(`Moved ${result.count} tasks.`);
  await prisma.equipment.delete({ where: { id: dupEq.id } });
  console.log('Deleted duplicate equipment.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
