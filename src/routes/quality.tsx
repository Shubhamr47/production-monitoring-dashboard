import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertOctagon,
  Boxes,
  CheckCircle,
  CheckCircle2,
  Download,
  Percent,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  UserX,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { useProductionData } from "@/context/production-data-context";
import {
  DataTable,
  FilterBar,
  MetricCard,
  PageHeading,
  downloadCsv,
  formatNumber,
  formatPercent,
} from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductionRecord } from "@/lib/production-data";

export const Route = createFileRoute("/quality")({
  component: QualityPage,
});

function QualityPage() {
  const { filteredRecords, machines, kpis } = useProductionData();

  // Machine-wise rejection data
  const machineRejectionData = useMemo(() => {
    return machines.map((m) => {
      const records = filteredRecords.filter((r) => r.machineId === m.id);
      const opRej = records.reduce((sum, r) => sum + r.operatorRejections, 0);
      const qaRej = records.reduce((sum, r) => sum + r.qaRejections, 0);
      const totalRej = opRej + qaRej;
      const actual = records.reduce((sum, r) => sum + r.actual, 0);
      const rate = actual > 0 ? Number(((totalRej / actual) * 100).toFixed(1)) : 0;

      return {
        name: m.name,
        operatorRejections: opRej,
        qaRejections: qaRej,
        totalRejections: totalRej,
        actual,
        rate,
      };
    });
  }, [filteredRecords, machines]);

  // Hourly Rejection Trends
  const rejectionTrends = useMemo(() => {
    const map = new Map<string, { time: string; opRej: number; qaRej: number; good: number }>();
    filteredRecords.forEach((r) => {
      const existing = map.get(r.time) || { time: r.time, opRej: 0, qaRej: 0, good: 0 };
      existing.opRej += r.operatorRejections;
      existing.qaRej += r.qaRejections;
      existing.good += r.goodShots;
      map.set(r.time, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredRecords]);

  // Table columns
  const columns = useMemo(() => [
    {
      key: "time" as keyof ProductionRecord,
      label: "Time Slot",
      render: (r: ProductionRecord) => <span className="font-semibold text-xs font-mono">{r.time}</span>,
      sortValue: (r: ProductionRecord) => r.time,
    },
    {
      key: "machine" as keyof ProductionRecord,
      label: "Machine",
      render: (r: ProductionRecord) => <Badge variant="outline">{r.machine}</Badge>,
      sortValue: (r: ProductionRecord) => r.machine,
    },
    {
      key: "part" as keyof ProductionRecord,
      label: "Part / Item Code",
      render: (r: ProductionRecord) => <span className="truncate text-xs font-mono">{r.part}</span>,
      sortValue: (r: ProductionRecord) => r.part,
    },
    {
      key: "actual" as keyof ProductionRecord,
      label: "Total Shots",
      render: (r: ProductionRecord) => <span className="tabular-nums font-medium">{formatNumber(r.actual)}</span>,
      sortValue: (r: ProductionRecord) => r.actual,
    },
    {
      key: "goodShots" as keyof ProductionRecord,
      label: "Good Shots",
      render: (r: ProductionRecord) => (
        <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
          {formatNumber(r.goodShots)}
        </span>
      ),
      sortValue: (r: ProductionRecord) => r.goodShots,
    },
    {
      key: "operatorRejections" as keyof ProductionRecord,
      label: "Operator Rej.",
      render: (r: ProductionRecord) => (
        <span className="tabular-nums font-medium text-amber-600">{r.operatorRejections}</span>
      ),
      sortValue: (r: ProductionRecord) => r.operatorRejections,
    },
    {
      key: "qaRejections" as keyof ProductionRecord,
      label: "QA Rej.",
      render: (r: ProductionRecord) => (
        <span className="tabular-nums font-medium text-destructive">{r.qaRejections}</span>
      ),
      sortValue: (r: ProductionRecord) => r.qaRejections,
    },
    {
      key: "id" as keyof ProductionRecord,
      label: "Rejection %",
      render: (r: ProductionRecord) => {
        const rej = r.operatorRejections + r.qaRejections;
        const rate = r.actual > 0 ? (rej / r.actual) * 100 : 0;
        return (
          <span className={`tabular-nums font-semibold ${rate > 3.0 ? "text-destructive" : "text-foreground"}`}>
            {rate.toFixed(1)}%
          </span>
        );
      },
      sortValue: (r: ProductionRecord) => {
        const rej = r.operatorRejections + r.qaRejections;
        return r.actual > 0 ? rej / r.actual : 0;
      },
    },
    {
      key: "operator" as keyof ProductionRecord,
      label: "Inspected By / Operator",
      sortValue: (r: ProductionRecord) => r.operator,
    },
  ], []);

  const handleExport = () => {
    const rows = filteredRecords.map((r) => {
      const rej = r.operatorRejections + r.qaRejections;
      const rate = r.actual > 0 ? ((rej / r.actual) * 100).toFixed(1) : "0.0";
      return {
        "Date": r.date,
        "Time": r.time,
        "Machine": r.machine,
        "Part": r.part,
        "Total Production": r.actual,
        "Good Production": r.goodShots,
        "Operator Rejections": r.operatorRejections,
        "QA Rejections": r.qaRejections,
        "Total Rejections": rej,
        "Rejection Rate %": `${rate}%`,
        "Operator": r.operator,
      };
    });
    downloadCsv(rows, `hpdc-quality-report-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Quality & Defect Telemetry"
        description="Comprehensive QA scrap analysis, visual inspection rejects, porosity verification, and machine rejection rates."
        actions={
          <Button onClick={handleExport} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Download className="size-3.5" /> Export Quality CSV
          </Button>
        }
      />

      <FilterBar />

      {/* 6 Key Quality KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Total Production"
          value={formatNumber(kpis.totalProduction)}
          detail="Total shots cast"
          icon={Boxes}
          accent="primary"
        />
        <MetricCard
          label="Good Production"
          value={formatNumber(kpis.goodShots)}
          detail={`${((kpis.goodShots / (kpis.totalProduction || 1)) * 100).toFixed(1)}% Yield`}
          icon={CheckCircle2}
          accent="primary"
        />
        <MetricCard
          label="Rejected Production"
          value={formatNumber(kpis.totalRejections)}
          detail="Scrap parts total"
          icon={AlertOctagon}
          accent="danger"
        />
        <MetricCard
          label="Rejection Rate"
          value={`${kpis.rejectionRate}%`}
          detail="Standard Target: < 2.5%"
          icon={Percent}
          accent={kpis.rejectionRate > 2.5 ? "danger" : "primary"}
        />
        <MetricCard
          label="Operator Rejections"
          value={formatNumber(kpis.operatorRejections)}
          detail="Visual & cold shut"
          icon={UserX}
          accent="warning"
        />
        <MetricCard
          label="QA Rejections"
          value={formatNumber(kpis.qaRejections)}
          detail="Porosity & dimensional"
          icon={ShieldAlert}
          accent="danger"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Machine-wise Rejection Chart */}
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Machine-wise Rejection Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Operator visual scrap vs QA laboratory rejections per machine</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineRejectionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="operatorRejections" name="Operator Scrap (pcs)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qaRejections" name="QA Rejection (pcs)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quality Defect Breakdown per Hour */}
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Defect Volume Trend by Time Slot</CardTitle>
            <p className="text-xs text-muted-foreground">Hourly occurrence of scrap casting events</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rejectionTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="opRej" name="Operator Rejections" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="qaRej" name="QA Rejections" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rejection Inspection Table */}
      <DataTable
        title="Quality Inspection Log"
        description="Detailed record of shots, good castings, and scrap classification per shift."
        rows={filteredRecords}
        columns={columns}
        searchPlaceholder="Search machine, part, operator..."
        filename="hpdc-quality-records.csv"
        searchValue={(r) => `${r.machine} ${r.part} ${r.operator} ${r.time} ${r.shift}`}
      />
    </div>
  );
}
