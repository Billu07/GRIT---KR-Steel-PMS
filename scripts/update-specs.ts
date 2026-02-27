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

function cleanVal(v: string | undefined) {
    if (!v) return null;
    const trimmed = v.trim();
    if (trimmed === '???' || trimmed === '' || trimmed === '───') return null;
    return trimmed;
}

async function main() {
  const csvData = fs.readFileSync('machine.csv', 'utf8');
  const rows = parseCSV(csvData);
  let updatedCount = 0;

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
    
    // We only update if the equipment ALREADY exists 
    // AND if we have at least one piece of data to add
    if (capacity || model || serialNumber || brand || location || testCertNumber) {
        // Special case for Dump Trucks (there are two in CSV but only one generic "Dump Truck" in DB)
        if (machineName === 'Dump Truck') {
            const dumpTrucks = await prisma.equipment.findMany({ where: { name: 'Dump Truck' } });
            
            // If the generic Dump Truck has no brand/model, update it with the first one from CSV
            if (dumpTrucks.length === 1 && !dumpTrucks[0].brand) {
               await prisma.equipment.update({
                 where: { id: dumpTrucks[0].id },
                 data: {
                    name: `Dump Truck 10 Ton`, // Give it a specific name based on CSV
                    capacity: capacity || undefined,
                    model: model || undefined,
                    serialNumber: serialNumber || undefined,
                    brand: brand || undefined,
                    location: location || undefined
                 }
               });
               updatedCount++;
               console.log(`Updated existing Dump Truck with specs: ${capacity}, ${brand}, ${model}`);
            }
            continue; // Skip the second dump truck in CSV for now to avoid overwriting the first
        }
    
        // Normal update for everything else
        const existing = await prisma.equipment.findFirst({
          where: { name: machineName }
        });

        if (existing) {
          const updateData: any = {};
          
          // Only update fields that are currently null or empty string in the DB
          if ((!existing.capacity || existing.capacity === '') && capacity) updateData.capacity = capacity;
          if ((!existing.model || existing.model === '') && model) updateData.model = model;
          if ((!existing.serialNumber || existing.serialNumber === '') && serialNumber) updateData.serialNumber = serialNumber;
          if ((!existing.brand || existing.brand === '') && brand) updateData.brand = brand;
          if ((!existing.location || existing.location === '') && location) updateData.location = location;
          if ((!existing.testCertNumber || existing.testCertNumber === '') && testCertNumber) updateData.testCertNumber = testCertNumber;
          if ((!existing.testCertValidity || existing.testCertValidity === '') && testCertValidity) updateData.testCertValidity = testCertValidity;

          if (Object.keys(updateData).length > 0) {
             await prisma.equipment.update({
                 where: { id: existing.id },
                 data: updateData
             });
             updatedCount++;
             console.log(`Updated ${machineName} with new specs from CSV:`, Object.keys(updateData));
          }
        }
    }
  }
  
  // Handle the second Dump truck from CSV if it doesn't exist
  const secondDumpTruck = await prisma.equipment.findFirst({ where: { name: 'Dump Truck (Hino)' } });
  if (!secondDumpTruck) {
     const materialCat = await prisma.equipmentCategory.findFirst({ where: { name: 'Material Handling Equipment' } });
     if (materialCat) {
         let isUnique = false;
         let newCode = "";
         while (!isUnique) {
            const rand = Math.floor(1000 + Math.random() * 9000); 
            newCode = `MAT-${rand}`;
            const existingCode = await prisma.equipment.findUnique({ where: { code: newCode } });
            if (!existingCode) isUnique = true;
         }

         await prisma.equipment.create({
             data: {
                 code: newCode,
                 name: 'Dump Truck (Hino)',
                 categoryId: materialCat.id,
                 brand: 'Hino Motors',
                 model: 'FS3FPD',
                 serialNumber: 'Chassis No: 10250',
                 location: 'Whole SRF'
             }
         });
         console.log(`Created second Dump Truck (Hino) from CSV.`);
     }
  }

  console.log(`Finished updating. ${updatedCount} existing machines were updated with new specifications.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());