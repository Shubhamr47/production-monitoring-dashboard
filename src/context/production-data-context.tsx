import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  calculateKPIs,
  defaultFilters,
  demoDowntimeEvents,
  demoMachines,
  demoParts,
  demoProductionRecords,
  filterDowntimeEvents,
  filterProductionRecords,
  type CalculatedKPIs,
  type DashboardFilters,
  type DowntimeEvent,
  type MachineSummary,
  type ProductionRecord,
} from "@/lib/production-data";
import {
  productionService,
  type ImportResultSummary,
} from "@/services/production-service";

type ProductionDataContextValue = {
  records: ProductionRecord[];
  downtimeEvents: DowntimeEvent[];
  machines: MachineSummary[];
  allParts: string[];
  allOperators: string[];
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  updateFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  filteredRecords: ProductionRecord[];
  filteredDowntime: DowntimeEvent[];
  kpis: CalculatedKPIs;
  addRecord: (record: Omit<ProductionRecord, "id" | "source">) => Promise<ProductionRecord>;
  updateRecord: (id: string, updates: Partial<Omit<ProductionRecord, "id" | "source">>) => Promise<ProductionRecord>;
  deleteRecord: (id: string) => Promise<boolean>;
  importRecords: (records: Omit<ProductionRecord, "id" | "source">[]) => Promise<ImportResultSummary>;
  resetToDemoData: () => Promise<void>;
  importedCount: number;
  manualCount: number;
};

const ProductionDataContext = createContext<ProductionDataContextValue | undefined>(undefined);

export function ProductionDataProvider({ children }: PropsWithChildren) {
  const [records, setRecords] = useState<ProductionRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hpdc_production_records_v2");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Error reading localStorage initial state:", e);
      }
    }
    return demoProductionRecords;
  });

  const [downtimeEvents] = useState<DowntimeEvent[]>(() => demoDowntimeEvents);
  const [machines] = useState<MachineSummary[]>(() => demoMachines);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  // Sync state with service on mount
  useEffect(() => {
    let isMounted = true;
    productionService.getRecords().then((loaded) => {
      if (isMounted && loaded.length > 0) {
        setRecords(loaded);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const addRecord = useCallback(async (recordData: Omit<ProductionRecord, "id" | "source">) => {
    const created = await productionService.addRecord(recordData);
    setRecords((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateRecord = useCallback(
    async (id: string, updates: Partial<Omit<ProductionRecord, "id" | "source">>) => {
      const updated = await productionService.updateRecord(id, updates);
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    []
  );

  const deleteRecord = useCallback(async (id: string) => {
    const success = await productionService.deleteRecord(id);
    if (success) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
    return success;
  }, []);

  const importRecords = useCallback(
    async (incoming: Omit<ProductionRecord, "id" | "source">[]) => {
      const result = await productionService.importRecords(incoming);
      const reloaded = await productionService.getRecords();
      setRecords(reloaded);
      return result;
    },
    []
  );

  const resetToDemoData = useCallback(async () => {
    const fresh = await productionService.resetToDemo();
    setRecords(fresh);
    setFilters(defaultFilters);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const filteredRecords = useMemo(
    () => filterProductionRecords(records, filters),
    [records, filters]
  );

  const filteredDowntime = useMemo(
    () => filterDowntimeEvents(downtimeEvents, filters),
    [downtimeEvents, filters]
  );

  const kpis = useMemo(
    () => calculateKPIs(filteredRecords, filteredDowntime),
    [filteredRecords, filteredDowntime]
  );

  const allParts = useMemo(() => {
    const set = new Set<string>(demoParts);
    records.forEach((r) => {
      if (r.part) set.add(r.part);
    });
    return Array.from(set);
  }, [records]);

  const allOperators = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.operator) set.add(r.operator);
    });
    return Array.from(set);
  }, [records]);

  const importedCount = records.filter((r) => r.source === "imported").length;
  const manualCount = records.filter((r) => r.source === "manual").length;

  return (
    <ProductionDataContext.Provider
      value={{
        records,
        downtimeEvents,
        machines,
        allParts,
        allOperators,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        filteredRecords,
        filteredDowntime,
        kpis,
        addRecord,
        updateRecord,
        deleteRecord,
        importRecords,
        resetToDemoData,
        importedCount,
        manualCount,
      }}
    >
      {children}
    </ProductionDataContext.Provider>
  );
}

export function useProductionData(): ProductionDataContextValue {
  const context = useContext(ProductionDataContext);
  if (!context) throw new Error("useProductionData must be used inside ProductionDataProvider.");
  return context;
}
