import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Fixing Target Dates for Daily Tasks logged on March 3rd...');
    
    // Find all 'scheduled' maintenance logs with maintenanceDate = March 3rd 
    // for tasks with frequency = 'daily' where targetDate is March 14th
    const logsToFix = await prisma.maintenanceHistory.findMany({
        where: {
            type: 'scheduled',
            maintenanceDate: {
                gte: new Date('2026-03-03T00:00:00.000Z'),
                lte: new Date('2026-03-03T23:59:59.999Z')
            },
            task: {
                frequency: 'daily'
            },
            targetDate: {
                gte: new Date('2026-03-14T00:00:00.000Z'),
                lte: new Date('2026-03-14T23:59:59.999Z')
            }
        }
    });

    console.log(`Found ${logsToFix.length} logs with incorrect Target Date (March 14th) instead of March 3rd.`);

    if (logsToFix.length === 0) {
        console.log('No logs found to fix.');
        return;
    }

    // Update these logs to set targetDate = March 3rd
    const updateResult = await prisma.maintenanceHistory.updateMany({
        where: {
            id: {
                in: logsToFix.map(l => l.id)
            }
        },
        data: {
            targetDate: new Date('2026-03-03T00:00:00.000Z')
        }
    });

    console.log(`Successfully updated ${updateResult.count} maintenance logs to targetDate = March 3rd.`);
    console.log('Operation completed.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });