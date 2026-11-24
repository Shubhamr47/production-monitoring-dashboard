import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Factory, Layers, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useProductionData } from "@/context/production-data-context";
import {
  DEMO_DATE,
  demoMachines,
  demoParts,
  machineIdFromName,
  type ProductionRecord,
} from "@/lib/production-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordToEdit?: ProductionRecord | null;
  onSuccess?: () => void;
};

const SHIFTS = ["Shift A", "Shift B"];
const TIME_SLOTS = [
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
  "00:00",
  "02:00",
  "04:00",
];

export function ProductionRecordDialog({
  open,
  onOpenChange,
  recordToEdit,
  onSuccess,
}: Props) {
  const { addRecord, updateRecord, allOperators, allParts } = useProductionData();

  const [date, setDate] = useState(DEMO_DATE);
  const [machine, setMachine] = useState("120T");
  const [shift, setShift] = useState("Shift A");
  const [time, setTime] = useState("06:00");
  const [operator, setOperator] = useState("");
  const [part, setPart] = useState("");
  const [target, setTarget] = useState("2000");
  const [actual, setActual] = useState("1800");
  const [goodShots, setGoodShots] = useState("1750");
  const [rejections, setRejections] = useState("50");

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form on edit or reset on create
  useEffect(() => {
    if (open) {
      setFormError("");
      if (recordToEdit) {
        setDate(recordToEdit.date);
        setMachine(recordToEdit.machine);
        setShift(recordToEdit.shift);
        setTime(recordToEdit.time || "06:00");
        setOperator(recordToEdit.operator || "");
        setPart(recordToEdit.part || "");
        setTarget(String(recordToEdit.target));
        setActual(String(recordToEdit.actual));
        setGoodShots(String(recordToEdit.goodShots));
        const totalRej = recordToEdit.operatorRejections + recordToEdit.qaRejections;
        setRejections(String(totalRej));
      } else {
        setDate(DEMO_DATE);
        setMachine("120T");
        setShift("Shift A");
        setTime("08:00");
        setOperator(allOperators[0] || "Dhruv Patel");
        setPart(demoParts[0]);
        setTarget("2000");
        setActual("1900");
        setGoodShots("1850");
        setRejections("50");
      }
    }
  }, [open, recordToEdit, allOperators]);

  // Live Auto-balance helpers to enforce: Good Shots + Rejections = Actual Production
  const handleActualChange = (val: string) => {
    const actNum = Math.max(0, Number(val) || 0);
    setActual(val);
    const goodNum = Math.max(0, Number(goodShots) || 0);
    if (actNum >= goodNum) {
      setRejections(String(actNum - goodNum));
    } else {
      setGoodShots(String(actNum));
      setRejections("0");
    }
  };

  const handleGoodShotsChange = (val: string) => {
    const goodNum = Math.max(0, Number(val) || 0);
    setGoodShots(val);
    const actNum = Math.max(0, Number(actual) || 0);
    if (actNum >= goodNum) {
      setRejections(String(actNum - goodNum));
    } else {
      setActual(String(goodNum + (Number(rejections) || 0)));
    }
  };

  const handleRejectionsChange = (val: string) => {
    const rejNum = Math.max(0, Number(val) || 0);
    setRejections(val);
    const goodNum = Math.max(0, Number(goodShots) || 0);
    setActual(String(goodNum + rejNum));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const targetNum = Number(target);
    const actualNum = Number(actual);
    const goodNum = Number(goodShots);
    const rejNum = Number(rejections);

    // Validation
    if (!date.trim()) {
      setFormError("Date is required.");
      return;
    }
    if (!machine.trim()) {
      setFormError("Machine selection is required.");
      return;
    }
    if (!operator.trim()) {
      setFormError("Operator name is required.");
      return;
    }
    if (!part.trim()) {
      setFormError("Part selection or code is required.");
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      setFormError("Target production must be greater than 0.");
      return;
    }
    if (isNaN(actualNum) || actualNum < 0) {
      setFormError("Actual production cannot be negative.");
      return;
    }
    if (isNaN(goodNum) || goodNum < 0) {
      setFormError("Good shots cannot be negative.");
      return;
    }
    if (isNaN(rejNum) || rejNum < 0) {
      setFormError("Rejections cannot be negative.");
      return;
    }

    // Strict model check: Good Shots + Rejections = Actual Production
    if (goodNum + rejNum !== actualNum) {
      setFormError(
        `Good Shots (${goodNum}) + Rejections (${rejNum}) = ${goodNum + rejNum}, which does not match Actual Production (${actualNum}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Split rejections into realistic Operator (60%) and QA (40%) proportions
      const opRej = Math.round(rejNum * 0.6);
      const qaRej = rejNum - opRej;

      const payload = {
        date,
        machine,
        machineId: machineIdFromName(machine),
        shift,
        time,
        operator: operator.trim(),
        part: part.trim(),
        target: targetNum,
        actual: actualNum,
        goodShots: goodNum,
        offShots: 0,
        operatorRejections: opRej,
        qaRejections: qaRej,
      };

      if (recordToEdit) {
        await updateRecord(recordToEdit.id, payload);
        toast.success(`Production record for ${machine} (${time}) updated.`);
      } else {
        await addRecord(payload);
        toast.success(`New production record added for ${machine} (${time}).`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBalanced = Number(goodShots) + Number(rejections) === Number(actual);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(94vw,42rem)] max-w-[42rem] overflow-y-auto rounded-lg p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Factory className="size-5 text-primary" aria-hidden="true" />
            {recordToEdit ? "Edit Production Record" : "Add Production Record"}
          </DialogTitle>
          <DialogDescription className="text-left text-xs">
            Enter hourly casting data. Model requirement: Good Shots + Rejections must equal Actual Production.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {formError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Date & Shift */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-date" className="text-xs font-semibold">
                Date *
              </Label>
              <Input
                id="rec-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-shift" className="text-xs font-semibold">
                Shift *
              </Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger id="rec-shift" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Machine & Time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-machine" className="text-xs font-semibold">
                HPDC Machine *
              </Label>
              <Select value={machine} onValueChange={setMachine}>
                <SelectTrigger id="rec-machine" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {demoMachines.map((m) => (
                    <SelectItem key={m.id} value={m.name} className="text-xs">
                      {m.name} ({m.tonnage}T)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-time" className="text-xs font-semibold">
                Time / Hour Slot *
              </Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="rec-time" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs font-mono">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Operator & Part */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-operator" className="text-xs font-semibold">
                Operator Name *
              </Label>
              <Input
                id="rec-operator"
                type="text"
                placeholder="e.g. Dhruv Patel"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-part" className="text-xs font-semibold">
                Part / Item Code *
              </Label>
              <Select value={part} onValueChange={setPart}>
                <SelectTrigger id="rec-part" className="h-9 truncate text-xs">
                  <SelectValue placeholder="Select or enter part" />
                </SelectTrigger>
                <SelectContent>
                  {allParts.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Production Quantities */}
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                Production Counts
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isBalanced
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="size-3" /> Balanced: Good ({goodShots || 0}) + Rej ({rejections || 0}) = Actual ({actual || 0})
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3" /> Unbalanced: Good + Rejections ≠ Actual
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="rec-target" className="text-[11px] text-muted-foreground font-medium">
                  Target (pcs) *
                </Label>
                <Input
                  id="rec-target"
                  type="number"
                  min="0"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                  className="h-9 tabular-nums text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rec-actual" className="text-[11px] text-muted-foreground font-medium">
                  Actual (pcs) *
                </Label>
                <Input
                  id="rec-actual"
                  type="number"
                  min="0"
                  value={actual}
                  onChange={(e) => handleActualChange(e.target.value)}
                  required
                  className="h-9 tabular-nums text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rec-good" className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Good Shots *
                </Label>
                <Input
                  id="rec-good"
                  type="number"
                  min="0"
                  value={goodShots}
                  onChange={(e) => handleGoodShotsChange(e.target.value)}
                  required
                  className="h-9 tabular-nums text-xs text-emerald-600 dark:text-emerald-400 font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rec-rej" className="text-[11px] text-destructive font-semibold">
                  Rejections *
                </Label>
                <Input
                  id="rec-rej"
                  type="number"
                  min="0"
                  value={rejections}
                  onChange={(e) => handleRejectionsChange(e.target.value)}
                  required
                  className="h-9 tabular-nums text-xs text-destructive font-bold"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !isBalanced}>
              {isSubmitting ? "Saving…" : recordToEdit ? "Update Record" : "+ Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
