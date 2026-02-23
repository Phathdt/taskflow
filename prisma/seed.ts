import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { Pool } from 'pg'

import { PrismaClient } from '../libs'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE__URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  // Dynamic import bcryptjs
  const bcrypt = await import('bcryptjs')

  const adminEmail = 'admin@taskflow.local'

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existing) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      },
    })
    console.log('Admin user created')
  } else {
    console.log('Admin user already exists, skipping')
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
