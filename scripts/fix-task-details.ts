import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Starting task detail fix for corrupted characters...');
  
  // Find tasks that contain multiple question marks (common when encoding fails)
  const tasks = await prisma.task.findMany({
    where: {
      taskDetail: {
        contains: '???',
      }
    }
  });

  console.log(`Found ${tasks.length} tasks with corrupted details (containing '???').`);

  let updatedCount = 0;
  for (const task of tasks) {
    if (task.taskDetail && task.taskDetail.includes('???')) {
       await prisma.task.update({
         where: { id: task.id },
         data: {
           taskDetail: task.taskName // Replace detail with task name
         }
       });
       updatedCount++;
    }
  }

  // Also check for single question marks if the entire field is just question marks
  const allTasks = await prisma.task.findMany({
      where: {
          taskDetail: {
              not: null
          }
      }
  });
  
  for (const task of allTasks) {
      if (task.taskDetail && /^[\?]+$/.test(task.taskDetail.trim())) {
          await prisma.task.update({
             where: { id: task.id },
             data: {
                 taskDetail: task.taskName
             }
          });
          updatedCount++;
      }
  }

  console.log(`Successfully updated ${updatedCount} tasks in total.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });