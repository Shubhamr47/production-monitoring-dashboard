import * as XLSX from "xlsx";

export type ProductionRecord = {
  id: string;
  date: string;
  time: string;
  machineId: string;
  machine: string;
  operator: string;
  part: string;
  shift: string;
  target: number;
  actual: number;
  goodShots: number;
  offShots: number;
  operatorRejections: number;
  qaRejections: number;
  source: "demo" | "imported" | "manual";
};

export type MachineSummary = {
  id: string;
  name: string;
  tonnage: number;
  status: "Running" | "Idle" | "Maintenance";
  oee: number;
  clampingForce: string;
  platenSize: string;
  cycleTime: number;
  furnaceTemp: number;
  oilTemp: number;
  dieCode: string;
};

export type DowntimeEvent = {
  id: string;
  date: string;
  time: string;
  shift: string;
  machineId: string;
  machine: string;
  reason: string;
  duration: number;
  note: string;
};

export type DashboardFilters = {
  date: string;
  shift: string;
  machine: string;
  part: string;
};

export type ImportField =
  | "date"
  | "shift"
  | "machine"
  | "operator"
  | "part"
  | "target"
  | "actual"
  | "goodShots"
  | "offShots"
  | "operatorRejections"
  | "qaRejections";

export type ImportMapping = Record<ImportField, number | null>;

export type ImportIssue = {
  row: number;
  errors: string[];
};

export const IMPORT_FIELDS: { key: ImportField; label: string; required: boolean }[] = [
  { key: "date", label: "Production date", required: true },
  { key: "shift", label: "Shift", required: true },
  { key: "machine", label: "Machine", required: true },
  { key: "operator", label: "Operator", required: false },
  { key: "part", label: "Part", required: false },
  { key: "target", label: "Target", required: true },
  { key: "actual", label: "Actual", required: true },
  { key: "goodShots", label: "Good shots", required: false },
  { key: "offShots", label: "Off shots", required: false },
  { key: "operatorRejections", label: "Operator rejection", required: false },
  { key: "qaRejections", label: "QA rejection", required: false },
];

export const DEMO_DATE = "2026-11-23";

export const demoMachines: MachineSummary[] = [
  { id: "120t", name: "120T", tonnage: 120, status: "Running", oee: 78.4, clampingForce: "1,200 kN", platenSize: "620 × 620 mm", cycleTime: 22, furnaceTemp: 685, oilTemp: 46, dieCode: "DIE-PH-120" },
  { id: "150t", name: "150T", tonnage: 150, status: "Running", oee: 75.8, clampingForce: "1,500 kN", platenSize: "700 × 700 mm", cycleTime: 25, furnaceTemp: 690, oilTemp: 48, dieCode: "DIE-VB-150" },
  { id: "180t", name: "180T", tonnage: 180, status: "Running", oee: 74.2, clampingForce: "1,800 kN", platenSize: "780 × 780 mm", cycleTime: 28, furnaceTemp: 680, oilTemp: 47, dieCode: "DIE-BK-180" },
  { id: "420t-i", name: "420T-I", tonnage: 420, status: "Running", oee: 79.1, clampingForce: "4,200 kN", platenSize: "1,150 × 1,150 mm", cycleTime: 42, furnaceTemp: 705, oilTemp: 50, dieCode: "DIE-TC-420A" },
  { id: "420t-ii", name: "420T-II", tonnage: 420, status: "Idle", oee: 76.6, clampingForce: "4,200 kN", platenSize: "1,150 × 1,150 mm", cycleTime: 44, furnaceTemp: 700, oilTemp: 49, dieCode: "DIE-CB-420B" },
  { id: "800t", name: "800T", tonnage: 800, status: "Maintenance", oee: 68.8, clampingForce: "8,000 kN", platenSize: "1,550 × 1,550 mm", cycleTime: 65, furnaceTemp: 715, oilTemp: 52, dieCode: "DIE-GH-800" },
];

export const demoParts = [
  "HPDC-PH-101 (Pump Housing)",
  "HPDC-VB-204 (Valve Body)",
  "HPDC-BK-402 (Bracket 4B)",
  "HPDC-TC-801 (Transmission Case)",
  "HPDC-CB-505 (Cylinder Block)",
  "HPDC-GH-303 (Gear Housing)",
];

export const demoProductionRecords: ProductionRecord[] = [
  // 2026-11-23 - Shift A
  { id: "d-01", date: "2026-11-23", time: "06:00", machineId: "120t", machine: "120T", operator: "Dhruv Patel", part: "HPDC-PH-101 (Pump Housing)", shift: "Shift A", target: 2000, actual: 1880, goodShots: 1796, offShots: 36, operatorRejections: 29, qaRejections: 19, source: "demo" },
  { id: "d-02", date: "2026-11-23", time: "08:00", machineId: "150t", machine: "150T", operator: "Kavita Rao", part: "HPDC-VB-204 (Valve Body)", shift: "Shift A", target: 2100, actual: 1940, goodShots: 1858, offShots: 31, operatorRejections: 30, qaRejections: 21, source: "demo" },
  { id: "d-03", date: "2026-11-23", time: "10:00", machineId: "180t", machine: "180T", operator: "Aman Verma", part: "HPDC-BK-402 (Bracket 4B)", shift: "Shift A", target: 2300, actual: 2140, goodShots: 2056, offShots: 33, operatorRejections: 30, qaRejections: 21, source: "demo" },
  { id: "d-04", date: "2026-11-23", time: "12:00", machineId: "420t-i", machine: "420T-I", operator: "Priya Shah", part: "HPDC-TC-801 (Transmission Case)", shift: "Shift A", target: 3500, actual: 3290, goodShots: 3136, offShots: 54, operatorRejections: 61, qaRejections: 39, source: "demo" },
  { id: "d-05", date: "2026-11-23", time: "14:00", machineId: "420t-ii", machine: "420T-II", operator: "Rajesh Kumar", part: "HPDC-CB-505 (Cylinder Block)", shift: "Shift A", target: 3500, actual: 3390, goodShots: 3248, offShots: 45, operatorRejections: 58, qaRejections: 39, source: "demo" },
  { id: "d-06", date: "2026-11-23", time: "16:00", machineId: "800t", machine: "800T", operator: "Sunil Sharma", part: "HPDC-GH-303 (Gear Housing)", shift: "Shift A", target: 4500, actual: 4130, goodShots: 3935, offShots: 68, operatorRejections: 74, qaRejections: 53, source: "demo" },
  // 2026-11-23 - Shift B
  { id: "d-07", date: "2026-11-23", time: "18:00", machineId: "120t", machine: "120T", operator: "Aman Verma", part: "HPDC-PH-101 (Pump Housing)", shift: "Shift B", target: 1500, actual: 1435, goodShots: 1360, offShots: 30, operatorRejections: 28, qaRejections: 17, source: "demo" },
  { id: "d-08", date: "2026-11-23", time: "20:00", machineId: "150t", machine: "150T", operator: "Priya Shah", part: "HPDC-VB-204 (Valve Body)", shift: "Shift B", target: 1800, actual: 1710, goodShots: 1641, offShots: 24, operatorRejections: 27, qaRejections: 18, source: "demo" },
  { id: "d-09", date: "2026-11-23", time: "22:00", machineId: "180t", machine: "180T", operator: "Dhruv Patel", part: "HPDC-BK-402 (Bracket 4B)", shift: "Shift B", target: 2200, actual: 2068, goodShots: 1983, offShots: 33, operatorRejections: 32, qaRejections: 20, source: "demo" },
  { id: "d-10", date: "2026-11-23", time: "00:00", machineId: "420t-i", machine: "420T-I", operator: "Kavita Rao", part: "HPDC-TC-801 (Transmission Case)", shift: "Shift B", target: 3300, actual: 3138, goodShots: 3008, offShots: 51, operatorRejections: 50, qaRejections: 29, source: "demo" },
  { id: "d-11", date: "2026-11-23", time: "02:00", machineId: "420t-ii", machine: "420T-II", operator: "Rajesh Kumar", part: "HPDC-CB-505 (Cylinder Block)", shift: "Shift B", target: 3200, actual: 3125, goodShots: 2998, offShots: 48, operatorRejections: 48, qaRejections: 31, source: "demo" },
  { id: "d-12", date: "2026-11-23", time: "04:00", machineId: "800t", machine: "800T", operator: "Sunil Sharma", part: "HPDC-GH-303 (Gear Housing)", shift: "Shift B", target: 4000, actual: 3714, goodShots: 3551, offShots: 58, operatorRejections: 62, qaRejections: 43, source: "demo" },
  // 2026-11-22 - Previous Day records
  { id: "d-13", date: "2026-11-22", time: "06:00", machineId: "120t", machine: "120T", operator: "Dhruv Patel", part: "HPDC-PH-101 (Pump Housing)", shift: "Shift A", target: 2000, actual: 1910, goodShots: 1830, offShots: 32, operatorRejections: 26, qaRejections: 22, source: "demo" },
  { id: "d-14", date: "2026-11-22", time: "08:00", machineId: "150t", machine: "150T", operator: "Kavita Rao", part: "HPDC-VB-204 (Valve Body)", shift: "Shift A", target: 2100, actual: 1980, goodShots: 1895, offShots: 35, operatorRejections: 28, qaRejections: 22, source: "demo" },
  { id: "d-15", date: "2026-11-22", time: "10:00", machineId: "180t", machine: "180T", operator: "Aman Verma", part: "HPDC-BK-402 (Bracket 4B)", shift: "Shift A", target: 2300, actual: 2180, goodShots: 2090, offShots: 38, operatorRejections: 31, qaRejections: 21, source: "demo" },
  { id: "d-16", date: "2026-11-22", time: "12:00", machineId: "420t-i", machine: "420T-I", operator: "Priya Shah", part: "HPDC-TC-801 (Transmission Case)", shift: "Shift A", target: 3500, actual: 3340, goodShots: 3190, offShots: 56, operatorRejections: 55, qaRejections: 39, source: "demo" },
  { id: "d-17", date: "2026-11-22", time: "14:00", machineId: "420t-ii", machine: "420T-II", operator: "Rajesh Kumar", part: "HPDC-CB-505 (Cylinder Block)", shift: "Shift A", target: 3500, actual: 3410, goodShots: 3270, offShots: 48, operatorRejections: 52, qaRejections: 40, source: "demo" },
  { id: "d-18", date: "2026-11-22", time: "16:00", machineId: "800t", machine: "800T", operator: "Sunil Sharma", part: "HPDC-GH-303 (Gear Housing)", shift: "Shift A", target: 4500, actual: 4210, goodShots: 4015, offShots: 70, operatorRejections: 72, qaRejections: 53, source: "demo" },
  // 2026-11-21 - Earlier Day records
  { id: "d-19", date: "2026-11-21", time: "06:00", machineId: "120t", machine: "120T", operator: "Dhruv Patel", part: "HPDC-PH-101 (Pump Housing)", shift: "Shift A", target: 2000, actual: 1850, goodShots: 1765, offShots: 35, operatorRejections: 31, qaRejections: 19, source: "demo" },
  { id: "d-20", date: "2026-11-21", time: "08:00", machineId: "150t", machine: "150T", operator: "Kavita Rao", part: "HPDC-VB-204 (Valve Body)", shift: "Shift A", target: 2100, actual: 1920, goodShots: 1835, offShots: 34, operatorRejections: 29, qaRejections: 22, source: "demo" },
  { id: "d-21", date: "2026-11-21", time: "10:00", machineId: "180t", machine: "180T", operator: "Aman Verma", part: "HPDC-BK-402 (Bracket 4B)", shift: "Shift A", target: 2300, actual: 2110, goodShots: 2025, offShots: 36, operatorRejections: 28, qaRejections: 21, source: "demo" },
  { id: "d-22", date: "2026-11-21", time: "12:00", machineId: "420t-i", machine: "420T-I", operator: "Priya Shah", part: "HPDC-TC-801 (Transmission Case)", shift: "Shift A", target: 3500, actual: 3260, goodShots: 3110, offShots: 52, operatorRejections: 59, qaRejections: 39, source: "demo" },
  { id: "d-23", date: "2026-11-21", time: "14:00", machineId: "420t-ii", machine: "420T-II", operator: "Rajesh Kumar", part: "HPDC-CB-505 (Cylinder Block)", shift: "Shift A", target: 3500, actual: 3370, goodShots: 3225, offShots: 46, operatorRejections: 56, qaRejections: 43, source: "demo" },
  { id: "d-24", date: "2026-11-21", time: "16:00", machineId: "800t", machine: "800T", operator: "Sunil Sharma", part: "HPDC-GH-303 (Gear Housing)", shift: "Shift A", target: 4500, actual: 4090, goodShots: 3895, offShots: 65, operatorRejections: 76, qaRejections: 54, source: "demo" },
];

export const demoDowntimeEvents: DowntimeEvent[] = [
  // Realistic reasons: die setup, die problems, preheating, spray gun problems, power cuts, hydraulic fault, planned maintenance
  { id: "dt-01", date: "2026-11-23", time: "06:40", shift: "Shift A", machineId: "120t", machine: "120T", reason: "Die Setup", duration: 35, note: "Tool clamp alignment & pre-test" },
  { id: "dt-02", date: "2026-11-23", time: "09:15", shift: "Shift A", machineId: "120t", machine: "120T", reason: "Preheating", duration: 25, note: "Die temperature stabilization" },
  { id: "dt-03", date: "2026-11-23", time: "08:25", shift: "Shift A", machineId: "150t", machine: "150T", reason: "Spray Gun Problems", duration: 40, note: "Nozzle clogging and flow calibration" },
  { id: "dt-04", date: "2026-11-23", time: "21:10", shift: "Shift B", machineId: "150t", machine: "150T", reason: "Die Problems", duration: 28, note: "Flash on parting line & core pin check" },
  { id: "dt-05", date: "2026-11-23", time: "11:35", shift: "Shift A", machineId: "180t", machine: "180T", reason: "Hydraulic Fault", duration: 45, note: "Hydraulic line pressure drop" },
  { id: "dt-06", date: "2026-11-23", time: "23:20", shift: "Shift B", machineId: "180t", machine: "180T", reason: "Power Cut", duration: 20, note: "Grid voltage fluctuation trip" },
  { id: "dt-07", date: "2026-11-23", time: "13:10", shift: "Shift A", machineId: "420t-i", machine: "420T-I", reason: "Preheating", duration: 30, note: "Holding furnace reheat cycle" },
  { id: "dt-08", date: "2026-11-23", time: "00:45", shift: "Shift B", machineId: "420t-i", machine: "420T-I", reason: "Spray Gun Problems", duration: 22, note: "Air-lubricant ratio adjustment" },
  { id: "dt-09", date: "2026-11-23", time: "15:20", shift: "Shift A", machineId: "420t-ii", machine: "420T-II", reason: "Die Problems", duration: 55, note: "Stuck casting in moving die half" },
  { id: "dt-10", date: "2026-11-23", time: "03:20", shift: "Shift B", machineId: "420t-ii", machine: "420T-II", reason: "Die Setup", duration: 45, note: "Insert changeover for block type B" },
  { id: "dt-11", date: "2026-11-23", time: "16:30", shift: "Shift A", machineId: "800t", machine: "800T", reason: "Power Cut", duration: 35, note: "Main feeder line breaker trip" },
  { id: "dt-12", date: "2026-11-23", time: "05:10", shift: "Shift B", machineId: "800t", machine: "800T", reason: "Hydraulic Fault", duration: 60, note: "Accumulator pressure seal leak" },
  // Previous day downtime
  { id: "dt-13", date: "2026-11-22", time: "07:15", shift: "Shift A", machineId: "120t", machine: "120T", reason: "Die Setup", duration: 30, note: "Morning run preparation" },
  { id: "dt-14", date: "2026-11-22", time: "11:00", shift: "Shift A", machineId: "150t", machine: "150T", reason: "Preheating", duration: 20, note: "Die preheat cycle" },
  { id: "dt-15", date: "2026-11-22", time: "14:30", shift: "Shift A", machineId: "420t-i", machine: "420T-I", reason: "Die Problems", duration: 40, note: "Ejector pin friction" },
  { id: "dt-16", date: "2026-11-21", time: "09:00", shift: "Shift A", machineId: "180t", machine: "180T", reason: "Spray Gun Problems", duration: 25, note: "Lube nozzle service" },
  { id: "dt-17", date: "2026-11-21", time: "13:45", shift: "Shift A", machineId: "800t", machine: "800T", reason: "Power Cut", duration: 15, note: "Substation switchover" },
];

export const defaultFilters: DashboardFilters = { date: "all", shift: "all", machine: "all", part: "all" };

export function filterProductionRecords(
  records: ProductionRecord[],
  filters: DashboardFilters,
): ProductionRecord[] {
  return records.filter((record) => {
    return (
      (filters.date === "all" || record.date === filters.date) &&
      (filters.shift === "all" || record.shift === filters.shift) &&
      (filters.machine === "all" || record.machineId === filters.machine) &&
      (filters.part === "all" || record.part === filters.part)
    );
  });
}

export function filterDowntimeEvents(
  events: DowntimeEvent[],
  filters: DashboardFilters,
): DowntimeEvent[] {
  return events.filter((event) => {
    return (
      (filters.date === "all" || event.date === filters.date) &&
      (filters.shift === "all" || event.shift === filters.shift) &&
      (filters.machine === "all" || event.machineId === filters.machine)
    );
  });
}

export function getRecordIdentity(record: {
  date: string;
  shift: string;
  machineId?: string;
  machine?: string;
  time?: string;
  part?: string;
}): string {
  const d = (record.date || "").trim();
  const s = (record.shift || "").trim().toLowerCase();
  const m = ((record.machineId || (record.machine ? machineIdFromName(record.machine) : "")) || "").trim().toLowerCase();
  const t = (record.time || "").trim().toLowerCase();
  const p = (record.part || "").trim().toLowerCase();
  return `${d}|${s}|${m}|${t}|${p}`;
}

export type CalculatedKPIs = {
  totalProduction: number;
  productionTarget: number;
  achievementPct: number;
  plannedProductionMinutes: number;
  operatingMinutes: number;
  totalDowntimeMinutes: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;
  totalRejections: number;
  goodShots: number;
  offShots: number;
  operatorRejections: number;
  qaRejections: number;
  rejectionRate: number;
  hasSufficientData: boolean;
};

export function calculateKPIs(
  records: ProductionRecord[],
  downtimeEvents: DowntimeEvent[],
): CalculatedKPIs {
  const totalProduction = records.reduce((sum, r) => sum + r.actual, 0);
  const productionTarget = records.reduce((sum, r) => sum + r.target, 0);
  const goodShots = records.reduce((sum, r) => sum + r.goodShots, 0);
  const offShots = records.reduce((sum, r) => sum + r.offShots, 0);
  const operatorRejections = records.reduce((sum, r) => sum + r.operatorRejections, 0);
  const qaRejections = records.reduce((sum, r) => sum + r.qaRejections, 0);
  const totalRejections = operatorRejections + qaRejections;
  const totalDowntimeMinutes = downtimeEvents.reduce((sum, d) => sum + d.duration, 0);

  const achievementPct = productionTarget > 0 ? (totalProduction / productionTarget) * 100 : 0;
  const rejectionRate = totalProduction > 0 ? (totalRejections / totalProduction) * 100 : 0;

  // Distinct scheduled machine shifts (each standard manufacturing shift is 720 minutes = 12h)
  const shiftBlocks = new Set<string>();
  records.forEach((r) => {
    shiftBlocks.add(`${r.date}|${r.shift}|${r.machineId}`);
  });
  downtimeEvents.forEach((d) => {
    shiftBlocks.add(`${d.date}|${d.shift}|${d.machineId}`);
  });

  const plannedProductionMinutes = shiftBlocks.size > 0 ? shiftBlocks.size * 720 : (records.length > 0 ? 720 : 0);
  const operatingMinutes = Math.max(0, plannedProductionMinutes - totalDowntimeMinutes);

  // 1. Availability = Operating Time / Planned Production Time
  const availability = plannedProductionMinutes > 0 ? Math.max(0, Math.min(1.0, operatingMinutes / plannedProductionMinutes)) : 0;

  // 2. Performance = Actual Output / Theoretical Maximum Output
  // Theoretical Maximum Output = Operating seconds / ideal cycle time per machine
  let theoreticalMaxOutput = 0;
  records.forEach((r) => {
    const machineDef = demoMachines.find((m) => m.id === r.machineId);
    const cycleTimeSec = machineDef?.cycleTime || 30;
    // Machine operating portion
    const machineDowntime = downtimeEvents
      .filter((d) => d.machineId === r.machineId && d.date === r.date && d.shift === r.shift)
      .reduce((s, d) => s + d.duration, 0);
    const machineOperatingSec = Math.max(0, (720 - machineDowntime) * 60);
    theoreticalMaxOutput += Math.floor(machineOperatingSec / cycleTimeSec);
  });

  const performance = theoreticalMaxOutput > 0
    ? Math.max(0, Math.min(1.0, totalProduction / theoreticalMaxOutput))
    : (productionTarget > 0 ? Math.max(0, Math.min(1.0, totalProduction / productionTarget)) : 0);

  // 3. Quality = Good Output / Total Output
  const quality = totalProduction > 0 ? Math.max(0, Math.min(1.0, goodShots / totalProduction)) : 0;

  // 4. OEE = Availability × Performance × Quality
  const hasSufficientData = plannedProductionMinutes > 0 && totalProduction > 0;
  const oeePct = hasSufficientData ? Number((availability * performance * quality * 100).toFixed(1)) : 0;

  return {
    totalProduction,
    productionTarget,
    achievementPct: Number(achievementPct.toFixed(1)),
    plannedProductionMinutes,
    operatingMinutes,
    totalDowntimeMinutes,
    availabilityPct: Number((availability * 100).toFixed(1)),
    performancePct: Number((performance * 100).toFixed(1)),
    qualityPct: Number((quality * 100).toFixed(1)),
    oeePct,
    totalRejections,
    goodShots,
    offShots,
    operatorRejections,
    qaRejections,
    rejectionRate: Number(rejectionRate.toFixed(1)),
    hasSufficientData,
  };
}

export type MachineCalculatedMetrics = {
  machine: MachineSummary;
  recordsCount: number;
  target: number;
  actual: number;
  goodShots: number;
  offShots: number;
  rejections: number;
  operatorRejections: number;
  qaRejections: number;
  achievementPct: number;
  rejectionRate: number;
  plannedMinutes: number;
  operatingMinutes: number;
  downtimeMinutes: number;
  availabilityPct: number;
  performancePct: number;
  qualityPct: number;
  oeePct: number;
  hasData: boolean;
};

export function calculateMachineMetrics(
  machine: MachineSummary,
  records: ProductionRecord[],
  downtimeEvents: DowntimeEvent[],
): MachineCalculatedMetrics {
  const machineRecords = records.filter((r) => r.machineId === machine.id);
  const machineDowntime = downtimeEvents.filter((d) => d.machineId === machine.id);

  const target = machineRecords.reduce((sum, r) => sum + r.target, 0);
  const actual = machineRecords.reduce((sum, r) => sum + r.actual, 0);
  const goodShots = machineRecords.reduce((sum, r) => sum + r.goodShots, 0);
  const offShots = machineRecords.reduce((sum, r) => sum + r.offShots, 0);
  const operatorRejections = machineRecords.reduce((sum, r) => sum + r.operatorRejections, 0);
  const qaRejections = machineRecords.reduce((sum, r) => sum + r.qaRejections, 0);
  const rejections = operatorRejections + qaRejections;
  const downtimeMinutes = machineDowntime.reduce((sum, d) => sum + d.duration, 0);

  const achievementPct = target > 0 ? Number(((actual / target) * 100).toFixed(1)) : 0;
  const rejectionRate = actual > 0 ? Number(((rejections / actual) * 100).toFixed(1)) : 0;

  // Scheduled shifts for this machine
  const shiftsSet = new Set<string>();
  machineRecords.forEach((r) => shiftsSet.add(`${r.date}|${r.shift}`));
  machineDowntime.forEach((d) => shiftsSet.add(`${d.date}|${d.shift}`));

  const plannedMinutes = shiftsSet.size > 0 ? shiftsSet.size * 720 : (machineRecords.length > 0 ? 720 : 0);
  const operatingMinutes = Math.max(0, plannedMinutes - downtimeMinutes);

  const availability = plannedMinutes > 0 ? Math.max(0, Math.min(1.0, operatingMinutes / plannedMinutes)) : 0;
  const theoreticalOutput = machine.cycleTime > 0 ? Math.floor((operatingMinutes * 60) / machine.cycleTime) : 0;
  const performance = theoreticalOutput > 0
    ? Math.max(0, Math.min(1.0, actual / theoreticalOutput))
    : (target > 0 ? Math.max(0, Math.min(1.0, actual / target)) : 0);
  const quality = actual > 0 ? Math.max(0, Math.min(1.0, goodShots / actual)) : 0;

  const hasData = plannedMinutes > 0 && actual > 0;
  const oeePct = hasData ? Number((availability * performance * quality * 100).toFixed(1)) : 0;

  return {
    machine,
    recordsCount: machineRecords.length,
    target,
    actual,
    goodShots,
    offShots,
    rejections,
    operatorRejections,
    qaRejections,
    achievementPct,
    rejectionRate,
    plannedMinutes,
    operatingMinutes,
    downtimeMinutes,
    availabilityPct: Number((availability * 100).toFixed(1)),
    performancePct: Number((performance * 100).toFixed(1)),
    qualityPct: Number((quality * 100).toFixed(1)),
    oeePct,
    hasData,
  };
}

