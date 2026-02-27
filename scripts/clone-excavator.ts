import { prisma } from '../src/lib/prisma';

async function main() {
  const sourceEquipment = await prisma.equipment.findFirst({
    where: { name: 'Hydraulic Excavator 1' },
    include: { tasks: true }
  });

  if (!sourceEquipment) {
    console.error('Source equipment "Hydraulic Excavator 1" not found!');
    return;
  }

  console.log(`Found source equipment with ID: ${sourceEquipment.id}, tasks count: ${sourceEquipment.tasks.length}`);

  const namesToCreate = [
    'Hydraulic Excavator 2',
    'Hydraulic Excavator 3',
    'Hydraulic Excavator 4'
  ];

  for (const newName of namesToCreate) {
    const existing = await prisma.equipment.findFirst({ where: { name: newName } });
    if (existing) {
      console.log(`Equipment "${newName}" already exists, skipping creation.`);
      continue;
    }

    let newCode = sourceEquipment.code;
    if (newCode.includes('1')) {
        newCode = newCode.replace('1', newName.split(' ')[2]);
    } else {
        newCode = `${newCode}-${newName.split(' ')[2]}`;
    }

    // Ensure unique code
    const existingCode = await prisma.equipment.findUnique({ where: { code: newCode }});
    if (existingCode) {
        newCode = `${newCode}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Create new equipment
    const newEquipment = await prisma.equipment.create({
      data: {
        code: newCode,
        name: newName,
        categoryId: sourceEquipment.categoryId,
        location: sourceEquipment.location,
        description: sourceEquipment.description,
        status: sourceEquipment.status,
        imageUrl: sourceEquipment.imageUrl,
        safetyMeasures: sourceEquipment.safetyMeasures,
        brand: sourceEquipment.brand,
        capacity: sourceEquipment.capacity,
        model: sourceEquipment.model,
        runningHours: sourceEquipment.runningHours,
        serialNumber: sourceEquipment.serialNumber,
        testCertApplied: sourceEquipment.testCertApplied,
        testCertNumber: sourceEquipment.testCertNumber,
        testCertValidity: sourceEquipment.testCertValidity,
        serviceReportUrl: sourceEquipment.serviceReportUrl,
      }
    });

    console.log(`Created new equipment: ${newName} with ID: ${newEquipment.id}`);

    // Create tasks for new equipment
    if (sourceEquipment.tasks && sourceEquipment.tasks.length > 0) {
      const taskData = sourceEquipment.tasks.map(task => ({
        taskId: `TSK-${newEquipment.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        taskName: task.taskName,
        frequency: task.frequency,
        taskDetail: task.taskDetail,
        equipmentId: newEquipment.id,
        createdBy: task.createdBy,
        criticality: task.criticality,
        lastCompletedDate: null,
        nextDueDate: null, 
      }));

      await prisma.task.createMany({
        data: taskData
      });
      console.log(`Created ${taskData.length} tasks for ${newName}`);
    }
  }

  console.log('Duplication complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
