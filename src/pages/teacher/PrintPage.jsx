import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import teacherActionService from "@/services/teacherActionService";
import driveService from "@/services/driveService";
import { toast } from "sonner";

// ── Font config ──────────────────────────────────────────────
const FONT_URLS = {
  playfair:
    "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYh0o.woff2",
  montserrat:
    "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Ew-.woff2",
};
const fontBase64Cache = {};

const fetchFontAsBase64 = async (name, url) => {
  if (fontBase64Cache[name]) return fontBase64Cache[name];
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  const base64 = `data:font/woff2;base64,${btoa(binary)}`;
  fontBase64Cache[name] = base64;
  return base64;
};

// ── Color options ────────────────────────────────────────────
const MODULE_COLORS = {
  magenta: { label: "Magenta", hex: "#d946a8", printValue: "magenta" },
  cornflowerblue: {
    label: "Cornflower Blue",
    hex: "#6495ED",
    printValue: "cornflowerblue",
  },
};

// ── Helpers ──────────────────────────────────────────────────
const formatPtcDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  return d
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .replace(/(\d+) (\w+) (\d+)/, "$1 $2, $3");
};

// ── Build print HTML (single cert) ──────────────────────────
const buildPrintHTML = ({
  studentName,
  moduleName,
  ptcDate,
  moduleColor,
  playfairBase64,
  montserratBase64,
}) => {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Certificate</title>
<style>
@font-face { font-family:'Playfair Display'; font-weight:400; src:url('${playfairBase64}') format('woff2'); }
@font-face { font-family:'Montserrat'; font-weight:600; src:url('${montserratBase64}') format('woff2'); }
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4 landscape;margin:0;}
html,body{width:297mm;height:210mm;overflow:hidden;}
.certificate{width:297mm;height:210mm;position:relative;background:#fff;}
.student-name{position:absolute;top:98.8mm;left:0;right:0;text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:34pt;font-weight:400;text-transform:uppercase;color:#000;line-height:1;white-space:nowrap;letter-spacing:0.02em;}
.module-name{position:absolute;top:142.20mm;left:0;right:0;text-align:center;font-family:'Montserrat',Arial,sans-serif;font-size:28pt;font-weight:600;color:${moduleColor};line-height:1;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.ptc-date{position:absolute;top:172.50mm;left:73.8mm;font-family:'Montserrat',Arial,sans-serif;font-size:18pt;font-weight:600;color:#000;line-height:1;white-space:nowrap;}
</style></head>
<body><div class="certificate">
<div class="student-name">${studentName || ""}</div>
<div class="module-name">${moduleName || ""}</div>
<div class="ptc-date">${formatPtcDate(ptcDate)}</div>
</div>
<script>document.fonts.ready.then(()=>{requestAnimationFrame(()=>{requestAnimationFrame(()=>{window.print();window.onafterprint=()=>window.close();});});});<\/script>
</body></html>`;
};

// ── Build print HTML (batch — multiple pages) ─────────────
const buildBatchPrintHTML = ({ items, playfairBase64, montserratBase64 }) => {
  const pages = items
    .map(({ studentName, moduleName, ptcDate, moduleColor }) => {
      return `<div class="certificate">
<div class="student-name">${studentName || ""}</div>
<div class="module-name" style="color:${moduleColor}">${moduleName || ""}</div>
<div class="ptc-date">${formatPtcDate(ptcDate)}</div>
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Certificates</title>
<style>
@font-face { font-family:'Playfair Display'; font-weight:400; src:url('${playfairBase64}') format('woff2'); }
@font-face { font-family:'Montserrat'; font-weight:600; src:url('${montserratBase64}') format('woff2'); }
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4 landscape;margin:0;}
html,body{overflow:hidden;}
.certificate{width:297mm;height:210mm;position:relative;background:#fff;page-break-after:always;}
.certificate:last-child{page-break-after:avoid;}
.student-name{position:absolute;top:98.8mm;left:0;right:0;text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:34pt;font-weight:400;text-transform:uppercase;color:#000;line-height:1;white-space:nowrap;letter-spacing:0.02em;}
.module-name{position:absolute;top:142.20mm;left:0;right:0;text-align:center;font-family:'Montserrat',Arial,sans-serif;font-size:28pt;font-weight:600;line-height:1;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.ptc-date{position:absolute;top:172.50mm;left:73.8mm;font-family:'Montserrat',Arial,sans-serif;font-size:18pt;font-weight:600;color:#000;line-height:1;white-space:nowrap;}
</style></head>
<body>${pages}
<script>document.fonts.ready.then(()=>{requestAnimationFrame(()=>{requestAnimationFrame(()=>{window.print();window.onafterprint=()=>window.close();});});});<\/script>
</body></html>`;
};

// ── Color Swatch Picker ──────────────────────────────────────
function ColorSwatchPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      {Object.entries(MODULE_COLORS).map(([key, color]) => (
        <button
          key={key}
          type="button"
          title={color.label}
          onClick={() => onChange(key)}
          className="relative w-8 h-8 rounded-full border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{
            backgroundColor: color.hex,
            borderColor: value === key ? "#000" : "transparent",
            boxShadow:
              value === key
                ? "0 0 0 2px #fff, 0 0 0 4px #000"
                : "0 1px 3px rgba(0,0,0,0.2)",
            transform: value === key ? "scale(1.15)" : "scale(1)",
          }}
        >
          {value === key && (
            <span className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2
                className="w-3.5 h-3.5"
                style={{
                  color: "#fff",
                  filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))",
                }}
              />
            </span>
          )}
        </button>
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {MODULE_COLORS[value]?.label}
      </span>
    </div>
  );
}

// ── Upload Scan Button ───────────────────────────────────────
function UploadScanButton({ certId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !certId) return;

    setUploading(true);
    try {
      await driveService.uploadScan(certId, file);
      toast.success("Scan uploaded successfully");
      onUploadSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        className="w-full"
        disabled={!certId || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploading ? "Uploading..." : "Upload Scanned Certificate"}
      </Button>
    </>
  );
}

// ── Certificate Preview (scaled) ─────────────────────────────
function CertPreview({ studentName, moduleName, ptcDate, moduleColorKey }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 1122);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const moduleColorHex =
    MODULE_COLORS[moduleColorKey]?.hex ?? MODULE_COLORS.cornflowerblue.hex;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-muted rounded-lg overflow-hidden"
      style={{ aspectRatio: "297 / 210" }}
    >
      <div className="absolute top-2 left-3 text-xs text-muted-foreground font-medium uppercase tracking-wide z-10">
        Preview A4
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1122px",
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            width: "1122px",
            height: "793px",
            position: "relative",
            background: "#fff",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "373px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "46px",
              fontWeight: 400,
              textTransform: "uppercase",
              color: "#000",
              lineHeight: 1,
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}
          >
            {studentName || <span style={{ color: "#ccc" }}>STUDENT NAME</span>}
          </div>
          <div
            style={{
              position: "absolute",
              top: "537px",
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "38px",
              fontWeight: 600,
              color: moduleName ? moduleColorHex : "#ccc",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {moduleName || "Module Name"}
          </div>
          <div
            style={{
              position: "absolute",
              top: "652px",
              left: "279px",
              fontFamily: "'Montserrat', Arial, sans-serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "#000",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {ptcDate ? (
              formatPtcDate(ptcDate)
            ) : (
              <span style={{ color: "#ccc" }}>PTC Date</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Enrollment Combobox ──────────────────────────────────────
function EnrollmentCombobox({ value, onChange, enrollments, loading }) {
  const [open, setOpen] = useState(false);
  const selected = enrollments.find((e) => e.enrollment_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.student_name} — {selected.module_name}
            </span>
          ) : (
            <span className="text-muted-foreground">Search enrollment...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search student or module..." />
          <CommandList>
            {loading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : enrollments.length === 0 ? (
              <CommandEmpty>No active enrollments found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {enrollments.map((e) => (
                  <CommandItem
                    key={e.enrollment_id}
                    value={`${e.student_name} ${e.module_name}`}
                    onSelect={() => {
                      onChange(e);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{e.student_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.module_name} · {e.center_name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Single Print Tab ─────────────────────────────────────────
function SinglePrintTab({ enrollments, loadingEnrollments }) {
  const navigate = useNavigate();

  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [ptcDate, setPtcDate] = useState("");
  const [moduleColorKey, setModuleColorKey] = useState("cornflowerblue");
  const [printing, setPrinting] = useState(false);
  const [printedCert, setPrintedCert] = useState(null);
  const [scanUploaded, setScanUploaded] = useState(false);

  const handleEnrollmentChange = (e) => {
    setSelectedEnrollment(e);
    setPrintedCert(null);
    setScanUploaded(false);
  };

  const handlePrint = async () => {
    if (!selectedEnrollment) {
      toast.error("Please select an enrollment");
      return;
    }
    if (!ptcDate) {
      toast.error("PTC date is required");
      return;
    }
    setPrinting(true);
    try {
      const [playfairBase64, montserratBase64] = await Promise.all([
        fetchFontAsBase64("playfair", FONT_URLS.playfair),
        fetchFontAsBase64("montserrat", FONT_URLS.montserrat),
      ]);

      const response = await teacherActionService.printCert({
        enrollment_id: selectedEnrollment.enrollment_id,
        ptc_date: ptcDate,
      });
      const cert = response.data;
      setPrintedCert(cert);
      setScanUploaded(false);

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups and try again.");
        return;
      }

      const moduleColorPrint =
        MODULE_COLORS[moduleColorKey]?.printValue ?? "cornflowerblue";

      printWindow.document.write(
        buildPrintHTML({
          studentName: selectedEnrollment.student_name,
          moduleName: selectedEnrollment.module_name,
          ptcDate,
          moduleColor: moduleColorPrint,
          playfairBase64,
          montserratBase64,
        }),
      );
      printWindow.document.close();
      toast.success("Certificate sent to printer");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Print failed");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
      {/* Form */}
      <Card className="lg:sticky lg:top-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Certificate Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Enrollment <span className="text-destructive">*</span>
            </Label>
            <EnrollmentCombobox
              value={selectedEnrollment?.enrollment_id}
              onChange={handleEnrollmentChange}
              enrollments={enrollments}
              loading={loadingEnrollments}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              PTC Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={ptcDate}
              onChange={(e) => setPtcDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Module Name Color</Label>
            <ColorSwatchPicker
              value={moduleColorKey}
              onChange={setModuleColorKey}
            />
          </div>

          <Button
            className="w-full"
            onClick={handlePrint}
            disabled={printing || !selectedEnrollment || !!printedCert}
          >
            <Printer className="w-4 h-4 mr-2" />
            {printing
              ? "Preparing..."
              : printedCert
                ? "Certificate Printed ✓"
                : "Print Certificate"}
          </Button>

          {/* Upload scan — hanya muncul setelah print berhasil */}
          {printedCert && !scanUploaded && (
            <UploadScanButton
              certId={printedCert.id}
              onUploadSuccess={() => setScanUploaded(true)}
            />
          )}

          {/* ── FIX: Setelah scan diupload, tampilkan tombol ke FinalReportPage ── */}
          {scanUploaded && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Scan uploaded successfully.</span>
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  navigate("/teacher/final-report", {
                    state: { enrollment: selectedEnrollment },
                  })
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                Buat Final Report
              </Button>
            </div>
          )}

          {/* Tips */}
          <div
            className="p-3 rounded-lg text-xs space-y-1"
            style={{ background: "#fef3c7", border: "1px solid #f59e0b" }}
          >
            <p className="font-semibold" style={{ color: "#92400e" }}>
              Print Tips
            </p>
            <ol
              className="list-decimal ml-4 space-y-1"
              style={{ color: "#78350f" }}
            >
              <li>
                Paper size: <strong>A4 Landscape</strong>
              </li>
              <li>
                Uncheck <strong>Headers and footers</strong>
              </li>
              <li>
                Set margins to <strong>None</strong>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="w-full max-w-2xl mx-auto lg:mx-0">
        <CertPreview
          studentName={selectedEnrollment?.student_name ?? ""}
          moduleName={selectedEnrollment?.module_name ?? ""}
          ptcDate={ptcDate}
          moduleColorKey={moduleColorKey}
        />
      </div>
    </div>
  );
}

// ── Batch Print Tab ──────────────────────────────────────────
const EMPTY_ITEM = () => ({
  enrollment: null,
  ptcDate: "",
  moduleColorKey: "cornflowerblue",
});

function BatchPrintTab({ enrollments, loadingEnrollments }) {
  const [items, setItems] = useState([EMPTY_ITEM()]);
  const [printing, setPrinting] = useState(false);

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()]);
  const removeItem = (idx) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleBatchPrint = async () => {
    const valid = items.filter((i) => i.enrollment && i.ptcDate);
    if (valid.length === 0) {
      toast.error("Add at least one complete item");
      return;
    }
    if (valid.length !== items.length) {
      toast.error("Fill in all items or remove incomplete ones");
      return;
    }

    setPrinting(true);
    try {
      const [playfairBase64, montserratBase64] = await Promise.all([
        fetchFontAsBase64("playfair", FONT_URLS.playfair),
        fetchFontAsBase64("montserrat", FONT_URLS.montserrat),
      ]);

      await teacherActionService.printCertBatch({
        items: valid.map((i) => ({
          enrollment_id: i.enrollment.enrollment_id,
          ptc_date: i.ptcDate,
        })),
      });

      const printItems = valid.map((i) => ({
        studentName: i.enrollment.student_name,
        moduleName: i.enrollment.module_name,
        ptcDate: i.ptcDate,
        moduleColor:
          MODULE_COLORS[i.moduleColorKey]?.printValue ?? "cornflowerblue",
      }));

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups and try again.");
        return;
      }
      printWindow.document.write(
        buildBatchPrintHTML({
          items: printItems,
          playfairBase64,
          montserratBase64,
        }),
      );
      printWindow.document.close();
      toast.success(`${valid.length} certificates sent to printer`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Batch print failed");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Enrollment</Label>
                    <EnrollmentCombobox
                      value={item.enrollment?.enrollment_id}
                      onChange={(e) => updateItem(idx, "enrollment", e)}
                      enrollments={enrollments}
                      loading={loadingEnrollments}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">PTC Date</Label>
                    <Input
                      type="date"
                      value={item.ptcDate}
                      onChange={(e) =>
                        updateItem(idx, "ptcDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Module Name Color</Label>
                    <ColorSwatchPicker
                      value={item.moduleColorKey}
                      onChange={(v) => updateItem(idx, "moduleColorKey", v)}
                    />
                  </div>
                </div>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {item.enrollment && (
                <p className="text-xs text-muted-foreground mt-2 ml-0.5">
                  {item.enrollment.module_name} · {item.enrollment.center_name}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-2" /> Add Student
        </Button>
        <Button size="sm" onClick={handleBatchPrint} disabled={printing}>
          <Printer className="w-4 h-4 mr-2" />
          {printing
            ? "Preparing..."
            : `Print ${items.filter((i) => i.enrollment && i.ptcDate).length} Certificate(s)`}
        </Button>
      </div>

      {/* Tips */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg text-xs space-y-1 max-w-sm">
        <p className="font-semibold text-amber-900 dark:text-amber-300">
          Print Tips
        </p>
        <ol className="list-decimal ml-4 space-y-1 text-amber-800 dark:text-amber-200/90">
          <li>
            Paper size: <strong>A4 Landscape</strong>
          </li>
          <li>
            Uncheck <strong>Headers and footers</strong>
          </li>
          <li>
            Set margins to <strong>None</strong>
          </li>
        </ol>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function PrintPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);

  const fetchEnrollments = useCallback(async () => {
    setLoadingEnrollments(true);
    try {
      const res = await teacherActionService.getEnrollments({ limit: 200 });
      setEnrollments(res.data ?? []);
    } catch {
      toast.error("Failed to load enrollments");
    } finally {
      setLoadingEnrollments(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Print Certificate</h1>
        <p className="text-sm text-muted-foreground">
          Print single or batch certificates for your students.
        </p>
      </div>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4">
          <SinglePrintTab
            enrollments={enrollments}
            loadingEnrollments={loadingEnrollments}
          />
        </TabsContent>
        <TabsContent value="batch" className="mt-4">
          <BatchPrintTab
            enrollments={enrollments}
            loadingEnrollments={loadingEnrollments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
