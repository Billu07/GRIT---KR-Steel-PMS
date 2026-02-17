import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // 1. Create Default Categories
  const categories = [
    { name: 'Material Handling Equipment', description: 'Cranes, Forklifts, etc.' },
    { name: 'Measurement Equipment', description: 'Calipers, Micrometers, Gauges' },
    { name: 'Safety Equipment', description: 'Extinguishers, Harnesses, Kits' },
    { name: 'PPE and Personal Equipment', description: 'Helmets, Gloves, Boots' },
  ]

  for (const cat of categories) {
    const category = await prisma.equipmentCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    console.log(`Created category: ${category.name}`)
  }

  // 2. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      email: 'admin@krsteel.com',
    },
  })
  console.log(`Created admin user: ${admin.username} (Password: admin123)`)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
