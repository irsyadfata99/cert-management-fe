import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  ArrowRightLeft,
  Settings2,
  RefreshCw,
  Package,
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

// ── Stock Card ────────────────────────────────────────────────
function StockCard({ center, onAction }) {
  const certLow = center.cert_stock <= center.cert_threshold;
  const medalLow = center.medal_stock <= center.medal_threshold;

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

      {/* Stock rows */}
      <div className="space-y-3">
        {/* Certificate */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Certificate</p>
            <p
              className={cn(
                "text-lg font-bold leading-tight",
                certLow && "text-destructive",
              )}
            >
              {center.cert_stock}
            </p>
            <p className="text-xs text-muted-foreground">
              threshold: {center.cert_threshold}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onAction("add", center, "certificate")}
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onAction("transfer", center, "certificate")}
            >
              <ArrowRightLeft className="h-3 w-3" /> Transfer
            </Button>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Medal */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Medal</p>
            <p
              className={cn(
                "text-lg font-bold leading-tight",
                medalLow && "text-destructive",
              )}
            >
              {center.medal_stock}
            </p>
            <p className="text-xs text-muted-foreground">
              threshold: {center.medal_threshold}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onAction("add", center, "medal")}
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onAction("transfer", center, "medal")}
            >
              <ArrowRightLeft className="h-3 w-3" /> Transfer
            </Button>
          </div>
        </div>
      </div>

      {/* Threshold */}
      <div className="pt-1 border-t border-border">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1 text-muted-foreground w-full"
          onClick={() => onAction("threshold", center, null)}
        >
          <Settings2 className="h-3 w-3" /> Update Threshold
        </Button>
      </div>
    </div>
  );
}

// ── Add Stock Dialog ──────────────────────────────────────────
function AddStockDialog({ open, onOpenChange, center, stockType, onSuccess }) {
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setQuantity("");
  }, [open]);

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }
    setLoading(true);
    try {
      await driveService.addStock({
        center_id: center.center_id,
        type: stockType,
        quantity: qty,
      });
      onOpenChange(false);
      toast.success(`Added ${qty} ${stockType}(s) to ${center.center_name}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Stock — {stockType === "certificate" ? "Certificate" : "Medal"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Center</Label>
            <p className="text-sm text-muted-foreground">
              {center?.center_name}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-qty">
              Quantity to Add <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-qty"
              type="number"
              min="1"
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          {center && (
            <p className="text-xs text-muted-foreground">
              Current stock:{" "}
              <span className="font-medium">
                {stockType === "certificate"
                  ? center.cert_stock
                  : center.medal_stock}
              </span>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Stock"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Transfer Stock Dialog ─────────────────────────────────────
function TransferStockDialog({
  open,
  onOpenChange,
  fromCenter,
  stockType,
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

  const availableTargets = allCenters.filter(
    (c) => c.center_id !== fromCenter?.center_id,
  );

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!toCenterId) {
      toast.error("Please select a destination center");
      return;
    }
    if (!qty || qty <= 0) {
      toast.error("Quantity must be a positive number");
      return;
    }
    const currentQty =
      stockType === "certificate"
        ? fromCenter.cert_stock
        : fromCenter.medal_stock;
    if (qty > currentQty) {
      toast.error(`Insufficient stock. Current: ${currentQty}`);
      return;
    }
    setLoading(true);
    try {
      await driveService.transferStock({
        type: stockType,
        from_center_id: fromCenter.center_id,
        to_center_id: parseInt(toCenterId),
        quantity: qty,
      });
      const toCenter = allCenters.find(
        (c) => c.center_id === parseInt(toCenterId),
      );
      onOpenChange(false);
      toast.success(
        `Transferred ${qty} ${stockType}(s) to ${toCenter?.center_name}`,
      );
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to transfer stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Transfer Stock —{" "}
            {stockType === "certificate" ? "Certificate" : "Medal"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>From</Label>
            <p className="text-sm text-muted-foreground">
              {fromCenter?.center_name} &nbsp;
              <span className="font-medium text-foreground">
                (
                {stockType === "certificate"
                  ? fromCenter?.cert_stock
                  : fromCenter?.medal_stock}{" "}
                available)
              </span>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>
              To Center <span className="text-destructive">*</span>
            </Label>
            <Select value={toCenterId} onValueChange={setToCenterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination center" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No other centers available
                  </div>
                ) : (
                  availableTargets.map((c) => (
                    <SelectItem key={c.center_id} value={String(c.center_id)}>
                      {c.center_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="transfer-qty">
              Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="transfer-qty"
              type="number"
              min="1"
              placeholder="e.g. 50"
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
      setCertThreshold(String(center.cert_threshold));
      setMedalThreshold(String(center.medal_threshold));
    }
  }, [open, center]);

  const handleSubmit = async () => {
    const cert = parseInt(certThreshold);
    const medal = parseInt(medalThreshold);

    if (isNaN(cert) || cert < 0 || isNaN(medal) || medal < 0) {
      toast.error("Thresholds must be non-negative numbers");
      return;
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
      toast.error(err.response?.data?.message ?? "Failed to update threshold");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Threshold — {center?.center_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Stock alerts will be triggered when quantity falls at or below the
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

  // Dialog state
  const [addDialog, setAddDialog] = useState({
    open: false,
    center: null,
    type: null,
  });
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    center: null,
    type: null,
  });
  const [thresholdDialog, setThresholdDialog] = useState({
    open: false,
    center: null,
  });

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await driveService.getAdminStock();
      setStockData(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleAction = (action, center, type) => {
    if (action === "add") {
      setAddDialog({ open: true, center, type });
    } else if (action === "transfer") {
      setTransferDialog({ open: true, center, type });
    } else if (action === "threshold") {
      setThresholdDialog({ open: true, center });
    }
  };

  const totalCerts = stockData.reduce((s, c) => s + (c.cert_stock ?? 0), 0);
  const totalMedals = stockData.reduce((s, c) => s + (c.medal_stock ?? 0), 0);
  const lowStockCount = stockData.filter(
    (c) =>
      c.cert_stock <= c.cert_threshold || c.medal_stock <= c.medal_threshold,
  ).length;

  return (
    <div className="space-y-6">
      {/* FIX: prop name was "action" (singular) — PageHeader only accepts "actions" */}
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
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Total Certificates</p>
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
            <p className="text-xs text-muted-foreground">
              Centers with Low Stock
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                lowStockCount > 0 && "text-destructive",
              )}
            >
              {lowStockCount}
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
              className="rounded-xl border border-border bg-card p-5 h-52 animate-pulse"
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
      <AddStockDialog
        open={addDialog.open}
        onOpenChange={(v) => setAddDialog((s) => ({ ...s, open: v }))}
        center={addDialog.center}
        stockType={addDialog.type}
        onSuccess={fetchStock}
      />

      <TransferStockDialog
        open={transferDialog.open}
        onOpenChange={(v) => setTransferDialog((s) => ({ ...s, open: v }))}
        fromCenter={transferDialog.center}
        stockType={transferDialog.type}
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
