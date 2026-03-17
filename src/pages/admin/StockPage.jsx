import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  ArrowRightLeft,
  Settings2,
  RefreshCw,
  Package,
  AlertTriangle,
  ChevronRight,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import driveService from "@/services/driveService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────
const formatCertId = (num) => {
  if (num == null) return "—";
  return `CERT-${String(num).padStart(6, "0")}`;
};

// ── Stock Card ────────────────────────────────────────────────
function StockCard({ center, onAction }) {
  const certAvailable = center.cert_quantity ?? 0;
  const hasBatch = center.cert_range_start != null;
  const certTotal = hasBatch
    ? center.cert_range_end - center.cert_range_start + 1
    : 0;
  const certUsed = certTotal - certAvailable;
  const certProgress = certTotal > 0 ? (certUsed / certTotal) * 100 : 0;
  const certLow = center.cert_low_stock;
  const medalLow = center.medal_low_stock;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm leading-tight">
            {center.center_name}
          </h3>
        </div>
        {(certLow || medalLow) && (
          <StatusBadge label="Low Stock" variant="destructive" />
        )}
      </div>

      {/* Certificate Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Certificate
          </p>
          {certLow && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Low
            </span>
          )}
        </div>

        {hasBatch ? (
          <>
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "text-2xl font-bold leading-tight",
                  certLow && "text-destructive",
                )}
              >
                {certAvailable}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {certTotal} remaining
                </span>
              </p>
            </div>

            {/* Range info */}
            <div className="rounded-md bg-muted/40 border border-border px-3 py-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Range</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCertId(center.cert_range_start)} —{" "}
                  {formatCertId(center.cert_range_end)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Next assign</span>
                <span className="font-mono font-medium text-primary">
                  {formatCertId(center.cert_current_position)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Used</span>
                <span className="text-foreground">{certUsed} sheets</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    certLow ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${certProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {certProgress.toFixed(0)}% used
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-md bg-muted/30 border border-dashed border-border px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No batch assigned</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add a certificate batch to get started
            </p>
          </div>
        )}

        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs gap-1"
            onClick={() => onAction("add_cert", center)}
          >
            <Plus className="h-3 w-3" />
            {hasBatch ? "Extend" : "Add Batch"}
          </Button>
          {hasBatch && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs gap-1"
              onClick={() => onAction("transfer_cert", center)}
            >
              <ArrowRightLeft className="h-3 w-3" /> Transfer
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Medal Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Medal
          </p>
          {medalLow && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Low
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-2xl font-bold leading-tight",
              medalLow && "text-destructive",
            )}
          >
            {center.medal_quantity ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">
            threshold: {center.medal_threshold ?? 10}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs gap-1"
            onClick={() => onAction("add_medal", center)}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs gap-1"
            onClick={() => onAction("transfer_medal", center)}
          >
            <ArrowRightLeft className="h-3 w-3" /> Transfer
          </Button>
        </div>
      </div>

      {/* Threshold */}
      <div className="pt-1 border-t border-border">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1 text-muted-foreground w-full"
          onClick={() => onAction("threshold", center)}
        >
          <Settings2 className="h-3 w-3" /> Update Threshold
        </Button>
      </div>
    </div>
  );
}

// ── Add Certificate Batch Dialog ──────────────────────────────
function AddCertBatchDialog({ open, onOpenChange, center, onSuccess }) {
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [loading, setLoading] = useState(false);

  const hasBatch = center?.cert_range_start != null;

  useEffect(() => {
    if (open) {
      setRangeStart("");
      setRangeEnd("");
    }
  }, [open]);

  const quantity =
    rangeStart && rangeEnd && parseInt(rangeEnd) >= parseInt(rangeStart)
      ? parseInt(rangeEnd) - parseInt(rangeStart) + 1
      : 0;

  const handleSubmit = async () => {
    const start = hasBatch ? center.cert_range_start : parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (!hasBatch && (!start || start <= 0)) {
      return toast.error("Range start must be a positive number");
    }
    if (!end || end <= 0)
      return toast.error("Range end must be a positive number");
    if (start > end) return toast.error("Range start must be <= range end");

    setLoading(true);
    try {
      await driveService.addCertificateBatch({
        center_id: center.center_id,
        range_start: start,
        range_end: end,
      });
      onOpenChange(false);
      toast.success(
        hasBatch
          ? `Batch extended to ${formatCertId(end)}`
          : `Batch created: ${formatCertId(start)} to ${formatCertId(end)}`,
      );
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to add batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasBatch ? "Extend Certificate Batch" : "Add Certificate Batch"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Center: </span>
            <span className="font-medium">{center?.center_name}</span>
          </div>

          {hasBatch && (
            <div className="rounded-md bg-muted/30 border border-border px-3 py-2 space-y-1 text-xs">
              <p className="font-medium text-foreground">Current batch:</p>
              <p className="text-muted-foreground font-mono">
                {formatCertId(center.cert_range_start)} —{" "}
                {formatCertId(center.cert_range_end)}
              </p>
              <p className="text-muted-foreground">
                Remaining: {center.cert_quantity} sheets
              </p>
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                Extend only: new range end must be greater than{" "}
                {formatCertId(center.cert_range_end)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="range-start">
                Range Start{" "}
                {!hasBatch && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="range-start"
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={hasBatch ? center.cert_range_start : rangeStart}
                onChange={(e) => !hasBatch && setRangeStart(e.target.value)}
                disabled={hasBatch}
              />
              {!hasBatch && rangeStart && (
                <p className="text-xs text-muted-foreground font-mono">
                  {formatCertId(parseInt(rangeStart))}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="range-end">
                Range End <span className="text-destructive">*</span>
              </Label>
              <Input
                id="range-end"
                type="number"
                min={hasBatch ? center.cert_range_end + 1 : "1"}
                placeholder={
                  hasBatch ? String(center.cert_range_end + 1) : "e.g. 200"
                }
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {rangeEnd && (
                <p className="text-xs text-muted-foreground font-mono">
                  {formatCertId(parseInt(rangeEnd))}
                </p>
              )}
            </div>
          </div>

          {quantity > 0 && (
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {hasBatch ? "Additional stock: " : "Total stock: "}
              </span>
              <span className="font-semibold text-primary">
                {quantity} sheets
              </span>
              {!hasBatch && (
                <span className="text-muted-foreground">
                  {" "}
                  ({formatCertId(parseInt(rangeStart))} to{" "}
                  {formatCertId(parseInt(rangeEnd))})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              loading ||
              (!hasBatch && quantity === 0) ||
              (hasBatch && !rangeEnd)
            }
          >
            {loading ? "Saving..." : hasBatch ? "Extend Batch" : "Create Batch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Transfer Certificate Dialog ───────────────────────────────
function TransferCertDialog({
  open,
  onOpenChange,
  fromCenter,
  allCenters,
  onSuccess,
}) {
  const [toCenterId, setToCenterId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setToCenterId("");
      setQuantity("");
      setPreview(null);
      setConfirmed(false);
    }
  }, [open]);

  useEffect(() => {
    setPreview(null);
    setConfirmed(false);
  }, [quantity, toCenterId]);

  const available = fromCenter
    ? fromCenter.cert_range_end - fromCenter.cert_current_position + 1
    : 0;

  const availableCenters = allCenters.filter(
    (c) => c.center_id !== fromCenter?.center_id,
  );

  const handlePreview = async () => {
    const qty = parseInt(quantity);
    if (!toCenterId) return toast.error("Please select a destination center");
    if (!qty || qty <= 0)
      return toast.error("Quantity must be a positive number");
    if (qty > available)
      return toast.error(`Insufficient stock. Available: ${available}`);

    setLoadingPreview(true);
    try {
      const res = await driveService.previewCertificateTransfer({
        from_center_id: fromCenter.center_id,
        to_center_id: parseInt(toCenterId),
        quantity: qty,
      });
      setPreview(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    try {
      await driveService.transferCertificateBatch({
        from_center_id: fromCenter.center_id,
        to_center_id: parseInt(toCenterId),
        quantity: parseInt(quantity),
      });
      onOpenChange(false);
      toast.success(
        `Transfer successful: ${formatCertId(preview?.transfer_start)} to ${formatCertId(preview?.transfer_end)}`,
      );
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Certificate Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* From info */}
          <div className="rounded-md bg-muted/30 border border-border px-3 py-2 space-y-1 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              From
            </p>
            <p className="font-medium">{fromCenter?.center_name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {formatCertId(fromCenter?.cert_range_start)} —{" "}
              {formatCertId(fromCenter?.cert_range_end)}
            </p>
            <p className="text-xs text-muted-foreground">
              Available:{" "}
              <span className="font-medium text-foreground">
                {available} sheets
              </span>{" "}
              (from {formatCertId(fromCenter?.cert_current_position)})
            </p>
          </div>

          {/* Destination center */}
          <div className="space-y-1.5">
            <Label>
              Destination Center <span className="text-destructive">*</span>
            </Label>
            <Select value={toCenterId} onValueChange={setToCenterId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination center..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {availableCenters.map((c) => (
                  <SelectItem key={c.center_id} value={String(c.center_id)}>
                    <div className="flex flex-col">
                      <span>{c.center_name}</span>
                      {c.cert_range_start != null ? (
                        <span className="text-xs text-muted-foreground font-mono">
                          Has batch: {formatCertId(c.cert_range_start)} to{" "}
                          {formatCertId(c.cert_range_end)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No batch yet
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-qty">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="transfer-qty"
                type="number"
                min="1"
                max={available}
                placeholder={`Max. ${available}`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={loadingPreview || !toCenterId || !quantity}
              >
                {loadingPreview ? "..." : "Preview"}
              </Button>
            </div>
            {quantity && parseInt(quantity) > 0 && (
              <p className="text-xs text-muted-foreground">
                Will transfer from end:{" "}
                <span className="font-mono font-medium">
                  {formatCertId(
                    fromCenter?.cert_range_end - parseInt(quantity) + 1,
                  )}
                </span>{" "}
                to{" "}
                <span className="font-mono font-medium">
                  {formatCertId(fromCenter?.cert_range_end)}
                </span>
              </p>
            )}
          </div>

          {/* Preview result */}
          {preview && (
            <div
              className={cn(
                "rounded-md border px-3 py-3 space-y-2 text-sm",
                preview.can_transfer
                  ? "bg-primary/5 border-primary/20"
                  : "bg-destructive/5 border-destructive/20",
              )}
            >
              <p className="font-semibold text-foreground flex items-center gap-2">
                {preview.can_transfer ? (
                  <Award className="w-4 h-4 text-primary" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
                {preview.can_transfer
                  ? "Confirm Transfer"
                  : "Transfer Cannot Be Processed"}
              </p>

              {preview.can_transfer ? (
                <>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        IDs to transfer:
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {preview.transfer_start_formatted} to{" "}
                        {preview.transfer_end_formatted}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-semibold">
                        {preview.quantity} sheets
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Remaining at {fromCenter?.center_name}:
                      </span>
                      <span className="font-semibold">
                        {preview.from_remaining_after} sheets
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="confirm-transfer"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="rounded border-input"
                    />
                    <label
                      htmlFor="confirm-transfer"
                      className="text-xs cursor-pointer"
                    >
                      I confirm this transfer
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-xs text-destructive">
                  {preview.contiguous_warning}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={handleTransfer}
            disabled={loading || !preview?.can_transfer || !confirmed}
          >
            {loading ? "Transferring..." : "Transfer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Medal Stock Dialog ────────────────────────────────────
function AddMedalDialog({ open, onOpenChange, center, onSuccess }) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setQuantity("");
  }, [open]);

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0)
      return toast.error("Quantity must be a positive number");

    setLoading(true);
    try {
      await driveService.addMedalStock({
        center_id: center.center_id,
        quantity: qty,
      });
      onOpenChange(false);
      toast.success(`Added ${qty} medals to ${center.center_name}`);
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to add medal stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Medal Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Center: </span>
            <span className="font-medium">{center?.center_name}</span>
            <span className="text-muted-foreground ml-2">
              (Current: {center?.medal_quantity ?? 0})
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medal-qty">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="medal-qty"
              type="number"
              min="1"
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Medal Stock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Transfer Medal Dialog ─────────────────────────────────────
function TransferMedalDialog({
  open,
  onOpenChange,
  fromCenter,
  allCenters,
  onSuccess,
}) {
  const [toCenterId, setToCenterId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setToCenterId("");
      setQuantity("");
    }
  }, [open]);

  const available = fromCenter?.medal_quantity ?? 0;
  const availableCenters = allCenters.filter(
    (c) => c.center_id !== fromCenter?.center_id,
  );

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!toCenterId) return toast.error("Please select a destination center");
    if (!qty || qty <= 0)
      return toast.error("Quantity must be a positive number");
    if (qty > available)
      return toast.error(`Insufficient stock. Available: ${available}`);

    setLoading(true);
    try {
      await driveService.transferMedalStock({
        from_center_id: fromCenter.center_id,
        to_center_id: parseInt(toCenterId),
        quantity: qty,
      });
      const toCenter = allCenters.find(
        (c) => c.center_id === parseInt(toCenterId),
      );
      onOpenChange(false);
      toast.success(`Transferred ${qty} medals to ${toCenter?.center_name}`);
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer Medal Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-sm">
            <p className="text-muted-foreground text-xs">From</p>
            <p className="font-medium">{fromCenter?.center_name}</p>
            <p className="text-xs text-muted-foreground">
              Available: {available} medals
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>
              Destination Center <span className="text-destructive">*</span>
            </Label>
            <Select value={toCenterId} onValueChange={setToCenterId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select destination center..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {availableCenters.map((c) => (
                  <SelectItem key={c.center_id} value={String(c.center_id)}>
                    {c.center_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medal-transfer-qty">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="medal-transfer-qty"
              type="number"
              min="1"
              max={available}
              placeholder={`Max. ${available}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Transferring..." : "Transfer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Update Threshold Dialog ───────────────────────────────────
function ThresholdDialog({ open, onOpenChange, center, onSuccess }) {
  const [certThreshold, setCertThreshold] = useState("");
  const [medalThreshold, setMedalThreshold] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && center) {
      setCertThreshold(String(center.cert_threshold ?? 10));
      setMedalThreshold(String(center.medal_threshold ?? 10));
    }
  }, [open, center]);

  const handleSubmit = async () => {
    const cert = parseInt(certThreshold);
    const medal = parseInt(medalThreshold);

    if (isNaN(cert) || cert < 0 || isNaN(medal) || medal < 0) {
      return toast.error("Thresholds must be non-negative numbers");
    }

    setLoading(true);
    try {
      await Promise.all([
        driveService.updateThreshold({
          center_id: center.center_id,
          type: "certificate",
          threshold: cert,
        }),
        driveService.updateThreshold({
          center_id: center.center_id,
          type: "medal",
          threshold: medal,
        }),
      ]);
      onOpenChange(false);
      toast.success(`Thresholds updated for ${center.center_name}`);
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update threshold");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Threshold — {center?.center_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Low stock alerts trigger when quantity falls at or below the
            threshold.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cert-threshold">Certificate Threshold</Label>
              <Input
                id="cert-threshold"
                type="number"
                min="0"
                value={certThreshold}
                onChange={(e) => setCertThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="medal-threshold">Medal Threshold</Label>
              <Input
                id="medal-threshold"
                type="number"
                min="0"
                value={medalThreshold}
                onChange={(e) => setMedalThreshold(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Thresholds"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StockPage() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addCertDialog, setAddCertDialog] = useState({
    open: false,
    center: null,
  });
  const [transferCertDialog, setTransferCertDialog] = useState({
    open: false,
    center: null,
  });
  const [addMedalDialog, setAddMedalDialog] = useState({
    open: false,
    center: null,
  });
  const [transferMedalDialog, setTransferMedalDialog] = useState({
    open: false,
    center: null,
  });
  const [thresholdDialog, setThresholdDialog] = useState({
    open: false,
    center: null,
  });

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      // Use /admin/stock which now queries vw_stock_alerts (includes batch data)
      const res = await driveService.getAdminStock();
      const data = Array.isArray(res.data) ? res.data : [res.data];
      setStockData(data);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleAction = (action, center) => {
    switch (action) {
      case "add_cert":
        setAddCertDialog({ open: true, center });
        break;
      case "transfer_cert":
        setTransferCertDialog({ open: true, center });
        break;
      case "add_medal":
        setAddMedalDialog({ open: true, center });
        break;
      case "transfer_medal":
        setTransferMedalDialog({ open: true, center });
        break;
      case "threshold":
        setThresholdDialog({ open: true, center });
        break;
    }
  };

  const totalCerts = stockData.reduce((s, c) => s + (c.cert_quantity ?? 0), 0);
  const totalMedals = stockData.reduce(
    (s, c) => s + (c.medal_quantity ?? 0),
    0,
  );
  const lowStockCount = stockData.filter(
    (c) => c.cert_low_stock || c.medal_low_stock,
  ).length;
  const noBatchCount = stockData.filter(
    (c) => c.cert_range_start == null,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        description="Manage certificate and medal stock across centers"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStock}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Summary Bar */}
      {!loading && stockData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Total Cert Remaining
            </p>
            <p className="text-2xl font-bold">{totalCerts.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Total Medals</p>
            <p className="text-2xl font-bold">{totalMedals.toLocaleString()}</p>
          </div>
          <div
            className={cn(
              "rounded-lg border bg-card px-4 py-3",
              lowStockCount > 0 ? "border-destructive/50" : "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground">Low Stock</p>
            <p
              className={cn(
                "text-2xl font-bold",
                lowStockCount > 0 && "text-destructive",
              )}
            >
              {lowStockCount}
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border bg-card px-4 py-3",
              noBatchCount > 0 ? "border-amber-500/50" : "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground">No Batch</p>
            <p
              className={cn(
                "text-2xl font-bold",
                noBatchCount > 0 && "text-amber-500",
              )}
            >
              {noBatchCount}
            </p>
          </div>
        </div>
      )}

      {/* Stock Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 h-64 animate-pulse"
            />
          ))}
        </div>
      ) : stockData.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            No stock data available
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockData.map((center) => (
            <StockCard
              key={center.center_id}
              center={center}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddCertBatchDialog
        open={addCertDialog.open}
        onOpenChange={(v) => setAddCertDialog((s) => ({ ...s, open: v }))}
        center={addCertDialog.center}
        onSuccess={fetchStock}
      />

      <TransferCertDialog
        open={transferCertDialog.open}
        onOpenChange={(v) => setTransferCertDialog((s) => ({ ...s, open: v }))}
        fromCenter={transferCertDialog.center}
        allCenters={stockData}
        onSuccess={fetchStock}
      />

      <AddMedalDialog
        open={addMedalDialog.open}
        onOpenChange={(v) => setAddMedalDialog((s) => ({ ...s, open: v }))}
        center={addMedalDialog.center}
        onSuccess={fetchStock}
      />

      <TransferMedalDialog
        open={transferMedalDialog.open}
        onOpenChange={(v) => setTransferMedalDialog((s) => ({ ...s, open: v }))}
        fromCenter={transferMedalDialog.center}
        allCenters={stockData}
        onSuccess={fetchStock}
      />

      <ThresholdDialog
        open={thresholdDialog.open}
        onOpenChange={(v) => setThresholdDialog((s) => ({ ...s, open: v }))}
        center={thresholdDialog.center}
        onSuccess={fetchStock}
      />
    </div>
  );
}