export function machineIdFromName(machine: string): string {
  return machine.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizedHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const headerAliases: Record<ImportField, string[]> = {
  date: ["date", "productiondate", "workdate", "timestamp"],
  shift: ["shift", "shifttype"],
  machine: ["machine", "machinename", "machineno", "machineid", "press"],
  operator: ["operator", "operatorname", "empname"],
  part: ["part", "partname", "product"],
  target: ["target", "planned", "plantarget", "targetquantity"],
  actual: ["actual", "production", "actualquantity", "totalproduction"],
  goodShots: ["goodshots", "goodproduction", "good", "goodquantity"],
  offShots: ["offshots", "offshot", "offs", "offquantity"],
  operatorRejections: ["operatorrejection", "operatorrejections", "operatorreject", "oprejection"],
  qaRejections: ["qarejection", "qarejections", "qareject", "qualityrejection"],
};

export function inferImportMapping(headers: string[]): ImportMapping {
  const normalized = headers.map(normalizedHeader);
  const mapping = {} as ImportMapping;
  for (const field of IMPORT_FIELDS) {
    const aliases = headerAliases[field.key];
    const index = normalized.findIndex((header) => aliases.includes(header));
    mapping[field.key] = index >= 0 ? index : null;
  }
  return mapping;
}

export function parseWorkbook(buffer: ArrayBuffer): {
  sheetName: string;
  headers: string[];
  rows: unknown[][];
} {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("This workbook has no worksheets.");
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new Error("The first worksheet could not be read.");
  const grid = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });
  const headerRow = grid[0];
  if (!headerRow || headerRow.length === 0) throw new Error("The first worksheet is empty.");
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  return { sheetName, headers, rows: grid.slice(1) };
}

