import { describe, expect, it } from "vitest";

import {
  calculateKPIs,
  calculateMachineMetrics,
  demoMachines,
  type DowntimeEvent,
  type ProductionRecord,
} from "@/lib/production-data";

describe("Production Calculations & OEE Verification", () => {
  const sampleRecords: ProductionRecord[] = [
    {
      id: "r1",
      date: "2026-11-23",
      time: "06:00",
      machineId: "120t",
      machine: "120T",
      operator: "Dhruv Patel",
      part: "HPDC-PH-101",
      shift: "Shift A",
      target: 2000,
      actual: 1800,
      goodShots: 1750,
      offShots: 0,
      operatorRejections: 30,
      qaRejections: 20,
      source: "manual",
    },
    {
      id: "r2",
      date: "2026-11-23",
      time: "08:00",
      machineId: "120t",
      machine: "120T",
      operator: "Dhruv Patel",
      part: "HPDC-PH-101",
      shift: "Shift A",
      target: 2000,
      actual: 1900,
      goodShots: 1850,
      offShots: 0,
      operatorRejections: 30,
      qaRejections: 20,
      source: "manual",
    },
  ];

  const sampleDowntime: DowntimeEvent[] = [
    {
      id: "dt1",
      date: "2026-11-23",
      time: "07:00",
      shift: "Shift A",
      machineId: "120t",
      machine: "120T",
      reason: "Die Setup",
      duration: 60,
      note: "Routine tooling adjustment",
    },
  ];

  it("calculates production totals and achievement accurately", () => {
    const kpis = calculateKPIs(sampleRecords, sampleDowntime);

    expect(kpis.totalProduction).toBe(3700);
    expect(kpis.productionTarget).toBe(4000);
    expect(kpis.goodShots).toBe(3600);
    expect(kpis.totalRejections).toBe(100);
    expect(kpis.achievementPct).toBe(92.5); // (3700 / 4000) * 100
    expect(kpis.rejectionRate).toBe(2.7); // (100 / 3700) * 100 = 2.702%
  });

  it("enforces mathematically sound OEE components without arbitrary fallbacks", () => {
    const kpis = calculateKPIs(sampleRecords, sampleDowntime);

    // Planned minutes: 1 shift block (720 mins)
    expect(kpis.plannedProductionMinutes).toBe(720);
    // Downtime: 60 mins -> Operating time: 660 mins
    expect(kpis.operatingMinutes).toBe(660);
    // Availability = 660 / 720 = 91.666...% -> 91.7%
    expect(kpis.availabilityPct).toBe(91.7);
    // Quality = 3600 / 3700 = 97.297...% -> 97.3%
    expect(kpis.qualityPct).toBe(97.3);
    // OEE = Availability * Performance * Quality
    expect(kpis.oeePct).toBeGreaterThan(0);
    expect(kpis.hasSufficientData).toBe(true);
  });

  it("handles zero denominator safely and returns N/A-compatible state", () => {
    const kpis = calculateKPIs([], []);

    expect(kpis.totalProduction).toBe(0);
    expect(kpis.productionTarget).toBe(0);
    expect(kpis.achievementPct).toBe(0);
    expect(kpis.oeePct).toBe(0);
    expect(kpis.hasSufficientData).toBe(false);
  });

  it("calculates machine metrics dynamically for machine cards", () => {
    const machineDef = demoMachines[0]; // 120T
    const metrics = calculateMachineMetrics(machineDef, sampleRecords, sampleDowntime);

    expect(metrics.actual).toBe(3700);
    expect(metrics.target).toBe(4000);
    expect(metrics.goodShots).toBe(3600);
    expect(metrics.rejections).toBe(100);
    expect(metrics.downtimeMinutes).toBe(60);
    expect(metrics.operatingMinutes).toBe(660);
    expect(metrics.hasData).toBe(true);
    expect(metrics.oeePct).toBeGreaterThan(0);
  });
});
