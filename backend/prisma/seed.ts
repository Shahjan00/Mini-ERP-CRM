import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followupNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create Users with hashed passwords
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const salesPasswordHash = await bcrypt.hash('Sales@123', 10);
  const warehousePasswordHash = await bcrypt.hash('Warehouse@123', 10);
  const accountsPasswordHash = await bcrypt.hash('Accounts@123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@erp.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sarah Sales Manager',
      email: 'sales@erp.com',
      password: salesPasswordHash,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Walter Warehouse Lead',
      email: 'warehouse@erp.com',
      password: warehousePasswordHash,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Arthur Accounts Officer',
      email: 'accounts@erp.com',
      password: accountsPasswordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Users created with hashed passwords');

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Kumar',
      mobile: '+91 98765 43210',
      email: 'rajesh@apexindustrial.com',
      businessName: 'Apex Industrial Solutions',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: 'Distributor',
      address: 'Plot 42, MIDC Industrial Area, Pune, Maharashtra',
      status: 'Active',
      followupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Key distributor in Western region. Negotiating bulk pricing Q3.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Sharma',
      mobile: '+91 91234 56789',
      email: 'priya@techmart.in',
      businessName: 'TechMart Retail Enterprises',
      gstNumber: '29BBBBA1111B2Z8',
      customerType: 'Retail',
      address: '102 Commercial Street, Bengaluru, Karnataka',
      status: 'Lead',
      followupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Interested in wireless barcode scanners and thermal printers.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Vikram Mehta',
      mobile: '+91 99887 76655',
      email: 'v.mehta@logisticsplus.com',
      businessName: 'Logistics Plus Wholesale',
      gstNumber: '07CCCCA2222C3Z1',
      customerType: 'Wholesale',
      address: '77 Transport Nagar, New Delhi',
      status: 'Active',
      followupDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Regular buyer of heavy-duty packing tapes & stretch wraps.',
    },
  });

  console.log('✅ Sample Customers created');

  // Create Followup Notes
  await prisma.followupNote.create({
    data: {
      customerId: customer1.id,
      note: 'Discussed annual contract renewal. Client requested 5% extra discount on order over 500 units.',
      followupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: salesUser.id,
    },
  });

  await prisma.followupNote.create({
    data: {
      customerId: customer2.id,
      note: 'Initial discovery call completed. Sent product catalog and sample pricing sheet.',
      followupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdById: salesUser.id,
    },
  });

  // Create Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Industrial Barcode Scanner 2D Wireless',
      sku: 'SKU-SCN-001',
      category: 'Electronics',
      unitPrice: 4500.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Rack A-04, Bay 2',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Heavy Duty Thermal Receipt Printer 80mm',
      sku: 'SKU-PRN-002',
      category: 'Electronics',
      unitPrice: 6200.0,
      currentStock: 4, // Trigger low stock alert!
      minStockAlert: 10,
      location: 'Rack A-05, Bay 1',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Stretch Wrap Packaging Film 500mm x 400m',
      sku: 'SKU-PKG-003',
      category: 'Packaging',
      unitPrice: 850.0,
      currentStock: 120,
      minStockAlert: 25,
      location: 'Warehouse B, Zone 1',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'SS 304 Hex Bolt M12 x 50mm (Pack of 100)',
      sku: 'SKU-FST-004',
      category: 'Fasteners',
      unitPrice: 1250.0,
      currentStock: 2, // Low stock alert!
      minStockAlert: 15,
      location: 'Bin F-12',
    },
  });

  console.log('✅ Sample Products created');

  // Stock Movement Logs for initial inventory setup
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Initial Inventory Inward Purchase Order PO-2026-001',
        createdById: warehouseUser.id,
      },
      {
        productId: prod2.id,
        quantityChanged: 10,
        movementType: 'IN',
        reason: 'Initial Opening Stock Entry',
        createdById: warehouseUser.id,
      },
      {
        productId: prod3.id,
        quantityChanged: 150,
        movementType: 'IN',
        reason: 'Bulk stock arrival from vendor',
        createdById: warehouseUser.id,
      },
      {
        productId: prod4.id,
        quantityChanged: 20,
        movementType: 'IN',
        reason: 'Initial stock intake',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Stock Movements logged');

  // Create Sample Confirmed Sales Challan with Stock Out Movement
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260813-0001',
      customerId: customer1.id,
      customerNameSnapshot: customer1.businessName,
      customerEmailSnapshot: customer1.email,
      customerMobileSnapshot: customer1.mobile,
      totalQuantity: 5,
      grandTotal: 22500.0,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod1.id,
            productNameSnapshot: prod1.name,
            skuSnapshot: prod1.sku,
            unitPriceSnapshot: prod1.unitPrice,
            quantity: 5,
            lineTotal: 22500.0,
          },
        ],
      },
    },
  });

  // Log stock OUT movement for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: prod1.id,
      quantityChanged: -5,
      movementType: 'OUT',
      reason: `Challan Dispatch: ${challan1.challanNumber}`,
      createdById: salesUser.id,
    },
  });

  // Create Sample Draft Sales Challan
  await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260813-0002',
      customerId: customer3.id,
      customerNameSnapshot: customer3.businessName,
      customerEmailSnapshot: customer3.email,
      customerMobileSnapshot: customer3.mobile,
      totalQuantity: 30,
      grandTotal: 25500.0,
      status: 'DRAFT',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod3.id,
            productNameSnapshot: prod3.name,
            skuSnapshot: prod3.sku,
            unitPriceSnapshot: prod3.unitPrice,
            quantity: 30,
            lineTotal: 25500.0,
          },
        ],
      },
    },
  });

  console.log('✅ Sample Sales Challans created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
