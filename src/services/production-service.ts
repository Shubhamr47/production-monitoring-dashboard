import {
  demoProductionRecords,
  getRecordIdentity,
  machineIdFromName,
  type ProductionRecord,
} from "@/lib/production-data";

const STORAGE_KEY = "hpdc_production_records_v2";

export type ImportResultSummary = {
  totalProcessed: number;
  addedCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: string[];
};

/**
 * Dedicated production data persistence and business logic service.
 * Designed with an API-ready interface so it can be swapped with backend endpoints.
 */
class ProductionService {
  /**
   * Load all production records from persistence (or demo data default).
   */
  public async getRecords(): Promise<ProductionRecord[]> {
    if (typeof window === "undefined") {
      return demoProductionRecords;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ProductionRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to read records from localStorage:", e);
    }

    // Default to demo records and persist
    await this.saveRecords(demoProductionRecords);
    return demoProductionRecords;
  }

  /**
   * Persist all records to storage.
   */
  public async saveRecords(records: ProductionRecord[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error("Failed to persist records to localStorage:", e);
      throw new Error("Unable to save records to browser storage. Quota may be exceeded.");
    }
  }

  /**
   * Add a single new manual production record.
   */
  public async addRecord(
    recordData: Omit<ProductionRecord, "id" | "source">
  ): Promise<ProductionRecord> {
    const existing = await this.getRecords();

    // Check for duplicate record
    const targetIdentity = getRecordIdentity(recordData);
    const isDuplicate = existing.some(
      (r) => getRecordIdentity(r) === targetIdentity
    );

    if (isDuplicate) {
      throw new Error(
        `A record for ${recordData.machine} on ${recordData.date} (${recordData.shift}, ${recordData.time}) already exists.`
      );
    }

    const newRecord: ProductionRecord = {
      ...recordData,
      id: `man-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      machineId: recordData.machineId || machineIdFromName(recordData.machine),
      source: "manual",
    };

    const updated = [newRecord, ...existing];
    await this.saveRecords(updated);
    return newRecord;
  }

  /**
   * Update an existing production record.
   */
  public async updateRecord(
    id: string,
    updates: Partial<Omit<ProductionRecord, "id" | "source">>
  ): Promise<ProductionRecord> {
    const existing = await this.getRecords();
    const index = existing.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new Error(`Record with id ${id} not found.`);
    }

    const current = existing[index];
    const updatedRecord: ProductionRecord = {
      ...current,
      ...updates,
      machineId: updates.machine ? machineIdFromName(updates.machine) : current.machineId,
    };

    // If identity changed, ensure no collision with another record
    const updatedIdentity = getRecordIdentity(updatedRecord);
    const collision = existing.some(
      (r) => r.id !== id && getRecordIdentity(r) === updatedIdentity
    );
    if (collision) {
      throw new Error(
        `Another record already exists for ${updatedRecord.machine} on ${updatedRecord.date} (${updatedRecord.shift}, ${updatedRecord.time}).`
      );
    }

    existing[index] = updatedRecord;
    await this.saveRecords(existing);
    return updatedRecord;
  }

  /**
   * Delete a production record by id.
   */
  public async deleteRecord(id: string): Promise<boolean> {
    const existing = await this.getRecords();
    const filtered = existing.filter((r) => r.id !== id);

    if (filtered.length === existing.length) {
      return false;
    }

    await this.saveRecords(filtered);
    return true;
  }

  /**
   * Import multiple production records with duplicate detection and validation.
   */
  public async importRecords(
    incoming: Omit<ProductionRecord, "id" | "source">[]
  ): Promise<ImportResultSummary> {
    const existing = await this.getRecords();
    const existingIdentities = new Set(existing.map((r) => getRecordIdentity(r)));

    const validNewRecords: ProductionRecord[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;
    const errors: string[] = [];

    const batchId = Date.now();

    incoming.forEach((item, index) => {
      // Basic validity check
      if (!item.date || !item.machine || item.actual < 0 || item.target < 0) {
        invalidCount++;
        errors.push(`Row ${index + 1}: Missing required fields or negative numbers.`);
        return;
      }

      const identity = getRecordIdentity(item);
      if (existingIdentities.has(identity)) {
        duplicateCount++;
        return;
      }

      existingIdentities.add(identity);
      validNewRecords.push({
        ...item,
        id: `imp-${batchId}-${index}`,
        machineId: item.machineId || machineIdFromName(item.machine),
        source: "imported",
      });
    });

    if (validNewRecords.length > 0) {
      const merged = [...validNewRecords, ...existing];
      await this.saveRecords(merged);
    }

    return {
      totalProcessed: incoming.length,
      addedCount: validNewRecords.length,
      duplicateCount,
      invalidCount,
      errors: errors.slice(0, 5), // Keep top 5 errors for clean reporting
    };
  }

  /**
   * Reset data to default demo records.
   */
  public async resetToDemo(): Promise<ProductionRecord[]> {
    await this.saveRecords(demoProductionRecords);
    return demoProductionRecords;
  }
}

export const productionService = new ProductionService();
