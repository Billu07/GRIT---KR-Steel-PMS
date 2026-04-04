import { prisma } from '../src/lib/prisma';

async function main() {
  const allTasks = await prisma.task.findMany({
    select: { taskId: true }
  });

  const ids = allTasks
    .map(t => {
      const match = t.taskId?.match(/(\d+)$/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(n => n !== null)
    .sort((a, b) => a - b);

  console.log('Task ID number range:', ids[0], 'to', ids[ids.length - 1]);
  console.log('Total tasks with numeric IDs:', ids.length);
  
  const smallIds = ids.filter(n => n < 1000);
  console.log('Highest small ID (<1000):', smallIds[smallIds.length - 1]);
}

main().catch(console.error).finally(() => prisma.$disconnect());