import { PrismaClient, Frequency } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

// Helper to load .env file
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf-8');
      envConfig.split('\n').forEach((line) => {
        const [key, ...value] = line.split('=');
        if (key && value) {
          const val = value.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.replace(/^["']|["']$/g, ''); // Remove quotes
          }
        }
      });
      console.log('.env loaded');
    } else {
        console.log('.env not found at', envPath);
    }
  } catch (e) {
    console.error('Error loading .env', e);
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting fix-weekly-parts script...');

  const weeklyTasks = await prisma.task.findMany({
    where: {
      frequency: Frequency.weekly,
    },
    select: {
      id: true,
    },
  });

  const weeklyTaskIds = weeklyTasks.map((t) => t.id);

  console.log(`Found ${weeklyTaskIds.length} weekly tasks.`);

  if (weeklyTaskIds.length === 0) {
    console.log('No weekly tasks found. Exiting.');
    return;
  }

  const debugLogs = await prisma.maintenanceHistory.findMany({
    where: {
      taskId: {
        in: weeklyTaskIds,
      },
    },
    take: 10,
    select: {
      id: true,
      usedParts: true,
    },
  });
  console.log('Sample usedParts values for weekly tasks:', debugLogs);

  // Find problematic logs
  // Looking for "â€”" (mojibake) or "—" (em dash) or "-" (hyphen) or just empty/null if that's the case.
  // The user specified: "â€”"
  const problematicLogs = await prisma.maintenanceHistory.findMany({
    where: {
      taskId: {
        in: weeklyTaskIds,
      },
      OR: [
        { usedParts: { contains: 'â€”' } },
        { usedParts: { equals: 'â€”' } },
        { usedParts: { equals: '—' } },
      ],
    },
  });

  console.log(`Found ${problematicLogs.length} logs to update.`);

  if (problematicLogs.length === 0) {
    console.log('No problematic logs found. Exiting.');
    return;
  }

  const updateResult = await prisma.maintenanceHistory.updateMany({
    where: {
      id: {
        in: problematicLogs.map((log) => log.id),
      },
    },
    data: {
      usedParts: 'No parts used',
    },
  });

  console.log(`Updated ${updateResult.count} logs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
