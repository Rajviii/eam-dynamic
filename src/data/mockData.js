export const DASHBOARD_STATS = {
  totalAssets: 1248,
  assetAvailability: 95.2,
  openWorkOrders: 156,
  criticalAssetsAtRisk: 18,
  maintenanceCost: 285000,
  assetHealthOverview: {
    excellent: 400,
    good: 600,
    warning: 200,
    critical: 48,
  },
};

export const ASSETS_LIST = [
  { id: 'AST-001', name: 'Main Conveyor', category: 'Conveyors', location: 'Plant A / Line 1', healthScore: 82, criticality: 'High', status: 'Operational' },
  { id: 'AST-002', name: 'Boiler 01', category: 'Boilers', location: 'Plant A / Utilities', healthScore: 62, criticality: 'Critical', status: 'Operational' },
  { id: 'AST-003', name: 'Pump 01', category: 'Pumps', location: 'Plant A / Utilities', healthScore: 55, criticality: 'High', status: 'Operational' },
  { id: 'AST-004', name: 'Compressor 01', category: 'Compressors', location: 'Plant A / Utilities', healthScore: 71, criticality: 'High', status: 'Operational' },
  { id: 'AST-005', name: 'Cooling Tower 01', category: 'Cooling Towers', location: 'Plant B / Utilities', healthScore: 78, criticality: 'Medium', status: 'Operational' },
  { id: 'AST-006', name: 'Transformer 01', category: 'Electrical', location: 'Plant B / Substation', healthScore: 88, criticality: 'High', status: 'Operational' },
  { id: 'AST-007', name: 'Gearbox 01', category: 'Gearboxes', location: 'Plant A / Line 2', healthScore: 65, criticality: 'Medium', status: 'Maintenance' },
  { id: 'AST-008', name: 'Valve 01', category: 'Valves', location: 'Plant A / Line 2', healthScore: 92, criticality: 'Low', status: 'Operational' },
  { id: 'AST-009', name: 'Chiller 01', category: 'HVAC', location: 'Plant B / Utilities', healthScore: 64, criticality: 'Medium', status: 'Operational' },
];

export const INVENTORY_PARTS = [
  { partNumber: 'BRG-6205', description: 'Bearing 6205', category: 'Bearings', onHand: 120, reorderPoint: 50, unitCost: 45.00, status: 'In Stock' },
  { partNumber: 'SEA-45X', description: 'Mechanical Seal 45mm', category: 'Seals', onHand: 12, reorderPoint: 10, unitCost: 185.00, status: 'Low Stock' },
  { partNumber: 'FLT-10XP', description: 'Oil Filter 10XP', category: 'Filters', onHand: 5, reorderPoint: 20, unitCost: 25.00, status: 'Low Stock' },
  { partNumber: 'VAL-40MM', description: 'Ball Valve 40mm', category: 'Valves', onHand: 35, reorderPoint: 15, unitCost: 120.00, status: 'In Stock' },
  { partNumber: 'MTR-15HP', description: 'Motor 15 HP', category: 'Motors', onHand: 2, reorderPoint: 5, unitCost: 850.00, status: 'Low Stock' },
  { partNumber: 'BELT-A52', description: 'Conveyor Belt A52', category: 'Belts', onHand: 15, reorderPoint: 10, unitCost: 75.00, status: 'In Stock' },
  { partNumber: 'GRE-2', description: 'Grease NGLI 2', category: 'Lubricants', onHand: 50, reorderPoint: 20, unitCost: 18.00, status: 'In Stock' },
  { partNumber: 'OIL-D4', description: 'Hydraulic Oil D4', category: 'Oils', onHand: 40, reorderPoint: 30, unitCost: 85.00, status: 'In Stock' },
];

