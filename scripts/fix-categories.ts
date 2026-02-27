import { prisma } from '../src/lib/prisma';

async function main() {
  const materialHandlingCategory = await prisma.equipmentCategory.findFirst({
    where: { name: 'Material Handling Equipment' }
  });

  if (!materialHandlingCategory) {
    console.error('Material Handling Equipment category not found!');
    return;
  }

  // Find the imported categories
  const categoriesToRemove = await prisma.equipmentCategory.findMany({
    where: {
      name: {
        in: ['Heavy Machinery', 'Power & Utility', 'Workshop Equipment', 'Miscellaneous']
      }
    }
  });

  for (const cat of categoriesToRemove) {
    console.log(`Moving equipment from '${cat.name}' to 'Material Handling Equipment'...`);
    
    const result = await prisma.equipment.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: materialHandlingCategory.id }
    });

    console.log(`Moved ${result.count} items.`);

    // Delete the category
    await prisma.equipmentCategory.delete({
      where: { id: cat.id }
    });
    console.log(`Deleted category: ${cat.name}`);
  }

  console.log('Cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
