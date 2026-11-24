import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  CheckCircle2,
  Download,
  HardHat,
  Percent,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useProductionData } from "@/context/production-data-context";
import {
  DataTable,
  FilterBar,
  MetricCard,
  PageHeading,
  downloadCsv,
  formatNumber,
} from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/operators")({
  component: OperatorsPage,
});

type OperatorMetric = {
  id: string;
  name: string;
  assignedMachine: string;
  shift: string;
  target: number;
  actual: number;
  goodShots: number;
  rejections: number;
  achievementPct: number;
  qualityPct: number;
};

function OperatorsPage() {
  const { filteredRecords } = useProductionData();

  // Aggregate by operator
  const operatorData = useMemo(() => {
    const map = new Map<string, {
      name: string;
      machines: Set<string>;
      shifts: Set<string>;
      target: number;
      actual: number;
      goodShots: number;
      opRej: number;
      qaRej: number;
    }>();

    filteredRecords.forEach((r) => {
      const op = r.operator || "Unknown Operator";
      const existing = map.get(op) || {
        name: op,
        machines: new Set<string>(),
        shifts: new Set<string>(),
        target: 0,
        actual: 0,
        goodShots: 0,
        opRej: 0,
        qaRej: 0,
      };

      existing.machines.add(r.machine);
      existing.shifts.add(r.shift);
      existing.target += r.target;
      existing.actual += r.actual;
      existing.goodShots += r.goodShots;
      existing.opRej += r.operatorRejections;
      existing.qaRej += r.qaRejections;
      map.set(op, existing);
    });

    const list: OperatorMetric[] = [];
    map.forEach((item, name) => {
      const rejections = item.opRej + item.qaRej;
      const achievementPct = item.target > 0 ? Number(((item.actual / item.target) * 100).toFixed(1)) : 0;
      const qualityPct = item.actual > 0 ? Number(((item.goodShots / item.actual) * 100).toFixed(1)) : 0;

      list.push({
        id: `op-${name.toLowerCase().replace(/\s+/g, "-")}`,
        name,
        assignedMachine: Array.from(item.machines).join(", "),
        shift: Array.from(item.shifts).join(", "),
        target: item.target,
        actual: item.actual,
        goodShots: item.goodShots,
        rejections,
        achievementPct,
        qualityPct,
      });
    });

    return list.sort((a, b) => b.achievementPct - a.achievementPct);
  }, [filteredRecords]);

  // Overall statistics
  const topPerformer = operatorData[0]?.name || "N/A";
  const avgAchievement = operatorData.length > 0
    ? (operatorData.reduce((sum, o) => sum + o.achievementPct, 0) / operatorData.length).toFixed(1)
    : "0.0";
  const totalOpActual = operatorData.reduce((sum, o) => sum + o.actual, 0);

  const columns = useMemo(() => [
    {
      key: "name" as keyof OperatorMetric,
      label: "Operator Name",
      render: (o: OperatorMetric) => (
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {o.name.split(" ").map((n) => n[0]).join("")}
          </span>
          <span className="font-semibold text-foreground">{o.name}</span>
        </div>
      ),
      sortValue: (o: OperatorMetric) => o.name,
    },
    {
      key: "assignedMachine" as keyof OperatorMetric,
      label: "Assigned Machine",
      render: (o: OperatorMetric) => (
        <span className="text-xs font-medium">{o.assignedMachine}</span>
      ),
      sortValue: (o: OperatorMetric) => o.assignedMachine,
    },
    {
      key: "shift" as keyof OperatorMetric,
      label: "Shift",
      render: (o: OperatorMetric) => <Badge variant="secondary" className="text-xs">{o.shift}</Badge>,
      sortValue: (o: OperatorMetric) => o.shift,
    },
    {
      key: "target" as keyof OperatorMetric,
      label: "Production Target",
      render: (o: OperatorMetric) => <span className="tabular-nums font-medium text-muted-foreground">{formatNumber(o.target)}</span>,
      sortValue: (o: OperatorMetric) => o.target,
    },
    {
      key: "actual" as keyof OperatorMetric,
      label: "Actual Production",
      render: (o: OperatorMetric) => <span className="tabular-nums font-bold text-foreground">{formatNumber(o.actual)}</span>,
      sortValue: (o: OperatorMetric) => o.actual,
    },
    {
      key: "achievementPct" as keyof OperatorMetric,
      label: "Achievement %",
      render: (o: OperatorMetric) => (
        <span className={`tabular-nums font-bold ${o.achievementPct >= 90 ? "text-primary" : "text-amber-600"}`}>
          {o.achievementPct}%
        </span>
      ),
      sortValue: (o: OperatorMetric) => o.achievementPct,
    },
    {
      key: "rejections" as keyof OperatorMetric,
      label: "Rejections",
      render: (o: OperatorMetric) => (
        <span className="tabular-nums font-medium text-destructive">{o.rejections} pcs</span>
      ),
      sortValue: (o: OperatorMetric) => o.rejections,
    },
    {
      key: "qualityPct" as keyof OperatorMetric,
      label: "Yield Score",
      render: (o: OperatorMetric) => (
        <span className="tabular-nums text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {o.qualityPct}%
        </span>
      ),
      sortValue: (o: OperatorMetric) => o.qualityPct,
    },
  ], []);

  const handleExport = () => {
    const rows = operatorData.map((o) => ({
      "Operator Name": o.name,
      "Assigned Machine": o.assignedMachine,
      "Shift": o.shift,
      "Production Target": o.target,
      "Actual Production": o.actual,
      "Achievement %": `${o.achievementPct}%`,
      "Rejections (pcs)": o.rejections,
      "Yield Score %": `${o.qualityPct}%`,
    }));
    downloadCsv(rows, `hpdc-operator-performance-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Shift Operator Performance"
        description="Individual casting efficiency, output volume, target attainment, and scrap accountability per machine cell."
        actions={
          <Button onClick={handleExport} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Download className="size-3.5" /> Export Operator CSV
          </Button>
        }
      />

      <FilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Active Operators"
          value={String(operatorData.length)}
          detail="On plant floor roster"
          icon={Users}
          accent="primary"
        />
        <MetricCard
          label="Top Performer"
          value={topPerformer}
          detail="Highest target attainment"
          icon={Award}
          accent="primary"
        />
        <MetricCard
          label="Average Achievement"
          value={`${avgAchievement}%`}
          detail="Across active shifts"
          icon={TrendingUp}
          accent="info"
        />
        <MetricCard
          label="Operator Total Cast"
          value={formatNumber(totalOpActual)}
          detail="Verified finished shots"
          icon={UserCheck}
          accent="primary"
        />
      </div>

      {/* Operator Target vs Actual Chart */}
      <Card className="rounded-md border-border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Operator Production Attainment</CardTitle>
          <p className="text-xs text-muted-foreground">Target vs Actual shots produced per shift operator</p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operatorData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                />
                <Bar dataKey="target" name="Target (pcs)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual (pcs)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Operator Searchable Performance Table */}
      <DataTable
        title="Operator Productivity Leaderboard"
        description="Filterable operator efficiency table showing assigned press, shift, target, and rejections."
        rows={operatorData}
        columns={columns}
        searchPlaceholder="Search operator name, machine, shift..."
        filename="hpdc-operator-performance.csv"
        searchValue={(o) => `${o.name} ${o.assignedMachine} ${o.shift}`}
      />
    </div>
  );
}
