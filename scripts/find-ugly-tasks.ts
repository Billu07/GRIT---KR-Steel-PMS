import { prisma } from '../src/lib/prisma';

async function main() {
  const tasks = await prisma.task.findMany();
  const uglyTasks = tasks.filter(t => t.taskName.match(/^\d+\./) && t.taskName.includes('2.'));
  console.log('Found', uglyTasks.length, 'ugly inline list tasks globally.');
  if (uglyTasks.length > 0) {
    uglyTasks.forEach(t => console.log('Ugly:', t.taskName));
  }
}

main().catch(console.error).finally(async () => { await prisma.$disconnect() });