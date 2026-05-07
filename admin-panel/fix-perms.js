const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('--- ALL PERMISSIONS ---')
  const permissions = await prisma.permission.findMany({
    orderBy: { name: 'asc' }
  })
  console.log(permissions.map(p => p.name).join(', '))

  console.log('\n--- FIXING PERMISSIONS ---')
  const needed = ['users.view', 'users.create', 'users.edit', 'users.delete']
  for (const name of needed) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: `Can ${name.split('.')[1]} users` }
    })
  }
  
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' }
  })
  
  if (superAdminRole) {
    const allPerms = await prisma.permission.findMany()
    await prisma.role.update({
      where: { id: superAdminRole.id },
      data: {
        permissions: {
          connect: allPerms.map(p => ({ id: p.id }))
        }
      }
    })
    console.log('Updated Super Admin with ALL permissions')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
