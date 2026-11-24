import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  CheckCircle2,
  Download,
  Edit2,
  Layers,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { useProductionData } from "@/context/production-data-context";
import {
  DataTable,
  FilterBar,
  ImportDialog,
  MetricCard,
  PageHeading,
  downloadCsv,
  formatNumber,
} from "@/components/dashboard/app-shell";
import { ProductionRecordDialog } from "@/components/dashboard/production-record-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductionRecord } from "@/lib/production-data";

export const Route = createFileRoute("/production")({
  component: ProductionPage,
});

function ProductionPage() {
  const { filteredRecords, kpis, deleteRecord } = useProductionData();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ProductionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await deleteRecord(deletingRecord.id);
      toast.success(`Record for ${deletingRecord.machine} (${deletingRecord.time}) deleted.`);
      setDeletingRecord(null);
    } catch {
      toast.error("Failed to delete record.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: "time" as keyof ProductionRecord,
      label: "Time Slot",
      render: (r: ProductionRecord) => (
        <span className="font-semibold text-foreground font-mono text-xs">{r.time}</span>
      ),
      sortValue: (r: ProductionRecord) => r.time,
    },
    {
      key: "machine" as keyof ProductionRecord,
      label: "Machine",
      render: (r: ProductionRecord) => (
        <Badge variant="outline" className="font-medium text-xs">
          {r.machine}
        </Badge>
      ),
      sortValue: (r: ProductionRecord) => r.machine,
    },
    {
      key: "operator" as keyof ProductionRecord,
      label: "Operator",
      render: (r: ProductionRecord) => <span className="text-xs">{r.operator}</span>,
      sortValue: (r: ProductionRecord) => r.operator,
    },
    {
      key: "shift" as keyof ProductionRecord,
      label: "Shift",
      render: (r: ProductionRecord) => (
        <Badge variant={r.shift.includes("A") ? "secondary" : "default"} className="text-[11px]">
          {r.shift}
        </Badge>
      ),
      sortValue: (r: ProductionRecord) => r.shift,
    },
    {
      key: "part" as keyof ProductionRecord,
      label: "Part / Item Code",
      render: (r: ProductionRecord) => (
        <span className="truncate text-xs font-mono max-w-[180px] block">{r.part}</span>
      ),
      sortValue: (r: ProductionRecord) => r.part,
    },
    {
      key: "target" as keyof ProductionRecord,
      label: "Target",
      render: (r: ProductionRecord) => (
        <span className="tabular-nums font-medium text-muted-foreground text-xs">{formatNumber(r.target)}</span>
      ),
      sortValue: (r: ProductionRecord) => r.target,
    },
    {
      key: "actual" as keyof ProductionRecord,
      label: "Actual",
      render: (r: ProductionRecord) => (
        <span className="tabular-nums font-bold text-foreground text-xs">{formatNumber(r.actual)}</span>
      ),
      sortValue: (r: ProductionRecord) => r.actual,
    },
    {
      key: "goodShots" as keyof ProductionRecord,
      label: "Good Shots",
      render: (r: ProductionRecord) => (
        <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
          {formatNumber(r.goodShots)}
        </span>
      ),
      sortValue: (r: ProductionRecord) => r.goodShots,
    },
    {
      key: "operatorRejections" as keyof ProductionRecord,
      label: "Rejections",
      render: (r: ProductionRecord) => {
        const total = r.operatorRejections + r.qaRejections;
        return (
          <span className="tabular-nums text-destructive font-semibold text-xs">
            {total}
          </span>
        );
      },
      sortValue: (r: ProductionRecord) => r.operatorRejections + r.qaRejections,
    },
    {
      key: "id" as keyof ProductionRecord,
      label: "Achievement",
      render: (r: ProductionRecord) => {
        const ach = r.target > 0 ? (r.actual / r.target) * 100 : 0;
        return (
          <span className={`tabular-nums font-bold text-xs ${ach >= 90 ? "text-primary" : "text-amber-600"}`}>
            {ach.toFixed(1)}%
          </span>
        );
      },
      sortValue: (r: ProductionRecord) => (r.target > 0 ? r.actual / r.target : 0),
    },
    {
      key: "source" as keyof ProductionRecord,
      label: "Source",
      render: (r: ProductionRecord) => (
        <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
          {r.source || "demo"}
        </span>
      ),
      sortValue: (r: ProductionRecord) => r.source || "demo",
    },
    {
      key: "date" as keyof ProductionRecord,
      label: "Actions",
      render: (r: ProductionRecord) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            title="Edit record"
            onClick={() => setEditingRecord(r)}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            title="Delete record"
            onClick={() => setDeletingRecord(r)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ], []);

  const handleExportAll = () => {
    const rows = filteredRecords.map((r) => ({
      "Date": r.date,
      "Time Slot": r.time,
      "Machine": r.machine,
      "Operator": r.operator,
      "Shift": r.shift,
      "Part / Item Code": r.part,
      "Target (pcs)": r.target,
      "Actual (pcs)": r.actual,
      "Good Shots": r.goodShots,
      "Rejections": r.operatorRejections + r.qaRejections,
      "Achievement %": r.target > 0 ? `${((r.actual / r.target) * 100).toFixed(1)}%` : "0%",
      "Source": r.source,
    }));
    downloadCsv(rows, `hpdc-production-log-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Hourly Production Records"
        description="Shift-wise casting counts, good shots, verified scrap, and real-time shop floor entry."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setAddModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="size-4" /> Add Record
            </Button>
            <Button
              onClick={() => setImportModalOpen(true)}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs font-medium"
            >
              <Upload className="size-3.5" /> Import Excel
            </Button>
            <Button
              onClick={handleExportAll}
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs border border-border"
            >
              <Download className="size-3.5" /> Export CSV
            </Button>
          </div>
        }
      />

      <FilterBar />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Filtered Actual Output"
          value={formatNumber(kpis.totalProduction)}
          detail={`Target: ${formatNumber(kpis.productionTarget)}`}
          icon={Boxes}
          accent="primary"
        />
        <MetricCard
          label="Good Shots Yield"
          value={formatNumber(kpis.goodShots)}
          detail={`${((kpis.goodShots / (kpis.totalProduction || 1)) * 100).toFixed(1)}% acceptance`}
          icon={CheckCircle2}
          accent="primary"
        />
        <MetricCard
          label="Total Rejections"
          value={formatNumber(kpis.totalRejections)}
          detail={`${kpis.rejectionRate}% rejection rate`}
          icon={ShieldAlert}
          accent={kpis.totalRejections > 100 ? "danger" : "warning"}
        />
        <MetricCard
          label="Overall Achievement"
          value={`${kpis.achievementPct}%`}
          detail={kpis.achievementPct >= 90 ? "Target Attained" : "Under Planned"}
          icon={Activity}
          accent={kpis.achievementPct >= 90 ? "primary" : "warning"}
        />
      </div>

      {/* Production Records Table with CRUD */}
      <DataTable
        title="Production Telemetry Log"
        description="Add, edit, and review verified hourly logs. Changes immediately reflect across all dashboard pages."
        rows={filteredRecords}
        columns={columns}
        searchPlaceholder="Search machine, operator, part code, shift, time..."
        filename="hpdc-hourly-production.csv"
        searchValue={(r) => `${r.machine} ${r.operator} ${r.part} ${r.shift} ${r.date} ${r.time} ${r.source}`}
      />

      {/* Add / Edit Record Dialog */}
      <ProductionRecordDialog
        open={addModalOpen || !!editingRecord}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
            setEditingRecord(null);
          }
        }}
        recordToEdit={editingRecord}
      />

      {/* Excel Import Dialog */}
      <ImportDialog open={importModalOpen} onOpenChange={setImportModalOpen} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
        <DialogContent className="max-w-md rounded-lg p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-base">
              <Trash2 className="size-4" /> Delete Production Record?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Are you sure you want to delete the record for{" "}
              <strong>{deletingRecord?.machine}</strong> at{" "}
              <strong>{deletingRecord?.time}</strong> on{" "}
              <strong>{deletingRecord?.date}</strong>? All dashboard KPIs and charts will update immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingRecord(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
