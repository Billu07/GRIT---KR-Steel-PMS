import { prisma } from '../src/lib/prisma';

async function main() {
  const indices = [1, 2, 3, 4];

  for (const i of indices) {
    const hydName = `Hydraulic Excavator ${i}`;
    const magName = `Magnetic Excavator-${i}`;

    console.log(`Processing transfer: ${hydName} -> ${magName}`);

    const hydEq = await prisma.equipment.findFirst({ where: { name: hydName } });
    const magEq = await prisma.equipment.findFirst({ where: { name: magName } });

    if (!hydEq) {
      console.error(`  ❌ Source equipment not found: ${hydName}`);
      continue;
    }
    
    if (!magEq) {
      console.error(`  ❌ Target equipment not found: ${magName}`);
      continue;
    }

    // Move tasks
    const tasksUpdate = await prisma.task.updateMany({
      where: { equipmentId: hydEq.id },
      data: { equipmentId: magEq.id }
    });
    console.log(`  ✅ Moved ${tasksUpdate.count} tasks.`);

    // Move maintenance history
    const historyUpdate = await prisma.maintenanceHistory.updateMany({
      where: { equipmentId: hydEq.id },
      data: { equipmentId: magEq.id }
    });
    console.log(`  ✅ Moved ${historyUpdate.count} maintenance logs.`);
  }

  console.log('All transfers completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });