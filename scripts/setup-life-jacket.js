const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function processLifeJacket() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const equipmentId = 212; // Life Jacket ID from previous step
    const lastCompletedDate = new Date('2026-02-01');

    const tasksToCreate = [
      { name: 'Check for cuts, tears, or physical damage', freq: 'weekly' },
      { name: 'Inspect straps and buckles for secure condition', freq: 'weekly' },
      { name: 'Ensure proper storage (dry, clean, no moisture)', freq: 'weekly' },
      { name: 'Inspect stitching and outer cover condition', freq: 'monthly' },
      { name: 'Check buoyancy material condition (no deformation)', freq: 'monthly' },
      { name: 'Verify whistle, light, and reflective tape condition', freq: 'monthly' },
      { name: 'Complete physical condition check of buoyancy material', freq: 'yearly' },
      { name: 'Replace damaged straps or accessories', freq: 'yearly' },
      { name: 'Remove from service if buoyancy reduced', freq: 'yearly' }
    ];

    // 1. Get current max Task ID
    const existingTasks = await prisma.task.findMany({ select: { taskId: true } });
    let maxNum = 0;
    existingTasks.forEach(t => {
      const match = t.taskId.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });

    console.log(`Creating tasks for Life Jacket starting from TSK-${String(maxNum + 1).padStart(4, '0')}...`);

    const createdTasks = [];
    for (const t of tasksToCreate) {
      maxNum++;
      const taskId = `TSK-${String(maxNum).padStart(4, '0')}`;
      
      let nextDueDate = new Date(lastCompletedDate);
      if (t.freq === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
      else if (t.freq === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      else if (t.freq === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

      const newTask = await prisma.task.create({
        data: {
          taskId,
          taskName: t.name,
          taskDetail: t.name,
          frequency: t.freq,
          equipmentId: equipmentId,
          lastCompletedDate: lastCompletedDate,
          nextDueDate: nextDueDate,
          criticality: 'medium',
          createdBy: 1
        }
      });
      createdTasks.push(newTask);
    }

    // 2. Backfill Logs from Feb 2 to Feb 28
    console.log('Backfilling logs for Life Jacket...');
    const startDay = 2;
    const endDay = 28;
    const year = 2026;
    const month = 1; // February (0-indexed)

    const logsBatch = [];
    for (let day = startDay; day <= endDay; day++) {
      const currentDate = new Date(year, month, day);
      const isSunday = currentDate.getDay() === 0;

      for (const task of createdTasks) {
        if (task.frequency === 'weekly' && isSunday) {
          logsBatch.push({
            equipmentId: equipmentId,
            taskId: task.id,
            maintenanceDate: currentDate,
            performedAt: currentDate,
            targetDate: currentDate,
            maintenanceDetails: `Routine weekly maintenance: ${task.taskName}`,
            remarks: `Life jacket inspected. ${task.taskName} - verified and in good condition.`,
            usedParts: 'no parts used',
            type: 'scheduled',
            workType: 'new'
          });
        }
      }
    }

    if (logsBatch.length > 0) {
      await prisma.maintenanceHistory.createMany({ data: logsBatch });
      console.log(`Created ${logsBatch.length} maintenance logs.`);
    }

    // 3. Update Task Status for Weekly tasks to the latest Feb Sunday
    console.log('Updating current task status...');
    const lastSunday = new Date(2026, 1, 22);
    const nextSunday = new Date(2026, 2, 1);

    for (const task of createdTasks) {
        if (task.frequency === 'weekly') {
            await prisma.task.update({
                where: { id: task.id },
                data: {
                    lastCompletedDate: lastSunday,
                    nextDueDate: nextSunday
                }
            });
        }
    }

    console.log('Life Jacket setup complete.');

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

processLifeJacket();
