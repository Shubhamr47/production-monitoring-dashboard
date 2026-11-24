import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClockAlert,
  Cpu,
  Flame,
  Gauge,
  Sliders,
  Sparkles,
  Thermometer,
  Wrench,
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
  FilterBar,
  PageHeading,
  formatNumber,
  formatPercent,
  statusBadge,
} from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  calculateMachineMetrics,
  type MachineSummary,
} from "@/lib/production-data";

export const Route = createFileRoute("/machines")({
  component: MachinesPage,
});

function MachinesPage() {
  const { machines, filteredRecords, filteredDowntime } = useProductionData();
  const [selectedMachine, setSelectedMachine] = useState<MachineSummary | null>(null);

  return (
    <div className="space-y-6">
      <PageHeading
        title="HPDC Machine Cells"
        description="Real-time cell operational status, tonnage capacity, OEE metrics, and downtime diagnostics."
      />

      <FilterBar />

      {/* 6 Machine Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {machines.map((machine) => {
          const metrics = calculateMachineMetrics(machine, filteredRecords, filteredDowntime);

          return (
            <Card
              key={machine.id}
              className="cursor-pointer rounded-lg border-border transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => setSelectedMachine(machine)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary font-bold text-sm">
                    {machine.name}
                  </span>
                  <div>
                    <CardTitle className="text-base font-semibold">{machine.name} HPDC</CardTitle>
                    <p className="text-xs text-muted-foreground">{machine.tonnage} Metric Tonnes</p>
                  </div>
                </div>
                {statusBadge(machine.status)}
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                {/* 6 required metrics per card */}
                <div className="grid grid-cols-3 gap-2.5 rounded-md bg-muted/40 p-3 text-center">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Production</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-foreground">{formatNumber(metrics.actual)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Target</p>
                    <p className="mt-1 text-base font-medium tabular-nums text-muted-foreground">{formatNumber(metrics.target)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase">Achievement</p>
                    <p className={`mt-1 text-base font-bold tabular-nums ${metrics.achievementPct >= 90 ? "text-primary" : "text-amber-600"}`}>
                      {metrics.achievementPct.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded border border-border p-2">
                    <p className="text-[11px] text-muted-foreground">OEE Rate</p>
                    <p className="mt-0.5 font-bold text-foreground">
                      {metrics.hasData ? `${metrics.oeePct}%` : "N/A"}
                    </p>
                  </div>
                  <div className="rounded border border-border p-2">
                    <p className="text-[11px] text-muted-foreground">Downtime</p>
                    <p className={`mt-0.5 font-semibold ${metrics.downtimeMinutes > 45 ? "text-destructive" : "text-foreground"}`}>
                      {metrics.downtimeMinutes} min
                    </p>
                  </div>
                  <div className="rounded border border-border p-2">
                    <p className="text-[11px] text-muted-foreground">Rejections</p>
                    <p className="mt-0.5 font-semibold text-destructive">{metrics.rejections} pcs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Sliders className="size-3" /> {machine.dieCode}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-primary">
                    View Details <ArrowRight className="size-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Machine Inspection Dialog */}
      {selectedMachine && (
        <Dialog open={!!selectedMachine} onOpenChange={(open) => !open && setSelectedMachine(null)}>
          <DialogContent className="max-h-[90vh] w-[min(94vw,56rem)] max-w-[56rem] overflow-y-auto rounded-lg p-6">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                    {selectedMachine.name}
                  </span>
                  <div>
                    <DialogTitle className="text-xl font-bold">
                      {selectedMachine.name} HPDC Machine Details
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {selectedMachine.tonnage}T Clamping Force · Die Tooling: {selectedMachine.dieCode}
                    </DialogDescription>
                  </div>
                </div>
                {statusBadge(selectedMachine.status)}
              </div>
            </DialogHeader>

            {/* Machine Specs & Parameters */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-4">
              <div className="flex items-center gap-2.5">
                <Gauge className="size-5 text-primary" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Clamping Force</p>
                  <p className="text-sm font-semibold">{selectedMachine.clampingForce}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Sliders className="size-5 text-indigo-500" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Platen Size</p>
                  <p className="text-sm font-semibold">{selectedMachine.platenSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Flame className="size-5 text-orange-500" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Furnace Temp</p>
                  <p className="text-sm font-semibold">{selectedMachine.furnaceTemp} °C</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Thermometer className="size-5 text-cyan-500" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Hydraulic Oil</p>
                  <p className="text-sm font-semibold">{selectedMachine.oilTemp} °C</p>
                </div>
              </div>
            </div>

            {/* Performance Hourly Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Hourly Output on {selectedMachine.name}</h4>
              <div className="h-[200px] w-full rounded-md border border-border p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredRecords.filter((r) => r.machineId === selectedMachine.id)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", color: "#fff", borderRadius: "6px", fontSize: "12px" }}
                    />
                    <Bar dataKey="actual" name="Actual (pcs)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="goodShots" name="Good Shots" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Downtime Records for this machine */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Downtime Logs for {selectedMachine.name}</h4>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Reason</TableHead>
                      <TableHead className="text-xs">Duration</TableHead>
                      <TableHead className="text-xs">Diagnostic Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDowntime.filter((d) => d.machineId === selectedMachine.id).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center text-xs text-muted-foreground">
                          No downtime logged for this machine under current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDowntime
                        .filter((d) => d.machineId === selectedMachine.id)
                        .map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-xs font-mono">{d.time}</TableCell>
                            <TableCell className="text-xs font-semibold">{d.reason}</TableCell>
                            <TableCell className="text-xs font-medium text-destructive">{d.duration} mins</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{d.note}</TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedMachine(null)} variant="outline" size="sm">
                Close View
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
