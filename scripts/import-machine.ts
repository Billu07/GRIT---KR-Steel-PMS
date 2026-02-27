import { prisma } from '../src/lib/prisma';
import fs from 'fs';

function parseCSV(str: string) {
  const result = [];
  let row = [];
  let inQuotes = false;
  let val = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < str.length && str[i + 1] === '"') {
          val += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        val += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(val);
        val = '';
      } else if (char === String.fromCharCode(10)) {
        row.push(val);
        result.push(row);
        row = [];
        val = '';
      } else if (char === String.fromCharCode(13)) {
        // ignore
      } else {
        val += char;
      }
    }
  }
  if (val !== '' || row.length > 0) {
    row.push(val);
    result.push(row);
  }
  return result;
}

function getCategoryName(name: string) {
  const n = name.toLowerCase();
  if (n.includes('excavator') || n.includes('crane') || n.includes('bulldozer') || n.includes('truck') || n.includes('winch')) return 'Heavy Machinery';
  if (n.includes('lathe') || n.includes('grind') || n.includes('weld') || n.includes('drill') || n.includes('hammer')) return 'Workshop Equipment';
  if (n.includes('generator') || n.includes('incinerator') || n.includes('separator') || n.includes('blower') || n.includes('compressor') || n.includes('pump')) return 'Power & Utility';
  return 'Miscellaneous';
}

function cleanVal(v: string | undefined) {
    if (!v) return null;
    const trimmed = v.trim();
    if (trimmed === '???' || trimmed === '' || trimmed === '───') return null;
    return trimmed;
}

async function main() {
  const csvData = fs.readFileSync('machine.csv', 'utf8');
  const rows = parseCSV(csvData);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 7) continue;
    
    const machineName = cleanVal(row[1]);
    if (!machineName || machineName.toLowerCase().includes('machine name') || machineName.toLowerCase().includes('good')) continue;

    const capacity = cleanVal(row[2]);
    const model = cleanVal(row[3]);
    const serialNumber = cleanVal(row[4]);
    const brand = cleanVal(row[5]);
    const location = cleanVal(row[6]);
    
    const testCertNumber = cleanVal(row[13]);
    const testCertValidity = cleanVal(row[14]);
    const testCertApplied = cleanVal(row[15]);
    
    const existing = await prisma.equipment.findFirst({
      where: { name: machineName }
    });

    if (existing) {
      console.log(`Skipping existing: ${machineName}`);
      continue;
    }

    const categoryName = getCategoryName(machineName);
    let category = await prisma.equipmentCategory.findFirst({
      where: { name: categoryName }
    });

    if (!category) {
      category = await prisma.equipmentCategory.create({
        data: { name: categoryName, description: `${categoryName} (Imported)` }
      });
    }

    // ensure unique code
    let isUnique = false;
    let newCode = "";
    while (!isUnique) {
        const prefix = categoryName.substring(0, 3).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        newCode = `${prefix}-${rand}`;
        const existingCode = await prisma.equipment.findUnique({ where: { code: newCode } });
        if (!existingCode) isUnique = true;
    }

    const newEq = await prisma.equipment.create({
      data: {
        code: newCode,
        name: machineName,
        categoryId: category.id,
        location,
        brand,
        capacity,
        model,
        serialNumber,
        testCertNumber,
        testCertValidity,
        testCertApplied
      }
    });

    console.log(`Created: ${machineName} (${newEq.code}) under ${categoryName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());