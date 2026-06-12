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
  console.log('🌱 Starting EAM Database Seeding...');

  // ---------------------------------------------------------
  // 1. ORGANIZATION
  // ---------------------------------------------------------
  console.log('Creating Organization...');
  const org = await prisma.organization.create({
    data: { name: 'Johannesburg Manufacturing LTD' },
  });

  // ---------------------------------------------------------
  // 2. SITES
  // ---------------------------------------------------------
  console.log('Creating Sites...');
  await prisma.site.createMany({
    data: [
      { name: 'Johannesburg Plant A', location: 'Johannesburg, ZA', organizationId: org.id },
      { name: 'Johannesburg Plant B', location: 'Johannesburg, ZA', organizationId: org.id },
      { name: 'Pretoria Distribution Center', location: 'Pretoria, ZA', organizationId: org.id },
    ],
  });

  const plantA = await prisma.site.findFirst({ where: { name: 'Johannesburg Plant A' } });
  const plantB = await prisma.site.findFirst({ where: { name: 'Johannesburg Plant B' } });
  const dcPretoria = await prisma.site.findFirst({ where: { name: 'Pretoria Distribution Center' } });

  // ---------------------------------------------------------
  // 3. USERS
  // ---------------------------------------------------------
  console.log('Creating Users...');
  await prisma.user.createMany({
    data: [
      { email: 'rajvi.admin@example.com', name: 'Rajvi Admin', role: Role.ADMIN, organizationId: org.id, siteId: plantA.id },
      { email: 'michael.ops@example.com', name: 'Michael Operations Manager', role: Role.MANAGER, organizationId: org.id, siteId: plantA.id },
      { email: 'ariana.maint@example.com', name: 'Ariana Maintenance Manager', role: Role.MANAGER, organizationId: org.id, siteId: plantA.id },
      { email: 'caterina.tech@example.com', name: 'Caterina Technician', role: Role.TECHNICIAN, organizationId: org.id, siteId: plantA.id },
      { email: 'linom.tech@example.com', name: 'Linom Technician', role: Role.TECHNICIAN, organizationId: org.id, siteId: plantB.id },
      { email: 'glinda.viewer@example.com', name: 'Glinda Viewer', role: Role.VIEWER, organizationId: org.id, siteId: dcPretoria.id },
    ],
  });

  const techCaterina = await prisma.user.findUnique({ where: { email: 'caterina.tech@example.com' } });
  const techLinom = await prisma.user.findUnique({ where: { email: 'linom.tech@example.com' } });
  const adminRajvi = await prisma.user.findUnique({ where: { email: 'rajvi.admin@example.com' } });

  // ---------------------------------------------------------
  // 4. ASSET CATEGORIES
  // ---------------------------------------------------------
  console.log('Creating Asset Categories...');
  await prisma.assetCategory.createMany({
    data: [
      { name: 'HVAC', description: 'Heating, Ventilation, and Air Conditioning Systems' },
      { name: 'Generator', description: 'Power Generation Units' },
      { name: 'Electrical', description: 'Electrical Distribution and Control' },
      { name: 'Mechanical', description: 'Mechanical Systems and Compressors' },
      { name: 'Utility', description: 'Water, Gas, and Utility Pumps' },
    ],
  });

  const hvacCat = await prisma.assetCategory.findUnique({ where: { name: 'HVAC' } });
  const genCat = await prisma.assetCategory.findUnique({ where: { name: 'Generator' } });
  const elecCat = await prisma.assetCategory.findUnique({ where: { name: 'Electrical' } });
  const mechCat = await prisma.assetCategory.findUnique({ where: { name: 'Mechanical' } });
  const utilCat = await prisma.assetCategory.findUnique({ where: { name: 'Utility' } });

  // ---------------------------------------------------------
  // 5. VENDORS
  // ---------------------------------------------------------
  console.log('Creating Vendors...');
  const vendorsToCreate = [
    { name: 'Siemens', type: VendorType.ASSET_VENDOR },
    { name: 'ABB', type: VendorType.SERVICE_PROVIDER },
    { name: 'Schneider Electric', type: VendorType.PARTS_VENDOR },
    { name: 'Carrier HVAC Services', type: VendorType.SERVICE_PROVIDER },
  ];

  for (const v of vendorsToCreate) {
    await prisma.vendor.create({ data: v });
  }

  const siemens = await prisma.vendor.findFirst({ where: { name: 'Siemens' } });
  const schneider = await prisma.vendor.findFirst({ where: { name: 'Schneider Electric' } });
  const carrier = await prisma.vendor.findFirst({ where: { name: 'Carrier HVAC Services' } });

  // ---------------------------------------------------------
  // 6. ASSETS & HIERARCHY
  // ---------------------------------------------------------
  console.log('Creating Assets & Hierarchy...');

  // Johannesburg Plant A Assets
  const hvacA = await prisma.asset.create({
    data: { code: 'HVAC-A-01', name: 'HVAC System A', categoryId: hvacCat.id, siteId: plantA.id, vendorId: carrier.id, criticalityScore: 4 }
  });

  const comp101 = await prisma.asset.create({
    data: { code: 'COMP-101', name: 'Compressor #101', categoryId: mechCat.id, siteId: plantA.id, parentId: hvacA.id, criticalityScore: 3 }
  });

  const filter102 = await prisma.asset.create({
    data: { code: 'FLTR-102', name: 'Air Filter #102', categoryId: mechCat.id, siteId: plantA.id, parentId: hvacA.id, criticalityScore: 1 }
  });

  const gen303 = await prisma.asset.create({
    data: { code: 'GEN-303', name: 'Generator #303', categoryId: genCat.id, siteId: plantA.id, vendorId: siemens.id, criticalityScore: 5 }
  });

  const elecPanel501 = await prisma.asset.create({
    data: { code: 'ELEC-501', name: 'Electrical Panel #501', categoryId: elecCat.id, siteId: plantA.id, vendorId: schneider.id, criticalityScore: 5 }
  });

  // Johannesburg Plant B Assets
  const hvacB = await prisma.asset.create({
    data: { code: 'HVAC-B-01', name: 'HVAC System B', categoryId: hvacCat.id, siteId: plantB.id, vendorId: carrier.id, criticalityScore: 4 }
  });

  const comp201 = await prisma.asset.create({
    data: { code: 'COMP-201', name: 'Compressor #201', categoryId: mechCat.id, siteId: plantB.id, parentId: hvacB.id, criticalityScore: 3 }
  });

  const gen403 = await prisma.asset.create({
    data: { code: 'GEN-403', name: 'Generator #403', categoryId: genCat.id, siteId: plantB.id, vendorId: siemens.id, criticalityScore: 5 }
  });

  // Pretoria DC Assets
  const pump601 = await prisma.asset.create({
    data: { code: 'PUMP-601', name: 'Water Pump #601', categoryId: utilCat.id, siteId: dcPretoria.id, vendorId: siemens.id, criticalityScore: 4 }
  });

  const gen701 = await prisma.asset.create({
    data: { code: 'GEN-701', name: 'Backup Generator #701', categoryId: genCat.id, siteId: dcPretoria.id, vendorId: siemens.id, criticalityScore: 5 }
  });

  // ---------------------------------------------------------
  // 7. MAINTENANCE PROGRAMS
  // ---------------------------------------------------------
  console.log('Creating Maintenance Programs...');
  const progHvac = await prisma.maintenanceProgram.create({
    data: { title: 'Monthly HVAC Inspection', frequencyDays: 30, assetId: hvacA.id }
  });

  const progGen = await prisma.maintenanceProgram.create({
    data: { title: 'Quarterly Generator Service', frequencyDays: 90, assetId: gen303.id }
  });

  const progElec = await prisma.maintenanceProgram.create({
    data: { title: 'Annual Electrical Audit', frequencyDays: 365, assetId: elecPanel501.id }
  });

  const progPump = await prisma.maintenanceProgram.create({
    data: { title: 'Monthly Pump Inspection', frequencyDays: 30, assetId: pump601.id }
  });

  // ---------------------------------------------------------
  // 8. INVENTORY PARTS
  // ---------------------------------------------------------
  console.log('Creating Inventory Parts...');
  const partsData = [
    { code: 'PRT-AF01', name: 'Air Filter', quantityOnHand: 50, minStockLevel: 10, reorderLevel: 20, cost: 45.0, siteId: plantA.id, vendorId: schneider.id },
    { code: 'PRT-BK01', name: 'Bearing Kit', quantityOnHand: 15, minStockLevel: 5, reorderLevel: 10, cost: 120.0, siteId: plantA.id, vendorId: siemens.id },
    { code: 'PRT-LO01', name: 'Lubricant Oil', quantityOnHand: 100, minStockLevel: 20, reorderLevel: 40, cost: 15.5, siteId: plantA.id },
    { code: 'PRT-GB01', name: 'Generator Battery', quantityOnHand: 8, minStockLevel: 2, reorderLevel: 5, cost: 250.0, siteId: plantA.id, vendorId: siemens.id },
    { code: 'PRT-CF01', name: 'Cooling Fan', quantityOnHand: 12, minStockLevel: 4, reorderLevel: 8, cost: 85.0, siteId: plantB.id },
    { code: 'PRT-MB01', name: 'Motor Belt', quantityOnHand: 30, minStockLevel: 10, reorderLevel: 15, cost: 35.0, siteId: plantB.id },
    { code: 'PRT-EF01', name: 'Electrical Fuse', quantityOnHand: 200, minStockLevel: 50, reorderLevel: 100, cost: 5.0, siteId: plantA.id, vendorId: schneider.id },
    { code: 'PRT-PS01', name: 'Pump Seal', quantityOnHand: 25, minStockLevel: 5, reorderLevel: 10, cost: 55.0, siteId: dcPretoria.id },
  ];

  await prisma.inventoryPart.createMany({ data: partsData });

  const pAirFilter = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-AF01' } });
  const pLubeOil = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-LO01' } });
  const pGenBattery = await prisma.inventoryPart.findUnique({ where: { code: 'PRT-GB01' } });

  // ---------------------------------------------------------
  // 9. WORK ORDERS & WORK ORDER PARTS
  // ---------------------------------------------------------
  console.log('Creating Work Orders and Consuming Parts...');

  // 8 Completed Work Orders
  for (let i = 1; i <= 8; i++) {
    const wo = await prisma.workOrder.create({
      data: {
        title: `Completed Work Order ${i}`,
        description: 'Routine maintenance completed successfully.',
        status: WorkOrderStatus.COMPLETED,
        priority: WorkOrderPriority.MEDIUM,
        assetId: i % 2 === 0 ? gen303.id : hvacA.id,
        maintenanceProgramId: i % 2 === 0 ? progGen.id : progHvac.id,
        assignedToId: i % 2 === 0 ? techCaterina.id : techLinom.id,
        siteId: plantA.id,
        actualStartDate: new Date(Date.now() - i * 86400000), // i days ago
        actualEndDate: new Date(Date.now() - (i - 0.5) * 86400000),
      }
    });

    // Parts consumption
    if (wo.assetId === gen303.id) {
      await prisma.workOrderPart.create({ data: { workOrderId: wo.id, inventoryPartId: pLubeOil.id, quantityConsumed: 2 } });
      if (i === 2) {
        await prisma.workOrderPart.create({ data: { workOrderId: wo.id, inventoryPartId: pGenBattery.id, quantityConsumed: 1 } });
      }
    } else if (wo.assetId === hvacA.id) {
      await prisma.workOrderPart.create({ data: { workOrderId: wo.id, inventoryPartId: pAirFilter.id, quantityConsumed: 1 } });
    }
  }

  // 4 In Progress
  for (let i = 1; i <= 4; i++) {
    await prisma.workOrder.create({
      data: {
        title: `In Progress Work Order ${i}`,
        status: WorkOrderStatus.IN_PROGRESS,
        priority: WorkOrderPriority.HIGH,
        assetId: elecPanel501.id,
        assignedToId: techCaterina.id,
        siteId: plantA.id,
        actualStartDate: new Date(),
      }
    });
  }

  // 3 Assigned
  for (let i = 1; i <= 3; i++) {
    await prisma.workOrder.create({
      data: {
        title: `Assigned Work Order ${i}`,
        status: WorkOrderStatus.ASSIGNED,
        priority: WorkOrderPriority.LOW,
        assetId: pump601.id,
        maintenanceProgramId: progPump.id,
        assignedToId: techLinom.id,
        siteId: dcPretoria.id,
      }
    });
  }

  // 2 Draft
  for (let i = 1; i <= 2; i++) {
    await prisma.workOrder.create({
      data: {
        title: `Draft Work Order ${i}`,
        status: WorkOrderStatus.DRAFT,
        priority: WorkOrderPriority.MEDIUM,
        assetId: gen403.id,
        siteId: plantB.id,
      }
    });
  }

  // ---------------------------------------------------------
  // 10. RISK ASSESSMENTS
  // ---------------------------------------------------------
  console.log('Creating Risk Assessments...');
  const riskData = [
    { assetId: gen303.id, probability: 4, impact: 5, riskScore: 20, mitigationPlan: 'Install redundant backup and schedule quarterly checks', assessedById: adminRajvi.id },
    { assetId: elecPanel501.id, probability: 3, impact: 5, riskScore: 15, mitigationPlan: 'Add thermal monitoring sensors', assessedById: adminRajvi.id },
    { assetId: pump601.id, probability: 2, impact: 3, riskScore: 6, mitigationPlan: 'Regular seal replacement', assessedById: techLinom.id },
  ];

  for (const risk of riskData) {
    await prisma.riskAssessment.create({ data: risk });
  }

  // ---------------------------------------------------------
  // 11. RELIABILITY METRICS
  // ---------------------------------------------------------
  console.log('Creating Reliability Metrics...');
  await prisma.reliabilityMetric.createMany({
    data: [
      { assetId: gen303.id, mtbf: 4000.5, mttr: 4.2, availability: 99.8, downtime: 12.5 },
      { assetId: hvacA.id, mtbf: 2500.0, mttr: 8.0, availability: 98.5, downtime: 45.0 },
      { assetId: elecPanel501.id, mtbf: 8760.0, mttr: 2.0, availability: 99.9, downtime: 2.0 },
      { assetId: pump601.id, mtbf: 1500.0, mttr: 6.5, availability: 95.0, downtime: 120.0 },
    ]
  });

  // ---------------------------------------------------------
  // 12. ASSET HISTORY
  // ---------------------------------------------------------
  console.log('Creating Asset History...');
  const assetsForHistory = [hvacA, gen303, elecPanel501, gen403];
  for (const asset of assetsForHistory) {
    // 1. Created
    await prisma.assetHistory.create({
      data: { assetId: asset.id, action: 'ASSET_CREATED', description: `Initial system creation for ${asset.code}`, performedById: adminRajvi.id }
    });
    // 2. Inspection
    await prisma.assetHistory.create({
      data: { assetId: asset.id, action: 'INSPECTION_COMPLETED', description: `Routine visual inspection passed`, performedById: techCaterina.id }
    });
    // 3. Status Changed
    await prisma.assetHistory.create({
      data: { assetId: asset.id, action: 'STATUS_CHANGED', description: `Status set to OPERATIONAL`, performedById: adminRajvi.id }
    });
    // 4. Maintenance
    await prisma.assetHistory.create({
      data: { assetId: asset.id, action: 'MAINTENANCE_COMPLETED', description: `Routine PM tasks performed`, performedById: techLinom.id }
    });
    // 5. Audit
    await prisma.assetHistory.create({
      data: { assetId: asset.id, action: 'AUDIT_LOG', description: `Automated monitoring recorded baseline metrics`, performedById: null }
    });
  }

  // ---------------------------------------------------------
  // 13. ASSET DOCUMENTS
  // ---------------------------------------------------------
  console.log('Creating Asset Documents...');
  await prisma.assetDocument.createMany({
    data: [
      { assetId: hvacA.id, title: 'HVAC User Manual', url: 'https://docs.eam-demo.com/hvac/manual.pdf' },
      { assetId: gen303.id, title: 'Generator Maintenance Guide', url: 'https://docs.eam-demo.com/gen/maint-guide.pdf' },
      { assetId: elecPanel501.id, title: 'Electrical Panel Schematic', url: 'https://docs.eam-demo.com/elec/schematic-501.pdf' },
      { assetId: pump601.id, title: 'Pump Service Manual', url: 'https://docs.eam-demo.com/pump/service-manual.pdf' },
    ]
  });

  console.log('✅ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
