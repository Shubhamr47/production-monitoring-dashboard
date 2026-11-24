import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Clock,
  ClockAlert,
  Download,
  Flame,
  Layers,
  Power,
  RotateCcw,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
} from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DowntimeEvent } from "@/lib/production-data";

export const Route = createFileRoute("/downtime")({
  component: DowntimePage,
});

const REASON_COLORS: Record<string, string> = {
  "Die Setup": "#3b82f6",
  "Die Problems": "#ef4444",
  "Preheating": "#f59e0b",
  "Spray Gun Problems": "#8b5cf6",
  "Power Cut": "#ec4899",
  "Hydraulic Fault": "#f97316",
  "Maintenance": "#64748b",
};

function getReasonColor(reason: string): string {
  return REASON_COLORS[reason] || "#0ea5e9";
}

function DowntimePage() {
  const { filteredDowntime, machines, kpis } = useProductionData();

  // Downtime by Machine Chart Data
  const machineDowntimeData = useMemo(() => {
    return machines.map((m) => {
      const events = filteredDowntime.filter((d) => d.machineId === m.id);
      const totalMins = events.reduce((sum, d) => sum + d.duration, 0);
      return {
        name: m.name,
        duration: totalMins,
        eventCount: events.length,
      };
    });
  }, [filteredDowntime, machines]);

  // Downtime by Reason Chart Data
  const reasonDowntimeData = useMemo(() => {
    const reasonMap = new Map<string, { reason: string; duration: number; count: number }>();
    filteredDowntime.forEach((d) => {
      const existing = reasonMap.get(d.reason) || { reason: d.reason, duration: 0, count: 0 };
      existing.duration += d.duration;
      existing.count += 1;
      reasonMap.set(d.reason, existing);
    });
    return Array.from(reasonMap.values()).sort((a, b) => b.duration - a.duration);
  }, [filteredDowntime]);

  const topReason = reasonDowntimeData[0]?.reason || "None";
  const worstMachine = [...machineDowntimeData].sort((a, b) => b.duration - a.duration)[0]?.name || "None";

  // Table columns
  const columns = useMemo(() => [
    {
      key: "time" as keyof DowntimeEvent,
      label: "Time",
      render: (d: DowntimeEvent) => <span className="font-mono text-xs font-semibold">{d.time}</span>,
      sortValue: (d: DowntimeEvent) => d.time,
    },
    {
      key: "date" as keyof DowntimeEvent,
      label: "Date",
      render: (d: DowntimeEvent) => <span className="text-xs text-muted-foreground">{d.date}</span>,
      sortValue: (d: DowntimeEvent) => d.date,
    },
    {
      key: "machine" as keyof DowntimeEvent,
      label: "Machine",
      render: (d: DowntimeEvent) => <Badge variant="outline">{d.machine}</Badge>,
      sortValue: (d: DowntimeEvent) => d.machine,
    },
    {
      key: "shift" as keyof DowntimeEvent,
      label: "Shift",
      sortValue: (d: DowntimeEvent) => d.shift,
    },
    {
      key: "reason" as keyof DowntimeEvent,
      label: "Downtime Reason",
      render: (d: DowntimeEvent) => (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${getReasonColor(d.reason)}15`,
            color: getReasonColor(d.reason),
            border: `1px solid ${getReasonColor(d.reason)}30`,
          }}
        >
          {d.reason}
        </span>
      ),
      sortValue: (d: DowntimeEvent) => d.reason,
    },
    {
      key: "duration" as keyof DowntimeEvent,
      label: "Duration",
      render: (d: DowntimeEvent) => (
        <span className="font-bold tabular-nums text-foreground">{d.duration} mins</span>
      ),
      sortValue: (d: DowntimeEvent) => d.duration,
    },
    {
      key: "note" as keyof DowntimeEvent,
      label: "Root Cause & Diagnosis Note",
      render: (d: DowntimeEvent) => <span className="text-xs text-muted-foreground">{d.note}</span>,
      sortValue: (d: DowntimeEvent) => d.note,
    },
  ], []);

  const handleExport = () => {
    const rows = filteredDowntime.map((d) => ({
      "Date": d.date,
      "Time": d.time,
      "Machine": d.machine,
      "Shift": d.shift,
      "Downtime Reason": d.reason,
      "Duration (Minutes)": d.duration,
      "Diagnosis Note": d.note,
    }));
    downloadCsv(rows, `hpdc-downtime-records-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Downtime & Stoppage Analysis"
        description="Root cause breakdown, die changes, preheating cycles, power trips, and spray malfunction telemetry."
        actions={
          <Button onClick={handleExport} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Download className="size-3.5" /> Export Downtime CSV
          </Button>
        }
      />

      <FilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total Downtime"
          value={`${kpis.totalDowntimeMinutes} min`}
          detail={`${(kpis.totalDowntimeMinutes / 60).toFixed(1)} operating hours lost`}
          icon={ClockAlert}
          accent="danger"
        />
        <MetricCard
          label="Total Stoppages"
          value={String(filteredDowntime.length)}
          detail={`Avg ${(kpis.totalDowntimeMinutes / (filteredDowntime.length || 1)).toFixed(0)} min/event`}
          icon={AlertTriangle}
          accent="warning"
        />
        <MetricCard
          label="Primary Cause"
          value={topReason}
          detail="Most frequent downtime category"
          icon={Wrench}
          accent="info"
        />
        <MetricCard
          label="Most Affected Cell"
          value={worstMachine}
          detail="Requires priority attention"
          icon={Clock}
          accent="warning"
        />
      </div>

      {/* Downtime Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Downtime by Machine */}
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Downtime Duration by Machine</CardTitle>
            <p className="text-xs text-muted-foreground">Cumulative lost minutes per HPDC press cell</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={machineDowntimeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                    formatter={(val) => [`${val} minutes`, "Downtime"]}
                  />
                  <Bar dataKey="duration" name="Downtime (mins)" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Downtime Reasons Distribution */}
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Downtime Reasons Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Die setup, die problems, preheating, spray gun, power cuts</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reasonDowntimeData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="reason" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                    formatter={(val) => [`${val} mins`, "Total Duration"]}
                  />
                  <Bar dataKey="duration" name="Minutes Lost" radius={[0, 4, 4, 0]}>
                    {reasonDowntimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getReasonColor(entry.reason)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Downtime Records Table */}
      <DataTable
        title="Detailed Downtime Stoppage Records"
        description="Filterable audit log with exact reasons, timestamps, and maintenance notes."
        rows={filteredDowntime}
        columns={columns}
        searchPlaceholder="Search reason, note, machine, time..."
        filename="hpdc-downtime-records.csv"
        searchValue={(d) => `${d.reason} ${d.machine} ${d.note} ${d.shift} ${d.time}`}
      />
    </div>
  );
}
