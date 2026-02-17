export const CATEGORIES = {
  '1': { id: 1, name: 'Material Handling Equipment' },
  '2': { id: 2, name: 'Measurement Equipment' },
  '3': { id: 3, name: 'Safety Equipment' },
  '4': { id: 4, name: 'PPE and Personal Equipment' },
};

export const EQUIPMENT_LIST = [
  // Material Handling
  { id: 1, categoryId: 1, code: 'EQ-001', name: 'Overhead Crane', location: 'Bay A', status: 'Active' },
  { id: 2, categoryId: 1, code: 'EQ-002', name: 'Forklift', location: 'Bay B', status: 'Active' },
  { id: 3, categoryId: 1, code: 'EQ-003', name: 'Lifting Devices', location: 'Bay C', status: 'Active' },
  { id: 4, categoryId: 1, code: 'EQ-004', name: 'Welding Equipment', location: 'Workshop', status: 'Maintenance' },
  // Measurement
  { id: 5, categoryId: 2, code: 'EQ-005', name: 'Micrometer', location: 'Lab 1', status: 'Active' },
  { id: 6, categoryId: 2, code: 'EQ-006', name: 'Caliper', location: 'Lab 1', status: 'Active' },
  { id: 7, categoryId: 2, code: 'EQ-007', name: 'Gauge', location: 'Lab 2', status: 'Active' },
  // Safety
  { id: 8, categoryId: 3, code: 'EQ-008', name: 'Fire Extinguisher', location: 'All Bays', status: 'Active' },
  { id: 9, categoryId: 3, code: 'EQ-009', name: 'Safety Harness', location: 'Store', status: 'Active' },
  { id: 10, categoryId: 3, code: 'EQ-010', name: 'First Aid Kit', location: 'Office', status: 'Active' },
  // PPE
  { id: 11, categoryId: 4, code: 'EQ-011', name: 'Safety Helmet', location: 'Store', status: 'Active' },
  { id: 12, categoryId: 4, code: 'EQ-012', name: 'Safety Gloves', location: 'Store', status: 'Active' },
  { id: 13, categoryId: 4, code: 'EQ-013', name: 'Safety Boots', location: 'Store', status: 'Active' },
];

export const JOBS = [
  { id: 1, jobCode: 'J-001', jobName: 'Monthly Inspection', jobType: 'Inspection', equipmentId: 1, category: 'Material Handling Equipment', flag: 'Urgent', dateDone: '2026-02-01', hoursWorked: 10, plannedHours: 12, dateDue: '2026-03-01', remainingHours: 2, criticality: 'high', overdueDays: 0 },
  { id: 2, jobCode: 'J-002', jobName: 'Oil Change', jobType: 'Maintenance', equipmentId: 2, category: 'Material Handling Equipment', flag: '', dateDone: '2026-01-15', hoursWorked: 5, plannedHours: 5, dateDue: '2026-02-15', remainingHours: 0, criticality: 'medium', overdueDays: 1 },
  { id: 3, jobCode: 'J-003', jobName: 'Calibration', jobType: 'Calibration', equipmentId: 5, category: 'Measurement Equipment', flag: '', dateDone: '2025-12-01', hoursWorked: 2, plannedHours: 2, dateDue: '2026-12-01', remainingHours: 0, criticality: 'high', overdueDays: 0 },
  { id: 4, jobCode: 'J-004', jobName: 'Safety Check', jobType: 'Inspection', equipmentId: 8, category: 'Safety Equipment', flag: '', dateDone: '2026-01-01', hoursWorked: 1, plannedHours: 1, dateDue: '2026-02-01', remainingHours: 0, criticality: 'low', overdueDays: 14 },
];
