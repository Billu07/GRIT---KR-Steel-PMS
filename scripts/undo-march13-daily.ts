import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting undo process for March 13th Daily tasks...');
    
    // Target date we want to identify logs for
    const targetDateStart = new Date('2026-03-13T00:00:00.000Z');
    const targetDateEnd = new Date('2026-03-13T23:59:59.999Z');

    console.log(`Looking for Scheduled Maintenance Logs performed between ${targetDateStart.toISOString()} and ${targetDateEnd.toISOString()}`);

    // Find all 'scheduled' maintenance logs recorded with a maintenanceDate on March 13th
    // that belong to tasks with a 'daily' frequency.
    const logsToDelete = await prisma.maintenanceHistory.findMany({
        where: {
            type: 'scheduled',
            maintenanceDate: {
                gte: targetDateStart,
                lte: targetDateEnd
            },
            task: {
                frequency: 'daily'
            }
        },
        include: {
            task: true
        }
    });

    console.log(`Found ${logsToDelete.length} logs matching criteria.`);

    if (logsToDelete.length === 0) {
        console.log('No logs found. Exiting.');
        return;
    }

    const taskIdsToUpdate = new Set(logsToDelete.map(log => log.taskId).filter(id => id !== null));
    console.log(`Found ${taskIdsToUpdate.size} unique tasks to update.`);

    // Begin Transaction
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete the logs
            const logIds = logsToDelete.map(log => log.id);
            const deleteResult = await tx.maintenanceHistory.deleteMany({
                where: {
                    id: {
                        in: logIds
                    }
                }
            });
            console.log(`Successfully deleted ${deleteResult.count} maintenance logs.`);

            // 2. Update the tasks to revert lastCompletedDate to March 3rd and nextDueDate to March 4th
            const revertLastCompleted = new Date('2026-03-03T00:00:00.000Z');
            const newNextDue = new Date('2026-03-04T00:00:00.000Z');

            const taskUpdateResult = await tx.task.updateMany({
                where: {
                    id: {
                        in: Array.from(taskIdsToUpdate) as number[]
                    }
                },
                data: {
                    lastCompletedDate: revertLastCompleted,
                    nextDueDate: newNextDue
                }
            });

            console.log(`Successfully reverted ${taskUpdateResult.count} tasks to Last Completed: March 3rd, Next Due: March 4th.`);
        });
        
        console.log('Operation completed successfully.');
    } catch (e) {
        console.error('Transaction failed. No changes were made.', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();