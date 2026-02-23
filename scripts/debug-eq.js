const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const eq = await prisma.equipment.findMany();
  console.log('Current Equipment:', eq.map(e => ({ id: e.id, code: e.code, name: e.name })));
  process.exit(0);
}

check();