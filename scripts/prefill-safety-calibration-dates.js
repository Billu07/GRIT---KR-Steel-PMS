const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");
const path = require("path");

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();
const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env or environment variables.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PREFILLS = [
  { name: "Man Transferring Basket", testingDate: "2025-09-23", expiryDate: "2026-09-22" },
  { name: "Fireman's outfit", aliases: ["Firefighter's Outfit"], testingDate: "2025-05-24", expiryDate: "2026-05-23" },
  { name: "Breathing Apparatus (SCBA) Cylinders", aliases: ["Self-Contained Breathing Apparatus (SCBA)"], testingDate: "2025-09-02", expiryDate: "2026-09-01" },
  { name: "Full Body Harness", aliases: ["Safety Harness"], testingDate: "2026-02-24", expiryDate: "2027-02-23" },
  { name: "Medical Oxygen Cylinders", aliases: ["Medical oxygen cylinders"], testingDate: "2025-09-02", expiryDate: "2026-09-01" },
  { name: "Fire Extinguisher", aliases: ["Fire Extinguishers"], testingDate: "2026-01-05", expiryDate: "2027-01-04" },
  { name: "Medical Oxygen Cylinders for Ambulance", aliases: ["Medical oxygen cylinder for ambulance"], testingDate: "2025-09-03", expiryDate: "2026-09-02" },
  { name: "Asbestos Decontamination Unit (ADU)", aliases: ["Asbestos Decontamination Unit"], testingDate: "2025-02-05" },
  { name: "Fall Arrestor", testingDate: "2026-02-23", expiryDate: "2027-02-22" },
];

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/['`]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function findBestMatch(inputName, aliases) {
  const normalizedInput = normalizeName(inputName);
  const allEquipment = await prisma.equipment.findMany({
    select: { id: true, name: true, code: true },
  });

  if (aliases && aliases.length > 0) {
    const normalizedAliases = aliases.map(normalizeName);
    const aliasMatch = allEquipment.find((eq) =>
      normalizedAliases.includes(normalizeName(eq.name))
    );
    if (aliasMatch) return aliasMatch;
  }

  const direct = allEquipment.find((eq) => normalizeName(eq.name) === normalizedInput);
  if (direct) return direct;

  const partial = allEquipment.find((eq) => {
    const n = normalizeName(eq.name);
    return n.includes(normalizedInput) || normalizedInput.includes(n);
  });

  return partial || null;
}

async function main() {
  let updated = 0;
  let notFound = 0;

  for (const item of PREFILLS) {
    const match = await findBestMatch(item.name, item.aliases || []);

    if (!match) {
      notFound++;
      console.log(`[NOT FOUND] ${item.name}`);
      continue;
    }

    await prisma.equipment.update({
      where: { id: match.id },
      data: {
        calibrationTestingDate: item.testingDate ? new Date(item.testingDate) : null,
        calibrationExpiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      },
    });

    updated++;
    console.log(
      `[UPDATED] ${item.name} -> ${match.name} (${match.code}) | Testing: ${item.testingDate || "-"} | Expiry: ${item.expiryDate || "(unchanged)"}`
    );
  }

  console.log(`Done. Updated: ${updated}, Not found: ${notFound}`);

  // Safety correction: if "Ambulance" was accidentally matched in a prior run,
  // clear its calibration dates because this prefill belongs to oxygen cylinders.
  const ambulance = await prisma.equipment.findFirst({
    where: { name: "Ambulance" },
    select: { id: true, calibrationTestingDate: true, calibrationExpiryDate: true },
  });
  if (ambulance && (ambulance.calibrationTestingDate || ambulance.calibrationExpiryDate)) {
    await prisma.equipment.update({
      where: { id: ambulance.id },
      data: { calibrationTestingDate: null, calibrationExpiryDate: null },
    });
    console.log("[CORRECTED] Cleared calibration dates from Ambulance");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
