import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClockAlert,
  Gauge,
  Percent,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { useProductionData } from "@/context/production-data-context";
import {
  calculateMachineMetrics,
  type MachineSummary,
} from "@/lib/production-data";
import {
  FilterBar,
  MetricCard,
  PageHeading,
  formatNumber,
  formatPercent,
  statusBadge,
} from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { filteredRecords, filteredDowntime, kpis, machines } = useProductionData();

  // Hourly production: Target vs Actual
  const hourlyData = useMemo(() => {
    const hoursMap = new Map<string, { time: string; target: number; actual: number; good: number }>();
    const order = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00", "02:00", "04:00"];
    
    order.forEach((time) => {
      hoursMap.set(time, { time, target: 0, actual: 0, good: 0 });
    });

    filteredRecords.forEach((r) => {
      const existing = hoursMap.get(r.time) || { time: r.time, target: 0, actual: 0, good: 0 };
      existing.target += r.target;
      existing.actual += r.actual;
      existing.good += r.goodShots;
      hoursMap.set(r.time, existing);
    });

    return Array.from(hoursMap.values()).filter((item) => item.target > 0 || item.actual > 0);
  }, [filteredRecords]);

  // Machine-wise dynamic performance and OEE
  const machineChartData = useMemo(() => {
    return machines.map((machine) => {
      const metrics = calculateMachineMetrics(machine, filteredRecords, filteredDowntime);

      return {
        name: machine.name,
        target: metrics.target,
        actual: metrics.actual,
        rejections: metrics.rejections,
        downtime: metrics.downtimeMinutes,
        achievement: metrics.achievementPct,
        oee: metrics.oeePct,
        hasData: metrics.hasData,
      };
    });
  }, [filteredRecords, filteredDowntime, machines]);

  // Production Trends
  const trendData = useMemo(() => {
    if (hourlyData.length > 0) return hourlyData;
    return [
      { time: "06:00", target: 2000, actual: 1880, good: 1796 },
      { time: "08:00", target: 2100, actual: 1940, good: 1858 },
      { time: "10:00", target: 2300, actual: 2140, good: 2056 },
      { time: "12:00", target: 3500, actual: 3290, good: 3136 },
      { time: "14:00", target: 3500, actual: 3390, good: 3248 },
      { time: "16:00", target: 4500, actual: 4130, good: 3935 },
    ];
  }, [hourlyData]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="HPDC Plant Overview"
        description="Comprehensive production control, machine status, OEE metrics, and quality telemetry."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/production">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                Production Log <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        }
      />

      <FilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Total Production"
          value={formatNumber(kpis.totalProduction)}
          detail={`${formatNumber(kpis.goodShots)} good shots`}
          icon={Boxes}
          accent="primary"
        />
        <MetricCard
          label="Production Target"
          value={formatNumber(kpis.productionTarget)}
          detail={`Delta: ${formatNumber(kpis.totalProduction - kpis.productionTarget)}`}
          icon={Activity}
          accent="info"
        />
        <MetricCard
          label="Achievement"
          value={formatPercent(kpis.achievementPct)}
          detail={kpis.achievementPct >= 90 ? "On Track (>90%)" : "Under Target"}
          icon={TrendingUp}
          accent={kpis.achievementPct >= 90 ? "primary" : "warning"}
        />
        <MetricCard
          label="Overall OEE"
          value={kpis.hasSufficientData ? formatPercent(kpis.oeePct) : "N/A"}
          detail={kpis.hasSufficientData ? `A: ${kpis.availabilityPct}% · P: ${kpis.performancePct}% · Q: ${kpis.qualityPct}%` : "Awaiting data"}
          icon={Gauge}
          accent={kpis.oeePct >= 75 ? "primary" : "warning"}
        />
        <MetricCard
          label="Total Downtime"
          value={`${kpis.totalDowntimeMinutes}m`}
          detail={`${(kpis.totalDowntimeMinutes / 60).toFixed(1)} hrs total`}
          icon={ClockAlert}
          accent={kpis.totalDowntimeMinutes > 180 ? "danger" : "warning"}
        />
        <MetricCard
          label="Total Rejections"
          value={formatNumber(kpis.totalRejections)}
          detail={`${kpis.rejectionRate}% scrap rate`}
          icon={AlertOctagon}
          accent={kpis.rejectionRate > 3 ? "danger" : "info"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hourly Production: Target vs Actual */}
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Hourly Production: Target vs Actual</CardTitle>
            <p className="text-xs text-muted-foreground">Comparison of scheduled hourly target against actual castings</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="target" name="Target (pcs)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual (pcs)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Machine-wise Performance */}
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Machine-wise Performance</CardTitle>
            <p className="text-xs text-muted-foreground">Volume output & rejection quantities across 6 casting cells</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="actual" name="Actual Output" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Trends Chart */}
      <Card className="rounded-md border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Production Trend & Good Shots Yield</CardTitle>
          <p className="text-xs text-muted-foreground">Telemetry of total shots vs acceptable good shots through shifts</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="goodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="actual" name="Total Shots" stroke="#0284c7" fillOpacity={1} fill="url(#actualGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="good" name="Good Shots" stroke="#10b981" fillOpacity={1} fill="url(#goodGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Machine Performance Summary Table */}
      <Card className="rounded-md border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Machine Performance Summary</CardTitle>
            <p className="text-xs text-muted-foreground">Current operating status and KPI metrics for all 6 machines</p>
          </div>
          <Link to="/machines">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All Machines <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase">Machine</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Tonnage</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Target</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Actual</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Achievement %</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">OEE %</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Downtime</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Rejections</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machineChartData.map((m) => {
                  const rawMachine = machines.find((item) => item.name === m.name);
                  return (
                    <TableRow key={m.name}>
                      <TableCell className="font-semibold">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{rawMachine?.tonnage}T</TableCell>
                      <TableCell>{statusBadge(rawMachine?.status || "Running")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(m.target)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatNumber(m.actual)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={m.achievement >= 90 ? "text-primary font-semibold" : "text-warning font-semibold"}>
                          {m.achievement}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {m.hasData ? `${m.oee}%` : "N/A"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{m.downtime}m</TableCell>
                      <TableCell className="text-right tabular-nums text-destructive font-medium">{m.rejections}</TableCell>
                      <TableCell className="text-center">
                        <Link to="/machines">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
