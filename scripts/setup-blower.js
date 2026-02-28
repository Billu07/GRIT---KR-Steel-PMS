const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function processBlower() {
  const connectionString = process.env.DATABASE_URL || '';
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const equipmentId = 213; // Blower And Duct ID
    const lastCompletedDate = new Date('2026-02-01');

    const tasksToCreate = [
      // Daily
      { name: 'Visual Inspection: Damage, leaks, or loose parts', freq: 'daily' },
      { name: 'Listen for Unusual Noises (grinding, rattling, humming)', freq: 'daily' },
      { name: 'Check Airflow adequacy', freq: 'daily' },
      // Weekly
      { name: 'External Cleaning of blower unit', freq: 'weekly' },
      // Monthly
      { name: 'Lubrication of bearings and motor shaft', freq: 'monthly' },
      { name: 'Inspect electrical connections for tightness/corrosion', freq: 'monthly' },
      { name: 'Check mounting hardware and bolts tightness', freq: 'monthly' },
      { name: 'Impeller/Fan Blade Inspection', freq: 'monthly' },
      { name: 'Visual Inspection of ductwork sections', freq: 'monthly' },
      { name: 'Connection Check of all joints and seals', freq: 'monthly' },
      // Annual
      { name: 'Internal Cleaning of blower housing and impeller', freq: 'yearly' },
      { name: 'Motor Service and thorough inspection', freq: 'yearly' },
      { name: 'Electrical System Overhaul and testing', freq: 'yearly' },
      { name: 'Replace Wear Parts (belts, seals, or bearings)', freq: 'yearly' },
      { name: 'Full Duct System Inspection', freq: 'yearly' },
      { name: 'Structural Integrity assessment of ductwork', freq: 'yearly' }
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

    console.log(`Creating tasks for Blower starting from TSK-${String(maxNum + 1).padStart(4, '0')}...`);

    const createdTasks = [];
    for (const t of tasksToCreate) {
      maxNum++;
      const taskId = `TSK-${String(maxNum).padStart(4, '0')}`;
      
      let nextDueDate = new Date(lastCompletedDate);
      if (t.freq === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
      else if (t.freq === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
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
    console.log('Backfilling logs for Blower...');
    const startDay = 2;
    const endDay = 28;
    const year = 2026;
    const month = 1; // February

    const logsBatch = [];
    for (let day = startDay; day <= endDay; day++) {
      const currentDate = new Date(year, month, day);
      const isSunday = currentDate.getDay() === 0;

      for (const task of createdTasks) {
        let shouldLog = false;
        if (task.frequency === 'daily') shouldLog = true;
        else if (task.frequency === 'weekly' && isSunday) shouldLog = true;

        if (shouldLog) {
          logsBatch.push({
            equipmentId: equipmentId,
            taskId: task.id,
            maintenanceDate: currentDate,
            performedAt: currentDate,
            targetDate: currentDate,
            maintenanceDetails: `Routine ${task.frequency} maintenance: ${task.taskName}`,
            remarks: `${task.taskName} verified. Blower unit performing within standard parameters.`,
            usedParts: (task.frequency === 'daily' || task.frequency === 'weekly') ? 'no parts used' : '',
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

    // 3. Update Task Status for latest dates in Feb
    console.log('Updating current task status...');
    const lastDaily = new Date(2026, 1, 28);
    const nextDaily = new Date(2026, 2, 1);
    const lastWeekly = new Date(2026, 1, 22);
    const nextWeekly = new Date(2026, 2, 1);

    for (const task of createdTasks) {
        if (task.frequency === 'daily') {
            await prisma.task.update({
                where: { id: task.id },
                data: { lastCompletedDate: lastDaily, nextDueDate: nextDaily }
            });
        } else if (task.frequency === 'weekly') {
            await prisma.task.update({
                where: { id: task.id },
                data: { lastCompletedDate: lastWeekly, nextDueDate: nextWeekly }
            });
        }
    }

    console.log('Blower setup complete.');

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

processBlower();
