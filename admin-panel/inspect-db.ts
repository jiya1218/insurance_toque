import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- ROLES ---')
  const roles = await prisma.role.findMany({
    include: { permissions: true }
  })
  roles.forEach(r => {
    console.log(`Role: ${r.name} (${r.id})`)
    console.log(`Permissions: ${r.permissions.map(p => p.name).join(', ')}`)
    console.log('---')
  })

  console.log('\n--- TARGET USER ---')
  const user = await prisma.user.findUnique({
    where: { email: 'jiya.scalezix@gmail.com' },
    include: { role: true }
  })
  if (user) {
    console.log(`User: ${user.fullName} (${user.id})`)
    console.log(`Current Role: ${user.role?.name || 'NONE'}`)
  } else {
    console.log('User not found: jiya.scalezix@gmail.com')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