function valueAt(row: unknown[], mapping: ImportMapping, field: ImportField): string {
  const index = mapping[field];
  if (index === null) return "";
  return String(row[index] ?? "").trim();
}

function numericValue(value: string): number | null {
  if (!value) return 0;
  const parsed = Number(value.replaceAll(",", "").trim());
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function validateImportedRows(rows: unknown[][], mapping: ImportMapping): {
  valid: ProductionRecord[];
  issues: ImportIssue[];
  requiredMappingMissing: string[];
} {
  const requiredFields = IMPORT_FIELDS.filter((field) => field.required);
  const requiredMappingMissing = requiredFields
    .filter((field) => mapping[field.key] === null)
    .map((field) => field.label);
  if (requiredMappingMissing.length > 0) return { valid: [], issues: [], requiredMappingMissing };

  const valid: ProductionRecord[] = [];
  const issues: ImportIssue[] = [];
  rows.forEach((row, index) => {
    if (!row.some((cell) => String(cell ?? "").trim() !== "")) return;
    const errors: string[] = [];
    const date = valueAt(row, mapping, "date");
    const shift = valueAt(row, mapping, "shift");
    const machine = valueAt(row, mapping, "machine");
    const targetValue = numericValue(valueAt(row, mapping, "target"));
    const actualValue = numericValue(valueAt(row, mapping, "actual"));
    const optionalNumber = (field: ImportField, label: string): number => {
      if (mapping[field] === null) return 0;
      const value = numericValue(valueAt(row, mapping, field));
      if (value === null) {
        errors.push(`${label} must be a non-negative number.`);
        return 0;
      }
      return value;
    };
    if (!date) errors.push("Production date is missing.");
    if (!shift) errors.push("Shift is missing.");
    if (!machine) errors.push("Machine is missing.");
    if (targetValue === null) errors.push("Target must be a non-negative number.");
    if (actualValue === null) errors.push("Actual must be a non-negative number.");
    const goodShots = optionalNumber("goodShots", "Good shots");
    const offShots = optionalNumber("offShots", "Off shots");
    const operatorRejections = optionalNumber("operatorRejections", "Operator rejection");
    const qaRejections = optionalNumber("qaRejections", "QA rejection");
    if (errors.length > 0 || targetValue === null || actualValue === null) {
      issues.push({ row: index + 2, errors });
      return;
    }
    valid.push({
      id: `workbook-${index + 2}`,
      date,
      time: "—",
      machineId: machineIdFromName(machine),
      machine,
      operator: valueAt(row, mapping, "operator") || "Not provided",
      part: valueAt(row, mapping, "part") || "Not provided",
      shift,
      target: targetValue,
      actual: actualValue,
      goodShots,
      offShots,
      operatorRejections,
      qaRejections,
      source: "imported",
    });
  });
  return { valid, issues, requiredMappingMissing };
}

export function downloadCsv(rows: Record<string, string | number>[], filename: string): void {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0] ?? {});
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const content = [columns, ...rows.map((row) => columns.map((column) => String(row[column] ?? "")))]
    .map((line) => line.map((cell) => escapeCell(cell)).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadExcel(rows: Record<string, string | number>[], filename: string): void {
  if (rows.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename);
}