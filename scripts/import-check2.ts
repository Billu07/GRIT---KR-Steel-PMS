import { prisma } from '../src/lib/prisma';

const craneTasks = [
  { frequency: 'daily', items: ['Inspect outriggers, pads, and ground conditions', 'Check hydraulic fluid levels and leaks', 'Verify wire rope integrity (eye splices, wear, broken wires)', 'Test emergency stop systems', 'Check boom angle indicators and load moment indicators (LMI)'] },
  { frequency: 'weekly', items: ['Lubricate pivot points and track rollers', 'Inspect undercarriage tracks and tensioners', 'Verify all safety signage and warning labels are legible'] },
  { frequency: 'monthly', items: ['Perform full inspection of hoisting and slewing mechanisms', 'Check pinion gear mesh and lubrication', 'Inspect structural welds for cracks or deformation'] },
  { frequency: 'quarterly', items: ['Calibrate LMI and load sensors', 'Conduct functional test of anti-two-block system', 'Review operator logs for anomalies'] },
  { frequency: 'yearly', items: ['Full structural inspection by certified inspector', 'Non-destructive testing (NDT) of main boom sections', 'Hydraulic system flush and filter replacement'] },
  { frequency: 'yearly', items: ['Complete metallurgical assessment of main boom and jib structures', 'Re-certification of crane via third-party inspection body', 'Update load charts based on condition'] }
];

const winchTasks = [
  { frequency: 'daily', items: ['Inspect drum for fraying, cracks, or misalignment', 'Check cable exit path and guide sheaves', 'Confirm brake engagement and release'] },
  { frequency: 'weekly', items: ['Lubricate winch gearbox and bearings', 'Inspect mounting bolts and frame integrity'] },
  { frequency: 'monthly', items: ['Test load capacity under controlled conditions (partial load)', 'Verify overload protection devices'] },
  { frequency: 'quarterly', items: ['Replace hydraulic oil (if applicable)', 'Inspect motor coupling and shaft alignment'] },
  { frequency: 'semi_annually', items: ['Perform full dynamic load test (up to 110% of rated capacity)'] },
  { frequency: 'yearly', items: ['Disassemble and inspect internal gears and brakes', 'Replace worn bushings and seals'] },
  { frequency: 'yearly', items: ['Full rebuild or replacement recommended based on usage history and NDT results'] }
];

const vehicleTasks = [
  { frequency: 'daily', items: ['Check engine oil, coolant, fuel, and hydraulic fluid levels', 'Inspect blade, bucket, tires, and undercarriage', 'Test lights, horns, and alarms'] },
  { frequency: 'weekly', items: ['Lubricate chassis joints, blade hinges, and track pins', 'Inspect drive sprockets and idlers'] },
  { frequency: 'monthly', items: ['Change engine oil and filters', 'Inspect transmission and differential fluids', 'Test braking system performance'] },
  { frequency: 'quarterly', items: ['Perform comprehensive diagnostics via onboard computer', 'Inspect exhaust system and cooling fan belts'] },
  { frequency: 'semi_annually', items: ['Replace air filters and fuel filters', 'Inspect and adjust blade alignment'] },
  { frequency: 'yearly', items: ['Full engine tune-up and valve clearance check', 'Wheel bearing repacking', 'Frame and structural inspection'] },
  { frequency: 'yearly', items: ['Major overhaul: replace transmission, engine rebuild (if needed), and recondition undercarriage'] }
];

const mapping = [
  { keywords: ['Crawler Crane', 'Pick & Carry'], tasks: craneTasks },
  { keywords: ['Pulling Winch'], tasks: winchTasks },
  { keywords: ['Bulldozer', 'Dump Truck'], tasks: vehicleTasks }
];

async function main() {
  const admin = await prisma.user.findFirst();
  if (!admin) {
    console.error("No users found to set as creator.");
    return;
  }

  const allEquipments = await prisma.equipment.findMany();
  
  let globalCounter = Date.now() % 1000000;
  
  for (const eq of allEquipments) {
    let tasksToApply: any[] = [];
    
    for (const map of mapping) {
      if (map.keywords.some(kw => eq.name.includes(kw))) {
        tasksToApply = map.tasks;
        break;
      }
    }
    
    if (tasksToApply.length === 0) continue;
    
    console.log(`Processing ${eq.name} (${eq.code})...`);
    
    // Existing tasks for this eq
    const existingTasks = await prisma.task.findMany({
      where: { equipmentId: eq.id }
    });
    const existingNames = existingTasks.map(t => t.taskName.toLowerCase());
    
    for (const group of tasksToApply) {
      for (const item of group.items) {
        // truncate to 50 chars for taskName, put full in taskDetail
        let shortName = item.split(' ').slice(0, 5).join(' ');
        if (shortName.length > 40) shortName = shortName.substring(0, 40) + '...';
        
        if (!existingNames.includes(shortName.toLowerCase())) {
          globalCounter++;
          
          await prisma.task.create({
            data: {
              taskId: `TSK-${String(globalCounter).padStart(6, '0')}`,
              taskName: shortName,
              frequency: group.frequency,
              taskDetail: item,
              criticality: 'medium',
              equipment: {
                connect: { id: eq.id }
              },
              creator: {
                connect: { id: admin.id }
              }
            }
          });
          console.log(`  Added: ${shortName}`);
        } else {
          console.log(`  Skipped (exists): ${shortName}`);
        }
      }
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
