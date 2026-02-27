import { prisma } from '../src/lib/prisma';

async function main() {
  const sourceTruck = await prisma.equipment.findFirst({
    where: { name: 'Dump Truck 10 Ton' },
    include: { tasks: true, maintenanceHistory: true }
  });

  const targetTruck = await prisma.equipment.findFirst({
    where: { name: 'Dump Truck (Hino)' }
  });

  if (!sourceTruck || !targetTruck) {
    console.error('Could not find both dump trucks.');
    return;
  }

  console.log(`Copying tasks and history from '${sourceTruck.name}' to '${targetTruck.name}'...`);

  if (sourceTruck.tasks && sourceTruck.tasks.length > 0) {
    const newTasks = sourceTruck.tasks.map(t => ({
      taskId: `TSK-${targetTruck.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      taskName: t.taskName,
      frequency: t.frequency,
      taskDetail: t.taskDetail,
      equipmentId: targetTruck.id,
      createdBy: t.createdBy,
      criticality: t.criticality,
      lastCompletedDate: t.lastCompletedDate,
      nextDueDate: t.nextDueDate,
    }));

    await prisma.task.createMany({ data: newTasks });
    console.log(`✅ Copied ${newTasks.length} tasks.`);
    
    // Create history records matched to the new tasks
    const createdTasks = await prisma.task.findMany({ where: { equipmentId: targetTruck.id } });
    const newLogs = [];

    for (const log of sourceTruck.maintenanceHistory) {
      let matchedTaskId = null;
      if (log.taskId) {
          const oldTask = sourceTruck.tasks.find(t => t.id === log.taskId);
          if (oldTask) {
              const newTask = createdTasks.find(t => t.taskName === oldTask.taskName);
              if (newTask) matchedTaskId = newTask.id;
          }
      }
      
      newLogs.push({
          equipmentId: targetTruck.id,
          taskId: matchedTaskId,
          type: log.type,
          targetDate: log.targetDate,
          informationDate: log.informationDate,
          serviceStartDate: log.serviceStartDate,
          serviceEndDate: log.serviceEndDate,
          problemDescription: log.problemDescription,
          solutionDetails: log.solutionDetails,
          usedParts: log.usedParts,
          workType: log.workType,
          problemType: log.problemType,
          remarks: log.remarks,
          maintenanceDate: log.maintenanceDate,
          maintenanceDetails: log.maintenanceDetails,
          performedAt: log.performedAt,
          createdAt: log.createdAt
      });
    }

    if (newLogs.length > 0) {
        // @ts-ignore
        await prisma.maintenanceHistory.createMany({ data: newLogs });
        console.log(`✅ Copied ${newLogs.length} maintenance logs.`);
    }
  } else {
    console.log('No tasks found on source truck.');
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());