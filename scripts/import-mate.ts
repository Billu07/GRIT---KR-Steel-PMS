import { Frequency } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

// Helper to parse CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function mapFrequency(freq: string): Frequency {
  const lower = freq.toLowerCase().trim();
  if (lower === 'daily') return Frequency.daily;
  if (lower === 'weekly') return Frequency.weekly;
  if (lower === 'monthly') return Frequency.monthly;
  if (lower === '3 monthly' || lower === 'quarterly') return Frequency.quarterly;
  if (lower === 'yearly') return Frequency.yearly;
  if (lower === '5-yearly') return Frequency.five_yearly;
  // default fallback
  return Frequency.monthly;
}

async function main() {
  console.log('Starting mate.csv import...');

  const csvPath = path.join(process.cwd(), 'mate.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
  const headers = lines.shift(); // remove header
  
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) {
    throw new Error("Admin user not found. Run seed script first.");
  }

  const category = await prisma.equipmentCategory.findFirst({
    where: { name: 'Material Handling Equipment' }
  });

  if (!category) {
    throw new Error("Category 'Material Handling Equipment' not found.");
  }

  const equipmentMap = new Map<string, number>();

  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (cols.length < 3) continue;

    const [equipmentNameRaw, frequencyRaw, taskNameRaw] = cols;
    
    const equipmentName = equipmentNameRaw.replace(/^"|"$/g, '').trim();
    const frequencyStr = frequencyRaw.replace(/^"|"$/g, '').trim();
    const taskName = taskNameRaw.replace(/^"|"$/g, '').trim();

    if (!equipmentName || !taskName) continue;

    // 1. Ensure Equipment exists
    let equipmentId = equipmentMap.get(equipmentName);
    if (!equipmentId) {
      // Try to find if it already exists by name just in case
      let existingEq = await prisma.equipment.findFirst({
        where: { name: equipmentName, categoryId: category.id }
      });
      
      if (!existingEq) {
          const code = `EQ-MATE-${Math.floor(Math.random() * 10000)}`;
          existingEq = await prisma.equipment.create({
            data: {
              code: code,
              name: equipmentName,
              categoryId: category.id,
              status: 'active',
              description: 'Imported from mate.csv'
            }
          });
          console.log(`Created Equipment: ${equipmentName}`);
      } else {
          console.log(`Found existing Equipment: ${equipmentName}`);
      }
      
      equipmentId = existingEq.id;
      equipmentMap.set(equipmentName, equipmentId);
    }

    // 2. Add Task
    const freq = mapFrequency(frequencyStr);
    const taskId = `TSK-${Date.now()}-${Math.floor(Math.random()*100000)}`;
    
    // Slight delay to prevent same taskId if created within same ms
    await new Promise(r => setTimeout(r, 2));

    await prisma.task.create({
      data: {
        taskId: taskId,
        taskName: taskName,
        taskDetail: taskName,
        frequency: freq,
        equipmentId: equipmentId,
        createdBy: adminUser.id,
      }
    });
    console.log(`  Added Task: ${taskName} (${frequencyStr})`);
  }

  console.log('Mate import complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
