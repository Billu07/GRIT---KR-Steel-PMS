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

// Category mapping logic - ONLY 4 PRIMARY CATEGORIES
function getCategoryName(machineName: string): string {
  const lower = machineName.toLowerCase();
  
  // Safety Equipment
  if (
    lower.includes('rescue boat') || 
    lower.includes('flashback') || 
    lower.includes('fire') || 
    lower.includes('first aid')
  ) {
    return 'Safety Equipment';
  }

  // Measurement Equipment
  if (
    lower.includes('micrometer') || 
    lower.includes('caliper') || 
    lower.includes('gauge') || 
    lower.includes('meter')
  ) {
    return 'Measurement Equipment';
  }

  // PPE
  if (
    lower.includes('helmet') || 
    lower.includes('gloves') || 
    lower.includes('boots')
  ) {
    return 'PPE and Personal Equipment';
  }

  // Everything else is Material Handling Equipment (Machinery, Tools, Vehicles, etc.)
  return 'Material Handling Equipment';
}

async function main() {
  console.log('Starting import into 4 primary categories...');

  const csvPath = path.join(process.cwd(), 'machinery.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Split by new line and filter out empty lines
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Remove header
  const headers = lines.shift();
  
  console.log(`Found ${lines.length} records to process.`);

  // predefined categories to ensure they exist (IDs 1-4)
  const predefinedCategories = [
    { id: 1, name: 'Material Handling Equipment' },
    { id: 2, name: 'Measurement Equipment' },
    { id: 3, name: 'Safety Equipment' },
    { id: 4, name: 'PPE and Personal Equipment' }
  ];

  const categoryMap = new Map<string, number>();
  
  for (const cat of predefinedCategories) {
    const dbCat = await prisma.equipmentCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name },
      create: { id: cat.id, name: cat.name, description: 'Primary category' },
    });
    categoryMap.set(cat.name, dbCat.id);
    console.log(`Ensured category: ${cat.name} (ID: ${dbCat.id})`);
  }

  // 2. Process Records
  for (const line of lines) {
    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;

    const [
        siNo, 
        machineNameRaw, 
        capacity, 
        model, 
        serialNo, 
        brand, 
        location, 
        runningHours, 
        testCertNo, 
        testCertValidity, 
        testCertApplied
    ] = cols;

    const machineName = machineNameRaw.replace(/^"|"$/g, '').trim();
    if (!machineName) continue;

    const categoryName = getCategoryName(machineName);
    const categoryId = categoryMap.get(categoryName);

    if (!categoryId) {
        console.error(`Error: Category ID not found for ${categoryName}`);
        continue;
    }

    const code = siNo && siNo.trim() ? `EQ-${siNo.trim().padStart(3, '0')}` : `EQ-IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const cleanString = (s: string) => s === '───' || !s ? null : s.replace(/^"|"$/g, '').trim();

    try {
        await prisma.equipment.upsert({
            where: { code: code },
            update: {
                name: machineName,
                categoryId: categoryId,
                capacity: cleanString(capacity),
                model: cleanString(model),
                serialNumber: cleanString(serialNo),
                brand: cleanString(brand),
                location: cleanString(location),
                runningHours: cleanString(runningHours),
                testCertNumber: cleanString(testCertNo),
                testCertValidity: cleanString(testCertValidity),
                testCertApplied: cleanString(testCertApplied),
            },
            create: {
                code: code,
                name: machineName,
                categoryId: categoryId,
                status: 'active',
                capacity: cleanString(capacity),
                model: cleanString(model),
                serialNumber: cleanString(serialNo),
                brand: cleanString(brand),
                location: cleanString(location),
                runningHours: cleanString(runningHours),
                testCertNumber: cleanString(testCertNo),
                testCertValidity: cleanString(testCertValidity),
                testCertApplied: cleanString(testCertApplied),
                description: 'Imported from machinery.csv'
            }
        });
        console.log(`Imported: ${machineName} -> ${categoryName}`);
    } catch (err) {
        console.error(`Failed to import ${machineName}:`, err);
    }
  }

  console.log('Import complete.');
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
