import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Award,
  Boxes,
  CheckCircle2,
  ClockAlert,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  Gauge,
  Layers,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { useProductionData } from "@/context/production-data-context";
import {
  calculateMachineMetrics,
  type MachineSummary,
} from "@/lib/production-data";
import {
  DataTable,
  FilterBar,
  MetricCard,
  PageHeading,
  downloadCsv,
  formatDate,
  formatNumber,
  formatPercent,
  statusBadge,
} from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { filteredRecords, filteredDowntime, machines, kpis } = useProductionData();
  const [activeTab, setActiveTab] = useState("daily");

  // 1. Daily Production Summary Data
  const dailySummaryData = useMemo(() => {
    const map = new Map<string, {
      date: string;
      shifts: Set<string>;
      target: number;
      actual: number;
      goodShots: number;
      rejections: number;
    }>();

    filteredRecords.forEach((r) => {
      const existing = map.get(r.date) || {
        date: r.date,
        shifts: new Set(),
        target: 0,
        actual: 0,
        goodShots: 0,
        rejections: 0,
      };
      existing.shifts.add(r.shift);
      existing.target += r.target;
      existing.actual += r.actual;
      existing.goodShots += r.goodShots;
      existing.rejections += (r.operatorRejections + r.qaRejections);
      map.set(r.date, existing);
    });

    return Array.from(map.values()).map((d) => ({
      id: d.date,
      date: d.date,
      shifts: Array.from(d.shifts).join(", "),
      target: d.target,
      actual: d.actual,
      goodShots: d.goodShots,
      rejections: d.rejections,
      achievement: d.target > 0 ? Number(((d.actual / d.target) * 100).toFixed(1)) : 0,
      yieldRate: d.actual > 0 ? Number(((d.goodShots / d.actual) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRecords]);

  // 2. Machine Performance Summary Data
  const machineSummaryData = useMemo(() => {
    return machines.map((m) => {
      const metrics = calculateMachineMetrics(m, filteredRecords, filteredDowntime);

      return {
        id: m.id,
        machine: m.name,
        tonnage: `${m.tonnage}T`,
        status: m.status,
        target: metrics.target,
        actual: metrics.actual,
        goodShots: metrics.goodShots,
        rejections: metrics.rejections,
        downtimeMinutes: metrics.downtimeMinutes,
        achievement: metrics.achievementPct,
        oee: metrics.hasData ? `${metrics.oeePct}%` : "N/A",
      };
    });
  }, [filteredRecords, filteredDowntime, machines]);

  // 3. OEE Report Data (Availability × Performance × Quality)
  const oeeReportData = useMemo(() => {
    return machines.map((m) => {
      const metrics = calculateMachineMetrics(m, filteredRecords, filteredDowntime);

      return {
        id: `oee-${m.id}`,
        machine: m.name,
        plannedMins: metrics.plannedMinutes,
        operatingMins: metrics.operatingMinutes,
        availability: metrics.hasData ? `${metrics.availabilityPct}%` : "N/A",
        performance: metrics.hasData ? `${metrics.performancePct}%` : "N/A",
        quality: metrics.hasData ? `${metrics.qualityPct}%` : "N/A",
        oee: metrics.hasData ? `${metrics.oeePct}%` : "N/A",
        status: !metrics.hasData ? "No Data" : (metrics.oeePct >= 75 ? "World Class" : "Standard"),
      };
    });
  }, [filteredRecords, filteredDowntime, machines]);

  // 4. Downtime Report Data
  const downtimeReportData = useMemo(() => {
    return filteredDowntime.map((d) => ({
      id: d.id,
      date: d.date,
      time: d.time,
      machine: d.machine,
      shift: d.shift,
      reason: d.reason,
      duration: d.duration,
      note: d.note,
    }));
  }, [filteredDowntime]);

  // 5. Quality Report Data
  const qualityReportData = useMemo(() => {
    return filteredRecords.map((r) => {
      const totalRej = r.operatorRejections + r.qaRejections;
      const rejRate = r.actual > 0 ? Number(((totalRej / r.actual) * 100).toFixed(1)) : 0;
      return {
        id: r.id,
        date: r.date,
        shift: r.shift,
        machine: r.machine,
        part: r.part,
        totalProduction: r.actual,
        goodShots: r.goodShots,
        operatorRejections: r.operatorRejections,
        qaRejections: r.qaRejections,
        totalRejections: totalRej,
        rejectionRate: `${rejRate}%`,
      };
    });
  }, [filteredRecords]);

  // 6. Operator Performance Report Data
  const operatorReportData = useMemo(() => {
    const map = new Map<string, {
      name: string;
      machine: Set<string>;
      shift: Set<string>;
      target: number;
      actual: number;
      rejections: number;
    }>();

    filteredRecords.forEach((r) => {
      const op = r.operator || "Operator";
      const existing = map.get(op) || {
        name: op,
        machine: new Set(),
        shift: new Set(),
        target: 0,
        actual: 0,
        rejections: 0,
      };
      existing.machine.add(r.machine);
      existing.shift.add(r.shift);
      existing.target += r.target;
      existing.actual += r.actual;
      existing.rejections += (r.operatorRejections + r.qaRejections);
      map.set(op, existing);
    });

    return Array.from(map.values()).map((o) => ({
      id: o.name,
      operator: o.name,
      machines: Array.from(o.machine).join(", "),
      shifts: Array.from(o.shift).join(", "),
      target: o.target,
      actual: o.actual,
      achievement: o.target > 0 ? `${((o.actual / o.target) * 100).toFixed(1)}%` : "0%",
      rejections: o.rejections,
    }));
  }, [filteredRecords]);

  // Generic CSV exporter
  const exportCurrentReport = (tab: string) => {
    const timestamp = Date.now();
    if (tab === "daily") {
      downloadCsv(dailySummaryData.map((d) => ({
        "Date": d.date,
        "Shifts": d.shifts,
        "Target": d.target,
        "Actual Production": d.actual,
        "Good Shots": d.goodShots,
        "Rejections": d.rejections,
        "Achievement %": `${d.achievement}%`,
        "Yield Rate %": `${d.yieldRate}%`,
      })), `hpdc-daily-production-summary-${timestamp}.csv`);
    } else if (tab === "machine") {
      downloadCsv(machineSummaryData.map((m) => ({
        "Machine": m.machine,
        "Tonnage": m.tonnage,
        "Status": m.status,
        "Target": m.target,
        "Actual Production": m.actual,
        "Good Shots": m.goodShots,
        "Rejections": m.rejections,
        "Downtime (mins)": m.downtimeMinutes,
        "Achievement %": `${m.achievement}%`,
        "OEE %": m.oee,
      })), `hpdc-machine-performance-summary-${timestamp}.csv`);
    } else if (tab === "oee") {
      downloadCsv(oeeReportData.map((o) => ({
        "Machine": o.machine,
        "Planned Time (mins)": o.plannedMins,
        "Operating Time (mins)": o.operatingMins,
        "Availability %": o.availability,
        "Performance %": o.performance,
        "Quality %": o.quality,
        "Overall OEE %": o.oee,
        "Benchmark": o.status,
      })), `hpdc-oee-report-${timestamp}.csv`);
    } else if (tab === "downtime") {
      downloadCsv(downtimeReportData.map((d) => ({
        "Date": d.date,
        "Time": d.time,
        "Machine": d.machine,
        "Shift": d.shift,
        "Downtime Reason": d.reason,
        "Duration (mins)": d.duration,
        "Diagnosis Note": d.note,
      })), `hpdc-downtime-report-${timestamp}.csv`);
    } else if (tab === "quality") {
      downloadCsv(qualityReportData.map((q) => ({
        "Date": q.date,
        "Shift": q.shift,
        "Machine": q.machine,
        "Part": q.part,
        "Total Shots": q.totalProduction,
        "Good Shots": q.goodShots,
        "Operator Rejections": q.operatorRejections,
        "QA Rejections": q.qaRejections,
        "Total Rejections": q.totalRejections,
        "Rejection Rate %": q.rejectionRate,
      })), `hpdc-quality-report-${timestamp}.csv`);
    } else if (tab === "operators") {
      downloadCsv(operatorReportData.map((op) => ({
        "Operator": op.operator,
        "Machines": op.machines,
        "Shifts": op.shifts,
        "Target": op.target,
        "Actual": op.actual,
        "Achievement %": op.achievement,
        "Rejections (pcs)": op.rejections,
      })), `hpdc-operator-performance-report-${timestamp}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manufacturing Reports & Audit"
        description="Comprehensive audit summaries for factory supervisors with direct CSV export capabilities."
        actions={
          <Button onClick={() => exportCurrentReport(activeTab)} size="sm" variant="default" className="gap-1.5 text-xs">
            <Download className="size-3.5" /> Export Selected Report CSV
          </Button>
        }
      />

      <FilterBar />

      {/* Tabs navigation for all 6 required reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted">
          <TabsTrigger value="daily" className="text-xs py-2">Daily Summary</TabsTrigger>
          <TabsTrigger value="machine" className="text-xs py-2">Machine Summary</TabsTrigger>
          <TabsTrigger value="oee" className="text-xs py-2">OEE Report</TabsTrigger>
          <TabsTrigger value="downtime" className="text-xs py-2">Downtime Report</TabsTrigger>
          <TabsTrigger value="quality" className="text-xs py-2">Quality Report</TabsTrigger>
          <TabsTrigger value="operators" className="text-xs py-2">Operator Report</TabsTrigger>
        </TabsList>

        {/* 1. Daily Production Summary Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Daily Production Summary</CardTitle>
                <p className="text-xs text-muted-foreground">Aggregated production, target, good shots, and scrap per date</p>
              </div>
              <Button onClick={() => exportCurrentReport("daily")} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Active Shifts</TableHead>
                    <TableHead className="text-xs text-right">Target</TableHead>
                    <TableHead className="text-xs text-right">Actual Output</TableHead>
                    <TableHead className="text-xs text-right">Good Shots</TableHead>
                    <TableHead className="text-xs text-right">Scrap (pcs)</TableHead>
                    <TableHead className="text-xs text-right">Achievement %</TableHead>
                    <TableHead className="text-xs text-right">Yield Rate %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySummaryData.map((d) => (
                    <TableRow key={d.date}>
                      <TableCell className="font-semibold text-xs">{formatDate(d.date)}</TableCell>
                      <TableCell className="text-xs">{d.shifts}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{formatNumber(d.target)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold">{formatNumber(d.actual)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-emerald-600 font-semibold">{formatNumber(d.goodShots)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-destructive">{d.rejections}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold text-primary">{d.achievement}%</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{d.yieldRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Machine Performance Summary Tab */}
        <TabsContent value="machine" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Machine Performance Summary</CardTitle>
                <p className="text-xs text-muted-foreground">Output, downtime minutes, scrap parts, and OEE by casting machine</p>
              </div>
              <Button onClick={() => exportCurrentReport("machine")} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Machine</TableHead>
                    <TableHead className="text-xs">Tonnage</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Target</TableHead>
                    <TableHead className="text-xs text-right">Actual Output</TableHead>
                    <TableHead className="text-xs text-right">Good Shots</TableHead>
                    <TableHead className="text-xs text-right">Downtime</TableHead>
                    <TableHead className="text-xs text-right">Achievement %</TableHead>
                    <TableHead className="text-xs text-right">OEE %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineSummaryData.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold text-xs">{m.machine}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.tonnage}</TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{formatNumber(m.target)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold">{formatNumber(m.actual)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-emerald-600 font-semibold">{formatNumber(m.goodShots)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-destructive font-medium">{m.downtimeMinutes}m</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold text-primary">{m.achievement}%</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-semibold">{m.oee}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. OEE Report Tab */}
        <TabsContent value="oee" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">OEE (Overall Equipment Effectiveness) Report</CardTitle>
                <p className="text-xs text-muted-foreground">Standard TPM breakdown: Availability × Performance × Quality</p>
              </div>
              <Button onClick={() => exportCurrentReport("oee")} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Machine Cell</TableHead>
                    <TableHead className="text-xs text-right">Planned (min)</TableHead>
                    <TableHead className="text-xs text-right">Operating (min)</TableHead>
                    <TableHead className="text-xs text-right">Availability (A)</TableHead>
                    <TableHead className="text-xs text-right">Performance (P)</TableHead>
                    <TableHead className="text-xs text-right">Quality (Q)</TableHead>
                    <TableHead className="text-xs text-right">Overall OEE</TableHead>
                    <TableHead className="text-xs text-center">Benchmark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oeeReportData.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-semibold text-xs">{o.machine}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{o.plannedMins}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-medium">{o.operatingMins}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{o.availability}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{o.performance}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-emerald-600 font-medium">{o.quality}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold text-primary">{o.oee}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[11px] font-normal">{o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Downtime Report Tab */}
        <TabsContent value="downtime" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Downtime Stoppage Audit Report</CardTitle>
                <p className="text-xs text-muted-foreground">Every recorded event with reason taxonomy and diagnosis</p>
              </div>
              <Button onClick={() => exportCurrentReport("downtime")} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Timestamp</TableHead>
                    <TableHead className="text-xs">Machine</TableHead>
                    <TableHead className="text-xs">Shift</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                    <TableHead className="text-xs text-right">Duration (min)</TableHead>
                    <TableHead className="text-xs">Diagnosis Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downtimeReportData.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.date} {d.time}</TableCell>
                      <TableCell className="text-xs font-semibold">{d.machine}</TableCell>
                      <TableCell className="text-xs">{d.shift}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{d.reason}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold text-destructive">{d.duration} mins</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{d.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Quality Report Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Quality & Rejection Scrap Report</CardTitle>
                <p className="text-xs text-muted-foreground">Visual operator scrap vs QA rejection breakdown per part item</p>
              </div>
              <Button onClick={() => exportCurrentReport("quality")} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Time & Shift</TableHead>
                    <TableHead className="text-xs">Machine</TableHead>
                    <TableHead className="text-xs">Part Code</TableHead>
                    <TableHead className="text-xs text-right">Actual</TableHead>
                    <TableHead className="text-xs text-right">Good Shots</TableHead>
                    <TableHead className="text-xs text-right">Operator Scrap</TableHead>
                    <TableHead className="text-xs text-right">QA Scrap</TableHead>
                    <TableHead className="text-xs text-right">Rejection Rate %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualityReportData.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs font-mono">{q.date} {q.shift}</TableCell>
                      <TableCell className="text-xs font-semibold">{q.machine}</TableCell>
                      <TableCell className="text-xs font-mono">{q.part}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{formatNumber(q.totalProduction)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-emerald-600 font-semibold">{formatNumber(q.goodShots)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-amber-600">{q.operatorRejections}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-destructive">{q.qaRejections}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold">{q.rejectionRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Operator Performance Report Tab */}
        <TabsContent value="operators" className="space-y-4">
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Operator Performance & Attainment Report</CardTitle>
                <p className="text-xs text-muted-foreground">Individual operator output, assigned cells, target ratio, and scrap counts</p>
              </div>
              <Button onClick={() => exportCurrentReport("operators")} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Operator Name</TableHead>
                    <TableHead className="text-xs">Assigned Machine</TableHead>
                    <TableHead className="text-xs">Shift</TableHead>
                    <TableHead className="text-xs text-right">Target</TableHead>
                    <TableHead className="text-xs text-right">Actual Production</TableHead>
                    <TableHead className="text-xs text-right">Achievement %</TableHead>
                    <TableHead className="text-xs text-right">Rejections</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorReportData.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="text-xs font-semibold">{op.operator}</TableCell>
                      <TableCell className="text-xs">{op.machines}</TableCell>
                      <TableCell className="text-xs">{op.shifts}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{formatNumber(op.target)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold">{formatNumber(op.actual)}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs font-bold text-primary">{op.achievement}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-destructive font-medium">{op.rejections} pcs</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
