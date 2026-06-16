require('dotenv').config();

const {
  PrismaClient,
  Role,
  AssetStatus,
  LifecycleStage,
  WorkOrderStatus,
  WorkOrderPriority,
  VendorType,
} = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Ivjar Manufacturing EAM Database Seeding...');

  // Wipe existing database to ensure clean seed
  console.log('Wiping existing database tables...');
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.failureEvent.deleteMany({});
  await prisma.riskAssessment.deleteMany({});
  await prisma.workOrderPart.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.assetDocument.deleteMany({});
  await prisma.assetCriticality.deleteMany({});
  await prisma.maintenanceProgram.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.reliabilityMetric.deleteMany({});
  await prisma.inventoryPart.deleteMany({});
  await prisma.partCategory.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.strategicTarget.deleteMany({});
  await prisma.technician.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.organization.deleteMany({});
  console.log('Database wiped successfully!');

  // 1. ORGANIZATION
  console.log('Creating Organization...');
  const org = await prisma.organization.create({
    data: { name: 'Ivjar Global Manufacturing' },
  });

  // 2. SITES
  console.log('Creating Sites...');
  await prisma.site.createMany({
    data: [
      { name: 'Ivjar Main Assembly Plant', location: 'Detroit, MI', organizationId: org.id },
      { name: 'Ivjar Packaging & Distribution', location: 'Columbus, OH', organizationId: org.id },
    ],
  });

  const plantA = await prisma.site.findFirst({ where: { name: 'Ivjar Main Assembly Plant' } });
  const plantB = await prisma.site.findFirst({ where: { name: 'Ivjar Packaging & Distribution' } });

  // 3. USERS (Every possible role is represented)
  console.log('Creating Users...');
  await prisma.user.createMany({
    data: [
      { email: 'admin@ivjar.com', name: 'Rajvi Admin', role: Role.ADMIN, organizationId: org.id, siteId: plantA.id },
      { email: 'manager@ivjar.com', name: 'Michael Operations', role: Role.MANAGER, organizationId: org.id, siteId: plantA.id },
      { email: 'tech1@ivjar.com', name: 'Caterina Technician', role: Role.TECHNICIAN, organizationId: org.id, siteId: plantA.id },
      { email: 'tech2@ivjar.com', name: 'Linom Technician', role: Role.TECHNICIAN, organizationId: org.id, siteId: plantA.id },
      { email: 'viewer@ivjar.com', name: 'Valerie Viewer', role: Role.VIEWER, organizationId: org.id, siteId: plantA.id },
    ],
  });

  const techCaterinaUser = await prisma.user.findUnique({ where: { email: 'tech1@ivjar.com' } });
  const techLinomUser = await prisma.user.findUnique({ where: { email: 'tech2@ivjar.com' } });
  const adminRajvi = await prisma.user.findUnique({ where: { email: 'admin@ivjar.com' } });

  console.log('Creating Technicians...');
  await prisma.technician.createMany({
    data: [
      { technicianCode: 'TECH-001', name: 'Caterina Technician', email: 'tech1@ivjar.com', role: 'Mechanical', status: 'ACTIVE' },
      { technicianCode: 'TECH-002', name: 'Linom Technician', email: 'tech2@ivjar.com', role: 'Electrical', status: 'ACTIVE' },
    ]
  });

  const techCaterina = await prisma.technician.findUnique({ where: { technicianCode: 'TECH-001' } });
  const techLinom = await prisma.technician.findUnique({ where: { technicianCode: 'TECH-002' } });

  // 4. ASSET CATEGORIES
  console.log('Creating Asset Categories...');
  await prisma.assetCategory.createMany({
    data: [
      { name: 'Robotics', description: 'Automated assembly and welding robots' },
      { name: 'Conveyor', description: 'Material handling systems' },
      { name: 'HVAC', description: 'Facility climate control' },
      { name: 'Power Gen', description: 'Backup power systems' },
    ],
  });

  const catRobotics = await prisma.assetCategory.findUnique({ where: { name: 'Robotics' } });
  const catConveyor = await prisma.assetCategory.findUnique({ where: { name: 'Conveyor' } });
  const catHvac = await prisma.assetCategory.findUnique({ where: { name: 'HVAC' } });
  const catPower = await prisma.assetCategory.findUnique({ where: { name: 'Power Gen' } });

  // 4.5 PART CATEGORIES
  console.log('Creating Part Categories...');
  await prisma.partCategory.createMany({
    data: [
      { name: 'Servos', description: 'Servo motors and related drives' },
      { name: 'Hydraulics', description: 'Hydraulic fluids, valves, pumps' },
      { name: 'Conveyors', description: 'Conveyor belts, links, guides' },
      { name: 'Lithiums', description: 'Lithium battery packs and chargers' },
      { name: 'Airs', description: 'Air filters and pneumatic parts' },
    ]
  });

  const catServos = await prisma.partCategory.findUnique({ where: { name: 'Servos' } });
  const catHydraulics = await prisma.partCategory.findUnique({ where: { name: 'Hydraulics' } });
  const catConveyors = await prisma.partCategory.findUnique({ where: { name: 'Conveyors' } });
  const catLithiums = await prisma.partCategory.findUnique({ where: { name: 'Lithiums' } });
  const catAirs = await prisma.partCategory.findUnique({ where: { name: 'Airs' } });

  // 5. VENDORS
  console.log('Creating Vendors...');
  await prisma.vendor.createMany({
    data: [
      { name: 'KUKA Robotics', type: VendorType.ASSET_VENDOR },
      { name: 'Siemens Systems', type: VendorType.SERVICE_PROVIDER },
      { name: 'Industrial Parts Co', type: VendorType.PARTS_VENDOR },
    ]
  });

  const vendorKuka = await prisma.vendor.findFirst({ where: { name: 'KUKA Robotics' } });
  const vendorParts = await prisma.vendor.findFirst({ where: { name: 'Industrial Parts Co' } });

  // 6. ASSETS (Exactly one asset per category to avoid duplicates)
  console.log('Creating Assets...');
  const conveyorLine = await prisma.asset.create({
    data: { code: 'CONV-ALPHA', name: 'Production Line Alpha', categoryId: catConveyor.id, siteId: plantA.id, status: 'OPERATIONAL', criticality: { create: { safetyImpact: 3, environmentalImpact: 1, productionImpact: 5, financialImpact: 5, overallScore: 5, classification: 'CRITICAL' } } }
  });

  const robotA = await prisma.asset.create({
    data: { code: 'ROB-KUKA-A', name: 'KUKA Welding Robot A', categoryId: catRobotics.id, siteId: plantA.id, parentId: conveyorLine.id, vendorId: vendorKuka.id, imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070', status: 'DEGRADED', criticality: { create: { safetyImpact: 4, environmentalImpact: 1, productionImpact: 5, financialImpact: 4, overallScore: 4, classification: 'HIGH' } } }
  });

  const chiller = await prisma.asset.create({
    data: { code: 'CHILL-100', name: 'Chiller Unit 1', categoryId: catHvac.id, siteId: plantA.id, status: 'UNDER_MAINTENANCE', criticality: { create: { safetyImpact: 2, environmentalImpact: 3, productionImpact: 3, financialImpact: 3, overallScore: 3, classification: 'MEDIUM' } } }
  });

  const generator = await prisma.asset.create({
    data: { code: 'GEN-500KVA', name: 'Backup Generator 500kVA', categoryId: catPower.id, siteId: plantA.id, status: 'OPERATIONAL', criticality: { create: { safetyImpact: 5, environmentalImpact: 4, productionImpact: 5, financialImpact: 5, overallScore: 5, classification: 'CRITICAL' } } }
  });

  // 7. INVENTORY PARTS (Exactly one part per category)
  console.log('Creating Inventory...');
  await prisma.inventoryPart.createMany({
    data: [
      { code: 'PRT-SM-04', name: 'Servo Motor MK4', categoryId: catServos.id, quantityOnHand: 2, minStockLevel: 5, reorderLevel: 10, cost: 4500.0, siteId: plantA.id, vendorId: vendorParts.id }, // LOW STOCK
      { code: 'PRT-HF-50', name: 'Hydraulic Fluid 50L', categoryId: catHydraulics.id, quantityOnHand: 15, minStockLevel: 10, reorderLevel: 20, cost: 250.0, siteId: plantA.id },
      { code: 'PRT-CB-11', name: 'Conveyor Belt Link', categoryId: catConveyors.id, quantityOnHand: 150, minStockLevel: 50, reorderLevel: 100, cost: 45.0, siteId: plantA.id },
      { code: 'PRT-AF-PRO', name: 'Air Filter Pro', categoryId: catAirs.id, quantityOnHand: 8, minStockLevel: 10, reorderLevel: 20, cost: 120.0, siteId: plantA.id }, // LOW STOCK
      { code: 'PRT-BAT-LI', name: 'Lithium Battery Pack', categoryId: catLithiums.id, quantityOnHand: 5, minStockLevel: 5, reorderLevel: 10, cost: 800.0, siteId: plantA.id },
    ]
  });

  const partServo = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-SM-04' } });
  const partFluid = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-HF-50' } });
  const partLink = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-CB-11' } });
  const partFilter = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-AF-PRO' } });

  // 8. MAINTENANCE PROGRAMS
  console.log('Creating Programs...');
  await prisma.maintenanceProgram.create({
    data: { title: 'Weekly Robot Calibration', frequencyDays: 7, scheduleType: 'WEEKLY', assetId: robotA.id }
  });
  await prisma.maintenanceProgram.create({
    data: { title: 'Monthly Chiller Inspection', frequencyDays: 30, scheduleType: 'MONTHLY', assetId: chiller.id }
  });

  // 9. WORK ORDERS & PART REQUESTS
  console.log('Creating Work Orders...');

  // Completed WO with consumed parts
  const wo1 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-1001',
      title: 'Replace worn conveyor links',
      description: 'Found several degraded links during visual inspection.',
      status: WorkOrderStatus.COMPLETED,
      priority: WorkOrderPriority.MEDIUM,
      assetId: conveyorLine.id,
      assignedToId: techLinom.id,
      siteId: plantA.id,
      actualHours: 2.5,
      actualStartDate: new Date(Date.now() - 2 * 86400000),
      actualEndDate: new Date(Date.now() - 1.5 * 86400000),
    }
  });
  await prisma.workOrderPart.create({
    data: { workOrderId: wo1.id, inventoryPartId: partLink.id, requestedQty: 5, issuedQty: 5, quantityConsumed: 5, requestStatus: 'CONSUMED', requestedById: techLinomUser.id }
  });
  await prisma.assetHistory.create({
    data: { assetId: conveyorLine.id, action: 'MAINTENANCE_COMPLETED', description: `Replaced 5 conveyor links.`, performedById: techLinomUser.id }
  });

  // Waiting Parts WO 1 (Robot)
  const wo2 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-1002',
      title: 'Robot A Arm Actuator Failure',
      description: 'Actuator is jamming. Needs new servo motor.',
      status: WorkOrderStatus.WAITING_PARTS,
      priority: WorkOrderPriority.CRITICAL,
      assetId: robotA.id,
      assignedToId: techCaterina.id,
      siteId: plantA.id,
      actualStartDate: new Date(),
    }
  });
  await prisma.workOrderPart.create({
    data: { workOrderId: wo2.id, inventoryPartId: partServo.id, requestedQty: 1, requestStatus: 'REQUESTED', requestedById: techCaterinaUser.id }
  });

  // Waiting Parts WO 2 (Chiller)
  const wo3 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-1003',
      title: 'Chiller Unit 1 Overheating',
      description: 'Filters are completely blocked. Need replacements before restart.',
      status: WorkOrderStatus.WAITING_PARTS,
      priority: WorkOrderPriority.HIGH,
      assetId: chiller.id,
      assignedToId: techLinom.id,
      siteId: plantA.id,
      actualStartDate: new Date(),
    }
  });
  await prisma.workOrderPart.create({
    data: { workOrderId: wo3.id, inventoryPartId: partFilter.id, requestedQty: 2, requestStatus: 'REQUESTED', requestedById: techLinomUser.id }
  });

  // In Progress WO (Robot A Arm Fluid change)
  const wo4 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-1004',
      title: 'Routine Hydraulic Fluid change',
      description: 'Flushing and replacing fluid.',
      status: WorkOrderStatus.IN_PROGRESS,
      priority: WorkOrderPriority.MEDIUM,
      assetId: robotA.id,
      assignedToId: techCaterina.id,
      siteId: plantA.id,
      actualStartDate: new Date(),
    }
  });
  await prisma.workOrderPart.create({
    data: { workOrderId: wo4.id, inventoryPartId: partFluid.id, requestedQty: 1, issuedQty: 1, requestStatus: 'ISSUED', requestedById: techCaterinaUser.id, issuedById: adminRajvi.id }
  });

  // Draft WO
  await prisma.workOrder.create({
    data: {
      woNumber: 'WO-1005',
      title: 'Generator Test Run',
      description: 'Monthly load bank test.',
      status: WorkOrderStatus.DRAFT,
      priority: WorkOrderPriority.LOW,
      assetId: generator.id,
      siteId: plantA.id,
    }
  });

  // 9.5 FAILURE EVENTS
  console.log('Creating Failure Events...');
  await prisma.failureEvent.create({
    data: {
      assetId: robotA.id,
      workOrderId: wo2.id,
      description: 'Actuator jamming on axis 3',
      occurredAt: new Date(Date.now() - 3 * 86400000),
      resolvedAt: new Date(Date.now() - 2.8 * 86400000),
      downtimeHours: 4.8
    }
  });

  await prisma.failureEvent.create({
    data: {
      assetId: chiller.id,
      workOrderId: wo3.id,
      description: 'Chiller compressor overheating alarm',
      occurredAt: new Date(Date.now() - 1 * 86400000),
      resolvedAt: new Date(Date.now() - 0.7 * 86400000),
      downtimeHours: 7.2
    }
  });

  // 10. RISK & RELIABILITY
  console.log('Creating Risk & Reliability Data...');
  await prisma.riskAssessment.create({
    data: { assetId: robotA.id, probability: 4, impact: 4, riskScore: 16, mitigationPlan: 'Increase calibration frequency and keep servo spares on hand.', assessedById: adminRajvi.id }
  });
  await prisma.riskAssessment.create({
    data: { assetId: generator.id, probability: 2, impact: 5, riskScore: 10, mitigationPlan: 'Ensure fuel polishing is done bi-annually.', assessedById: adminRajvi.id }
  });

  await prisma.reliabilityMetric.createMany({
    data: [
      { assetId: robotA.id, mtbf: 1200.0, mttr: 4.5, availability: 96.5, downtime: 36.0 },
      { assetId: conveyorLine.id, mtbf: 4000.0, mttr: 2.1, availability: 99.1, downtime: 12.0 },
      { assetId: chiller.id, mtbf: 2500.0, mttr: 8.0, availability: 94.5, downtime: 80.0 },
    ]
  });

  console.log('✅ Ivjar Manufacturing Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
