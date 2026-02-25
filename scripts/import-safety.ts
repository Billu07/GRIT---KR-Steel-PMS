import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Frequency } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Starting safety equipment import...');

  // 1. Find or create a category for Safety Equipment
  let category = await prisma.equipmentCategory.findFirst({
    where: { name: 'Safety Equipment' }
  });

  if (!category) {
    category = await prisma.equipmentCategory.create({
      data: {
        name: 'Safety Equipment',
        description: 'Safety and emergency equipment'
      }
    });
    console.log('Created Safety Equipment category');
  } else {
    console.log('Found existing Safety Equipment category');
  }

  // Admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  });

  if (!admin) {
    throw new Error("Admin user not found. Cannot create tasks without a creator.");
  }

  // Read and parse the CSV file
  const csvFilePath = path.join(process.cwd(), 'safety.csv');
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  let taskCount = 0;
  
  // Keep track of created equipment to avoid querying DB for every row
  const equipmentMap = new Map<string, any>();

  for (const row of records as any[]) {
    const equipmentName = row['Equipment/Item']?.trim();
    const frequencyStr = row['Frequency']?.trim();
    const taskName = row['Maintenance Task']?.trim();

    if (!equipmentName || !frequencyStr || !taskName) {
      continue;
    }

    // 2. Find or create the Equipment
    let equipment = equipmentMap.get(equipmentName);
    
    if (!equipment) {
      equipment = await prisma.equipment.findFirst({
        where: { name: equipmentName, categoryId: category.id }
      });

      if (!equipment) {
        const newCode = `SAF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        
        equipment = await prisma.equipment.create({
          data: {
            code: newCode,
            name: equipmentName,
            categoryId: category.id,
            status: 'active',
          }
        });
        console.log(`Created Equipment: ${equipmentName} with code ${newCode}`);
      } else {
        console.log(`Found existing Equipment: ${equipmentName}`);
      }
      equipmentMap.set(equipmentName, equipment);
    }

    // Determine frequency
    let frequency: Frequency = Frequency.monthly; // default
    const fStrLower = frequencyStr.toLowerCase();
    
    if (fStrLower.includes('weekly')) frequency = Frequency.weekly;
    else if (fStrLower.includes('monthly') && !fStrLower.includes('3') && !fStrLower.includes('6')) frequency = Frequency.monthly;
    else if (fStrLower.includes('3 monthly') || fStrLower.includes('quarterly')) frequency = Frequency.quarterly;
    else if (fStrLower.includes('6 monthly') || fStrLower.includes('semi-annually')) frequency = Frequency.semi_annually;
    else if (fStrLower.includes('yearly') && !fStrLower.includes('5')) frequency = Frequency.yearly;
    else if (fStrLower.includes('5 yearly')) frequency = Frequency.five_yearly;
    else if (fStrLower.includes('daily')) frequency = Frequency.daily;

    const taskIdStr = `TSK-${equipment.id}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create the task
    try {
        await prisma.task.create({
            data: {
                taskId: taskIdStr,
                taskName: taskName.substring(0, 150) + (taskName.length > 150 ? '...' : ''),
                taskDetail: taskName, 
                frequency,
                equipmentId: equipment.id,
                createdBy: admin.id,
                criticality: 'medium'
            }
        });
        taskCount++;
    } catch (e) {
        console.error(`Error processing task for ${equipmentName}:`, e);
    }
  }

  console.log(`Successfully imported ${taskCount} tasks for Safety Equipment.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });