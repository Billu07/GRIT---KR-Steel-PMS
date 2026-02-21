const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const e = await prisma.equipment.create({
      data: {
        code: 'EQ-TEST',
        name: 'Test Equipment',
        categoryId: 1, // Ensure category 1 exists or this will fail!
        location: '',
        description: '',
        status: 'active',
        imageUrl: '',
        safetyMeasures: ''
      }
    });
    console.log("Success:", e);
    // clean up
    await prisma.equipment.delete({ where: { id: e.id } });
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();