export const WORK_ORDERS = {
  draft: [
    { id: 'WO-1056', title: 'Monthly safety check', asset: 'AST-001 - Main Conveyor', priority: 'Low' },
    { id: 'WO-1057', title: 'Lubrication', asset: 'AST-004 - Motor 01', priority: 'Low' },
    { id: 'WO-1058', title: 'Inspection', asset: 'AST-005 - Cooling Tower 01', priority: 'Medium' }
  ],
  assigned: [
    { id: 'WO-1001', title: 'Motor bearing inspection', asset: 'AST-004 - Motor 01', priority: 'Medium', assignee: 'John Smith' },
    { id: 'WO-1002', title: 'Pump seal replacement', asset: 'AST-003 - Pump 01', priority: 'High', assignee: 'Mike Johnson' }
  ],
  inProgress: [
    { id: 'WO-1003', title: 'Conveyor belt replacement', asset: 'AST-001 - Main Conveyor', priority: 'High', assignee: 'James Wilson' },
    { id: 'WO-1004', title: 'Boiler safety valve test', asset: 'AST-002 - Boiler 01', priority: 'Critical', assignee: 'Robert Brown' }
  ],
  waitingParts: [
    { id: 'WO-1010', title: 'Gearbox overhaul', asset: 'AST-004 - Compressor 01', priority: 'Medium', assignee: 'William Taylor' },
    { id: 'WO-1012', title: 'Cooling tower motor repair', asset: 'AST-005 - Cooling Tower 01', priority: 'Medium', assignee: 'David Lee' }
  ],
  completed: [
    { id: 'WO-0988', title: 'Transformer maintenance', asset: 'AST-007 - Transformer 01', priority: 'Low' },
    { id: 'WO-0989', title: 'Valve replacement', asset: 'AST-008 - Valve 01', priority: 'Low' }
  ]
};

export const RISK_REGISTER = [
  { id: 'R-01', risk: 'Boiler tube failure', likelihood: 4, consequence: 5, status: 'Open', riskScore: 'Extreme' },
  { id: 'R-02', risk: 'Conveyor belt failure', likelihood: 3, consequence: 4, status: 'Open', riskScore: 'High' },
  { id: 'R-03', risk: 'Pump seal failure', likelihood: 4, consequence: 3, status: 'Open', riskScore: 'High' },
  { id: 'R-04', risk: 'Compressor overheating', likelihood: 2, consequence: 4, status: 'In Progress', riskScore: 'Medium' },
  { id: 'R-05', risk: 'Motor bearing failure', likelihood: 3, consequence: 2, status: 'Open', riskScore: 'Medium' },
];

export const RELIABILITY_METRICS = {
  mtbf: 512,
  mttr: 4.6,
  availability: 95.2,
  reliability: 96.8,
  downtimeTrend: [
    { month: 'Jan', downtime: 45 },
    { month: 'Feb', downtime: 40 },
    { month: 'Mar', downtime: 55 },
    { month: 'Apr', downtime: 30 },
    { month: 'May', downtime: 25 },
    { month: 'Jun', downtime: 35 },
  ],
  failureFrequency: [
    { asset: 'Conv. Motor', count: 12 },
    { id: 'Pump 01', count: 8 },
    { id: 'Boiler 01', count: 5 },
    { id: 'Comp. Motor', count: 3 },
  ]
};

export const ASSET_HIERARCHY = [
  {
    id: 'h1',
    name: 'ABC Manufacturing',
    type: 'root',
    children: [
      {
        id: 'h2',
        name: 'Plant A',
        type: 'plant',
        children: [
          {
            id: 'h3',
            name: 'Production Line 1',
            type: 'line',
            children: [
              { id: 'h4', name: 'Conveyor System', type: 'system', children: [{ id: 'AST-001', name: 'Main Conveyor', type: 'asset' }, { id: 'AST-M1', name: 'Conveyor Motor 01', type: 'asset' }] }
            ]
          },
          {
            id: 'h5',
            name: 'Utilities',
            type: 'system',
            children: [
              { id: 'h6', name: 'Boiler House', type: 'subsystem', children: [{ id: 'AST-002', name: 'Boiler 01', type: 'asset' }] },
              { id: 'h7', name: 'Pumping Station', type: 'subsystem', children: [{ id: 'AST-003', name: 'Pump 01', type: 'asset' }, { id: 'AST-004', name: 'Pump Motor 01', type: 'asset' }] }
            ]
          }
        ]
      },
      {
        id: 'h8',
        name: 'Plant B',
        type: 'plant',
        children: []
      }
    ]
  }
];
