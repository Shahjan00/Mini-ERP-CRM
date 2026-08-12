const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create test users for each role
  const users = [
    {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
    {
      email: 'sales@test.com',
      password: hashedPassword,
      name: 'Sales User',
      role: 'SALES',
    },
    {
      email: 'warehouse@test.com',
      password: hashedPassword,
      name: 'Warehouse User',
      role: 'WAREHOUSE',
    },
    {
      email: 'accounts@test.com',
      password: hashedPassword,
      name: 'Accounts User',
      role: 'ACCOUNTS',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Created/updated user: ${user.email} (${user.role})`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
