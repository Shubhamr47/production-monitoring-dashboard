import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUpDown,
  CalendarDays,
  Cpu,
  Download,
  Factory,
  FileSpreadsheet,
  HardHat,
  Layers,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  ShieldCheck,
  Timer,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  IMPORT_FIELDS,
  demoMachines,
  downloadCsv,
  inferImportMapping,
  parseWorkbook,
  validateImportedRows,
  type DashboardFilters,
  type ImportField,
  type ImportMapping,
  type ProductionRecord,
} from "@/lib/production-data";
export { downloadCsv } from "@/lib/production-data";
import { useProductionData } from "@/context/production-data-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/production", label: "Production", icon: Layers },
  { to: "/machines", label: "Machines", icon: Cpu },
  { to: "/downtime", label: "Downtime", icon: Timer },
  { to: "/quality", label: "Quality", icon: ShieldCheck },
  { to: "/operators", label: "Operators", icon: Users },
  { to: "/reports", label: "Reports", icon: FileSpreadsheet },
] as const;

type NavigationProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

function NavigationLinks({ collapsed = false, onNavigate }: NavigationProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav aria-label="Main navigation" className="grid gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-current={isActive ? "page" : undefined}
            className={`group flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } ${collapsed ? "justify-center px-2" : ""}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex min-h-12 items-center gap-3 overflow-hidden px-1" aria-label="HPDC Monitor home">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <Factory className="size-5" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-foreground">HPDC Monitor</span>
          <span className="block text-xs text-muted-foreground">Production control</span>
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ collapsed = false, onNavigate }: NavigationProps) {
  return (
    <>
      <div className="border-b border-border px-4 py-4">
        <Brand collapsed={collapsed} />
      </div>
      <div className={`flex-1 py-5 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase text-muted-foreground">
            Plant floor
          </p>
        )}
        <NavigationLinks collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      <div className={`border-t border-border py-3 ${collapsed ? "px-2" : "px-3"}`}>
        <div className={`flex items-center gap-3 rounded-md bg-muted px-3 py-2.5 ${collapsed ? "justify-center px-2" : ""}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <HardHat className="size-4" aria-hidden="true" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-foreground">Shift supervisor</span>
              <span className="block text-[11px] text-muted-foreground">Plant operations</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { importRecords } = useProductionData();
  const [headers, setHeaders] = useState<string[]>([]);
  const [worksheetRows, setWorksheetRows] = useState<unknown[][]>([]);
  const [worksheetName, setWorksheetName] = useState("");
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState("");
  const [totalRows, setTotalRows] = useState(0);
  const validation = useMemo(
    () => (mapping ? validateImportedRows(worksheetRows, mapping) : null),
    [mapping, worksheetRows],
  );

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setFileError("");
    setBusy(true);
    setFileName(file.name);
    if (file.size > 15 * 1024 * 1024) {
      setFileError("This workbook is larger than 15 MB. Please choose a smaller file.");
      setBusy(false);
      return;
    }
    try {
      const workbook = parseWorkbook(await file.arrayBuffer());
      setWorksheetName(workbook.sheetName);
      setHeaders(workbook.headers);
      setWorksheetRows(workbook.rows);
      setMapping(inferImportMapping(workbook.headers));
      setTotalRows(workbook.rows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== "")).length);
    } catch (error) {
      setHeaders([]);
      setWorksheetRows([]);
      setMapping(null);
      setFileError(error instanceof Error ? error.message : "The workbook could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!validation || validation.valid.length === 0) return;
    try {
      const result = await importRecords(validation.valid);
      if (result.addedCount > 0) {
        toast.success(
          `Import complete: ${result.addedCount} records added (${result.duplicateCount} duplicates skipped).`
        );
      } else if (result.duplicateCount > 0) {
        toast.info(
          `No new records: all ${result.duplicateCount} records were duplicates.`
        );
      }
      if (result.invalidCount > 0) {
        toast.warning(`${result.invalidCount} rows skipped due to invalid data.`);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed.");
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFileError("");
      setHeaders([]);
      setWorksheetRows([]);
      setMapping(null);
      setFileName("");
      setTotalRows(0);
    }
    onOpenChange(nextOpen);
  };

  const updateMapping = (field: ImportField, value: string) => {
    setMapping((current) =>
      current
        ? { ...current, [field]: value === "unmapped" ? null : Number(value) }
        : current,
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[min(94vw,48rem)] max-w-[48rem] overflow-y-auto rounded-md p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <FileSpreadsheet className="size-5 text-primary" aria-hidden="true" />
            Import production workbook
          </DialogTitle>
          <DialogDescription className="text-left">
            Review and map the first worksheet. Imported rows are available only for this browser session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="production-workbook" className="text-sm font-medium">Workbook file</label>
            <Input
              id="production-workbook"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              aria-describedby="workbook-size-note"
            />
            <p id="workbook-size-note" className="text-xs text-muted-foreground">Excel or CSV · Up to 15 MB</p>
          </div>

          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Activity className="size-4 animate-pulse" aria-hidden="true" /> Reading {fileName}…
            </p>
          )}
          {fileError && <p className="text-sm text-destructive" role="alert">{fileError}</p>}

          {mapping && validation && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Worksheet: {worksheetName}</p>
                </div>
                <Badge variant="secondary">{totalRows} rows found</Badge>
              </div>

              <section aria-labelledby="column-mapping-title">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 id="column-mapping-title" className="text-sm font-semibold">Column mapping</h3>
                    <p className="text-xs text-muted-foreground">Required fields are marked with an asterisk.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMapping(inferImportMapping(headers))}
                    className="gap-1.5"
                  >
                    <ArrowLeftRight className="size-3.5" aria-hidden="true" /> Auto-map
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {IMPORT_FIELDS.map((field) => (
                    <div className="grid gap-1.5" key={field.key}>
                      <label className="text-xs font-medium text-muted-foreground" htmlFor={`map-${field.key}`}>
                        {field.label}{field.required ? " *" : ""}
                      </label>
                      <Select
                        value={mapping[field.key] === null ? "unmapped" : String(mapping[field.key])}
                        onValueChange={(value) => updateMapping(field.key, value)}
                      >
                        <SelectTrigger id={`map-${field.key}`} aria-label={`${field.label} column`} className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unmapped">Not mapped</SelectItem>
                          {headers.map((header, index) => (
                            <SelectItem value={String(index)} key={`${index}-${header}`}>
                              Column {index + 1} · {header || "Blank heading"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </section>

              {validation.requiredMappingMissing.length > 0 ? (
                <p className="text-sm text-destructive" role="alert">
                  Map the required columns: {validation.requiredMappingMissing.join(", ")}.
                </p>
              ) : (
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-primary">{validation.valid.length} valid</span>
                    <span className={validation.issues.length ? "text-destructive" : "text-muted-foreground"}>
                      {validation.issues.length} skipped
                    </span>
                    <span className="text-muted-foreground">of {totalRows} rows</span>
                  </div>
                  {validation.issues.length > 0 && (
                    <p className="text-xs text-muted-foreground" role="status">
                      First issue, row {validation.issues[0]?.row}: {validation.issues[0]?.errors.join(" ")}
                    </p>
                  )}
                </div>
              )}

              <div className="overflow-hidden rounded-md border border-border">
                <div className="flex items-center justify-between border-b border-border bg-muted px-3 py-2">
                  <h3 className="text-xs font-semibold">Worksheet preview</h3>
                  <span className="text-xs text-muted-foreground">First 5 rows</span>
                </div>
                <div className="max-h-56 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.slice(0, 8).map((header, index) => (
                          <TableHead key={`${index}-${header}`} className="whitespace-nowrap">{header || `Column ${index + 1}`}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {worksheetRows.slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headers.slice(0, 8).map((_, colIndex) => (
                            <TableCell key={colIndex} className="max-w-40 truncate whitespace-nowrap">
                              {String(row[colIndex] ?? "—")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!validation || validation.valid.length === 0 || validation.requiredMappingMissing.length > 0}
            >
              <Upload className="size-4" aria-hidden="true" />
              Add {validation?.valid.length ?? 0} rows to session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ResetDataDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { resetToDemoData } = useProductionData();
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    setBusy(true);
    try {
      await resetToDemoData();
      toast.success("All production records have been reset to factory demo data.");
      onOpenChange(false);
    } catch {
      toast.error("Failed to reset demo data.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-base">
            <RotateCcw className="size-4" /> Reset to Demo Dataset?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
            This will discard any manual changes or imported records from your browser storage and reload the standard HPDC factory demo dataset.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={handleReset} disabled={busy}>
            {busy ? "Resetting…" : "Confirm Reset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const { importedCount, manualCount } = useProductionData();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex ${
          collapsed ? "w-[76px]" : "w-[252px]"
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
              title={collapsed ? "Expand navigation" : "Collapse navigation"}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
                <Factory className="size-4" aria-hidden="true" />
              </span>
              <span className="truncate text-sm font-semibold">HPDC plant floor</span>
              <span className="hidden text-muted-foreground lg:inline">/</span>
              <span className="hidden text-xs text-muted-foreground lg:inline">Production control</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-md bg-accent/50 px-2.5 py-1.5 text-xs font-medium text-accent-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span>Plant Telemetry</span>
              {importedCount > 0 && <span className="text-muted-foreground">+{importedCount} imp</span>}
              {manualCount > 0 && <span className="text-primary font-semibold">+{manualCount} man</span>}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setResetOpen(true)}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Reset to original demo data"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden md:inline">Reset Demo</span>
            </Button>
            <span className="hidden size-9 place-items-center rounded-full border border-border bg-muted text-xs font-semibold sm:grid" aria-label="Supervisor profile">
              OP
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="fixed left-0 top-0 h-dvh w-[min(84vw,20rem)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 sm:rounded-none">
          <div className="flex h-full flex-col bg-card">
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ResetDataDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase text-primary">HPDC production</p>
        <h1 className="text-2xl font-bold text-foreground sm:text-[1.75rem]">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  );
}

export function FilterBar({
  filters: propFilters,
  onChange: propOnChange,
  records: propRecords,
}: {
  filters?: DashboardFilters;
  onChange?: (next: DashboardFilters) => void;
  records?: ProductionRecord[];
} = {}) {
  const context = useProductionData();
  const filters = propFilters ?? context.filters;
  const onChange = propOnChange ?? context.setFilters;
  const records = propRecords ?? context.records;
  const { allParts, resetFilters, filteredRecords } = context;

  const dates = Array.from(new Set(records.map((record) => record.date))).sort((a, b) => b.localeCompare(a));
  const shifts = Array.from(new Set(records.map((record) => record.shift))).sort();
  const parts = allParts && allParts.length > 0 ? allParts : Array.from(new Set(records.map((r) => r.part))).filter(Boolean);

  const hasActiveFilters = filters.date !== "all" || filters.shift !== "all" || filters.machine !== "all" || (filters.part && filters.part !== "all");

  return (
    <section aria-label="Production filters" className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/60 p-3.5 shadow-xs">
      <span className="mr-1 hidden items-center gap-1.5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:flex">
        <ArrowDownUp className="size-3.5" aria-hidden="true" /> Filters:
      </span>
      <label className="grid min-w-[140px] gap-1.5 text-xs font-medium text-muted-foreground">
        Date
        <Select value={filters.date} onValueChange={(date) => onChange({ ...filters, date })}>
          <SelectTrigger aria-label="Filter by date" className="h-9 bg-background text-xs text-foreground">
            <CalendarDays className="mr-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {dates.map((date) => (
              <SelectItem key={date} value={date}>{formatDate(date)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid min-w-[125px] gap-1.5 text-xs font-medium text-muted-foreground">
        Shift (A/B)
        <Select value={filters.shift} onValueChange={(shift) => onChange({ ...filters, shift })}>
          <SelectTrigger aria-label="Filter by shift" className="h-9 bg-background text-xs text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            {shifts.map((shift) => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}
          </SelectContent>
        </Select>
      </label>
      <label className="grid min-w-[135px] gap-1.5 text-xs font-medium text-muted-foreground">
        Machine
        <Select value={filters.machine} onValueChange={(machine) => onChange({ ...filters, machine })}>
          <SelectTrigger aria-label="Filter by machine" className="h-9 bg-background text-xs text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Machines</SelectItem>
            {demoMachines.map((machine) => (
              <SelectItem key={machine.id} value={machine.id}>{machine.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid min-w-[170px] max-w-[240px] gap-1.5 text-xs font-medium text-muted-foreground">
        Part / Item Code
        <Select value={filters.part || "all"} onValueChange={(part) => onChange({ ...filters, part })}>
          <SelectTrigger aria-label="Filter by part" className="h-9 truncate bg-background text-xs text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parts</SelectItem>
            {parts.map((part) => (
              <SelectItem key={part} value={part}>{part}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      {hasActiveFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => (propOnChange ? propOnChange({ date: "all", shift: "all", machine: "all", part: "all" }) : resetFilters())}
          className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset Filters
        </Button>
      )}
      <div className="ml-auto flex items-center gap-2 pb-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="font-medium text-[11px]">
          {propRecords ? records.length : filteredRecords.length} records active
        </Badge>
      </div>
    </section>
  );
}

export function useDashboardFilters(records: ProductionRecord[]) {
  const [filters, setFilters] = useState<DashboardFilters>({ date: "all", shift: "all", machine: "all", part: "all" });
  const visibleRecords = useMemo(
    () => records.filter((record) => {
      return (
        (filters.date === "all" || record.date === filters.date) &&
        (filters.shift === "all" || record.shift === filters.shift) &&
        (filters.machine === "all" || record.machineId === filters.machine) &&
        (filters.part === "all" || record.part === filters.part)
      );
    }),
    [filters, records],
  );
  return { filters, setFilters, visibleRecords };
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  accent?: "primary" | "warning" | "danger" | "info";
}) {
  const tone = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-chart-3/10 text-chart-3",
  }[accent];
  return (
    <Card className="rounded-md border-border shadow-none">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-foreground tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

type DataColumn<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
};

export function DataTable<T extends { id: string }>({
  title,
  description,
  rows,
  columns,
  searchPlaceholder = "Search records…",
  emptyText = "No records match the current filters.",
  filename = "hpdc-report.csv",
  searchValue,
  headerActions,
}: {
  title: string;
  description?: string;
  rows: T[];
  columns: DataColumn<T>[];
  searchPlaceholder?: string;
  emptyText?: string;
  filename?: string;
  searchValue?: (row: T) => string;
  headerActions?: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState(1);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = rows.filter((row) => {
      return !query || (searchValue ? searchValue(row) : Object.values(row).map(String).join(" ")).toLowerCase().includes(query);
    });
    if (!sortKey) return matches;
    const column = columns.find((item) => item.key === sortKey);
    if (!column) return matches;
    return [...matches].sort((a, b) => {
      const left = column.sortValue ? column.sortValue(a) : String(a[sortKey] ?? "");
      const right = column.sortValue ? column.sortValue(b) : String(b[sortKey] ?? "");
      const comparison = typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return comparison * sortDirection;
    });
  }, [columns, rows, search, searchValue, sortDirection, sortKey]);

  const sortBy = (column: DataColumn<T>) => {
    if (sortKey === column.key) setSortDirection((value) => value * -1);
    else {
      setSortKey(column.key);
      setSortDirection(1);
    }
  };

  const exportRows = filteredRows.map((row) => Object.fromEntries(
    columns.map((column) => [column.label, column.exportValue ? column.exportValue(row) : String(row[column.key] ?? "")]),
  ));

  return (
    <Card className="rounded-md border-border shadow-none">
      <CardHeader className="gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(exportRows, filename)}
              disabled={filteredRows.length === 0}
            >
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                {columns.map((column) => (
                  <TableHead key={String(column.key)} className="whitespace-nowrap px-4 text-xs font-semibold uppercase">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => sortBy(column)}
                      className="-ml-2 h-7 px-2 text-xs font-semibold uppercase text-muted-foreground"
                    >
                      {column.label}
                      {sortKey === column.key ? <ArrowUpDown className="size-3.5" aria-hidden="true" /> : <ArrowDownUp className="size-3.5 opacity-60" aria-hidden="true" />}
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <span className="mx-auto grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
                      <Search className="size-4" aria-hidden="true" />
                    </span>
                    <p className="mt-2 text-sm text-muted-foreground">{emptyText}</p>
                  </TableCell>
                </TableRow>
              ) : filteredRows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-sm">
                      {column.render ? column.render(row) : String(row[column.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>{filteredRows.length} of {rows.length} records</span>
          {sortKey && <span>Sorted {sortDirection > 0 ? "ascending" : "descending"}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(date: string): string {
  if (date === "all") return "All dates";
  const parsed = new Date(`${date}T12:00:00`);
  if (!Number.isFinite(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function statusBadge(status: string) {
  const tone = status === "Running"
    ? "border-primary/20 bg-primary/10 text-primary"
    : status === "Idle"
      ? "border-warning/30 bg-warning/15 text-warning-foreground"
      : "border-destructive/20 bg-destructive/10 text-destructive";
  return <Badge variant="outline" className={tone}>{status}</Badge>;
}