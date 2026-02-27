import { prisma } from '../src/lib/prisma';

async function main() {
  // 1. Rename existing Hydraulic Crawler Crane to include 200 Ton
  const crane200 = await prisma.equipment.findFirst({
    where: { name: 'Hydraulic Crawler Crane' }
  });

  if (crane200) {
    await prisma.equipment.update({
      where: { id: crane200.id },
      data: { name: 'Hydraulic Crawler Crane 200 Ton' }
    });
    console.log(`Renamed Hydraulic Crawler Crane to Hydraulic Crawler Crane 200 Ton (ID: ${crane200.id})`);
  } else {
    console.log('Hydraulic Crawler Crane 200 Ton not found or already renamed.');
  }

  // 2. Add Hydraulic Crawler Crane 120 Ton
  let crane120 = await prisma.equipment.findFirst({
    where: { name: 'Hydraulic Crawler Crane 120 Ton' }
  });

  if (!crane120) {
    // Generate unique code
    let isUnique = false;
    let newCode = "";
    while (!isUnique) {
        const rand = Math.floor(1000 + Math.random() * 9000); 
        newCode = `HEA-${rand}`;
        const existingCode = await prisma.equipment.findUnique({ where: { code: newCode } });
        if (!existingCode) isUnique = true;
    }

    crane120 = await prisma.equipment.create({
      data: {
        code: newCode,
        name: 'Hydraulic Crawler Crane 120 Ton',
        categoryId: crane200 ? crane200.categoryId : 1, // fallback to 1
        location: 'First Cutting Zone',
        brand: 'Kobelco',
        capacity: '120 Ton',
        model: '7120',
      }
    });
    console.log(`Created Hydraulic Crawler Crane 120 Ton (ID: ${crane120.id})`);
  } else {
    console.log(`Hydraulic Crawler Crane 120 Ton already exists (ID: ${crane120.id})`);
  }

  // 3. Move tasks from old "Crawler Crane 200 Ton" (or "Crawler Crane") to these two
  const oldCrane = await prisma.equipment.findFirst({
    where: { name: 'Crawler Crane 200 Ton' },
    include: { tasks: true, maintenanceHistory: true }
  });

  if (!oldCrane) {
    console.log('Old Crawler Crane not found.');
    return;
  }

  const actualCrane200 = crane200 || await prisma.equipment.findFirst({ where: { name: 'Hydraulic Crawler Crane 200 Ton' } });

  if (actualCrane200 && crane120) {
    console.log(`Found old crane ID: ${oldCrane.id} with ${oldCrane.tasks.length} tasks and ${oldCrane.maintenanceHistory.length} logs.`);

    // First, duplicate tasks and history to crane 120
    if (oldCrane.tasks.length > 0) {
      const newTasksFor120 = oldCrane.tasks.map(t => ({
        taskId: `TSK-${crane120!.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        taskName: t.taskName,
        frequency: t.frequency,
        taskDetail: t.taskDetail,
        equipmentId: crane120!.id,
        createdBy: t.createdBy,
        criticality: t.criticality,
        lastCompletedDate: t.lastCompletedDate,
        nextDueDate: t.nextDueDate,
      }));
      await prisma.task.createMany({ data: newTasksFor120 });
      console.log(`Copied ${newTasksFor120.length} tasks to 120 Ton crane.`);
      
      // Also copy logs for 120T? Usually moving tasks means duplicating the maintenance logs or just the tasks.
      // The user said "move all the tasks... and be consistent so that tasks we just logged... also go".
      // Let's duplicate logs to 120T too so it has the same history.
      const newLogsFor120 = [];
      const createdTasks120 = await prisma.task.findMany({ where: { equipmentId: crane120!.id } });

      for (const log of oldCrane.maintenanceHistory) {
        // match task by name
        let matchedTaskId = null;
        if (log.taskId) {
            const oldTask = oldCrane.tasks.find(t => t.id === log.taskId);
            if (oldTask) {
                const newTask = createdTasks120.find(t => t.taskName === oldTask.taskName);
                if (newTask) matchedTaskId = newTask.id;
            }
        }
        
        newLogsFor120.push({
            equipmentId: crane120!.id,
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
      if (newLogsFor120.length > 0) {
          // @ts-ignore
          await prisma.maintenanceHistory.createMany({ data: newLogsFor120 });
          console.log(`Copied ${newLogsFor120.length} logs to 120 Ton crane.`);
      }
    }

    // Move original tasks and logs to 200 Ton crane
    const movedTasks = await prisma.task.updateMany({
      where: { equipmentId: oldCrane.id },
      data: { equipmentId: actualCrane200.id }
    });
    
    const movedLogs = await prisma.maintenanceHistory.updateMany({
      where: { equipmentId: oldCrane.id },
      data: { equipmentId: actualCrane200.id }
    });
    
    console.log(`Moved ${movedTasks.count} tasks and ${movedLogs.count} logs to Hydraulic Crawler Crane 200 Ton.`);
    
    // Optionally deactivate old crane
    await prisma.equipment.update({
        where: { id: oldCrane.id },
        data: { status: 'inactive', name: `${oldCrane.name} (Archived)` }
    });
    console.log(`Archived old Crawler Crane.`);
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());