import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient, Frequency } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting checklist import...');

  // 1. Find or create a category for heavy machinery
  let category = await prisma.equipmentCategory.findFirst({
    where: { name: 'Heavy Machinery' }
  });

  if (!category) {
    category = await prisma.equipmentCategory.create({
      data: {
        name: 'Heavy Machinery',
        description: 'Large earth-moving and construction equipment'
      }
    });
    console.log('Created Heavy Machinery category');
  }

  // 2. Find or create the Hydraulic Excavator equipment
  let excavator = await prisma.equipment.findFirst({
    where: { name: 'Hydraulic Excavator' }
  });

  if (!excavator) {
    // Generate a unique code
    const count = await prisma.equipment.count();
    const newCode = `EQ-${String(count + 1).padStart(4, '0')}`;
    
    excavator = await prisma.equipment.create({
      data: {
        code: newCode,
        name: 'Hydraulic Excavator',
        categoryId: category.id,
        status: 'active',
        safetyMeasures: 'Only trained & authorized operator should operate the excavator. Do not work under suspended load. Always park machine on level ground and engage safety lock. Wear proper PPE (helmet, safety shoes, hand gloves).'
      }
    });
    console.log(`Created Hydraulic Excavator with code ${newCode}`);
  } else {
    console.log(`Found existing Hydraulic Excavator (ID: ${excavator.id})`);
  }

  // 3. Read and parse the CSV file
  const csvFilePath = path.join(process.cwd(), 'checklist.csv');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

  const records = parse(fileContent, {
    skip_empty_lines: true,
    relax_column_count: true
  });

  // 4. Process records (skip headers, start at row 6 where data begins)
  let taskCount = 0;
  for (let i = 5; i < records.length; i++) {
    const row = records[i];
    const siNo = row[0]?.trim();
    
    // Stop if we hit the safety instructions at the end
    if (!siNo || siNo.includes('Safety')) break;
    
    // The checkpoint text contains both English and Bengali.
    let checkPoint = row[1]?.trim();
    if (!checkPoint) continue;
    
    const parts = checkPoint.split('\n');
    const taskName = parts[0].trim();
    const taskDetail = parts.length > 1 ? parts.slice(1).join(' ').trim() : '';

    // Determine frequency from columns 2 to 9
    let frequency: Frequency = Frequency.monthly; // default
    if (row[2]?.includes('?')) frequency = Frequency.hourly;
    else if (row[3]?.includes('?')) frequency = Frequency.daily;
    else if (row[4]?.includes('?')) frequency = Frequency.weekly;
    else if (row[5]?.includes('?')) frequency = Frequency.fifteen_days;
    else if (row[6]?.includes('?')) frequency = Frequency.monthly;
    else if (row[7]?.includes('?')) frequency = Frequency.quarterly;
    else if (row[8]?.includes('?')) frequency = Frequency.semi_annually;
    else if (row[9]?.includes('?')) frequency = Frequency.yearly;

    const taskIdStr = `TSK-EXC-${siNo.padStart(3, '0')}`;

    // Create the task
    try {
        await prisma.task.upsert({
            where: { taskId: taskIdStr },
            update: {
                taskName,
                taskDetail,
                frequency,
                equipmentId: excavator.id
            },
            create: {
                taskId: taskIdStr,
                taskName,
                taskDetail,
                frequency,
                equipmentId: excavator.id,
                createdBy: 1, // Admin
                criticality: 'medium'
            }
        });
        taskCount++;
    } catch (e) {
        console.error(`Error processing task ${taskIdStr}:`, e);
    }
  }

  console.log(`Successfully imported ${taskCount} tasks for the Hydraulic Excavator.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });