import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  Upload,
  CheckCircle2,
  FileText,
  RotateCcw,
  Search,
  X,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import teacherActionService from "@/services/teacherActionService";
import driveService from "@/services/driveService";
import { toast } from "sonner";

// ── Font config ──────────────────────────────────────────────
const FONT_URLS = {
  playfair: "/fonts/PlayfairDisplay-Bold.ttf",
  montserrat: "/fonts/Montserrat-Bold.ttf",
};

const fontBase64Cache = {};

const fetchFontAsBase64 = async (name, url) => {
  if (fontBase64Cache[name]) return fontBase64Cache[name];
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load font "${name}"`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  const base64 = `data:font/truetype;base64,${btoa(binary)}`;
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

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// [FIX-1] toYMD diperbaiki untuk menghindari timezone off-by-one.
//
// MASALAH SEBELUMNYA:
//   new Date("2024-12-01") diinterpretasi sebagai UTC midnight (00:00 UTC).
//   Di timezone GMT+7, ini menjadi 2024-12-01 07:00 WIB — masih benar.
//   TAPI getFullYear/getMonth/getDate membaca waktu LOCAL, bukan UTC.
//   Sebaliknya, di timezone dengan offset negatif (misal GMT-5):
//   UTC midnight = 2024-11-30 19:00 lokal → getDate() = 30, bukan 1.
//   Hasilnya: tanggal di-kirim ke backend sebagai "2024-11-30" padahal
//   seharusnya "2024-12-01" → backend validator menolak atau data salah.
//
// SOLUSI:
//   Jika nilai sudah dalam format YYYY-MM-DD, gunakan langsung tanpa parsing.
//   Ini menghilangkan keterlibatan timezone sama sekali.
//   Jika nilai adalah ISO string (mengandung 'T'), split pada 'T' dan ambil
//   bagian tanggal saja — hasilnya selalu YYYY-MM-DD tanpa konversi timezone.
//   Hanya gunakan new Date() sebagai fallback terakhir untuk format lain.
const toYMD = (val) => {
  if (!val) return null;

  // Sudah YYYY-MM-DD — gunakan langsung, tidak perlu parsing sama sekali
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  // ISO string (e.g. "2024-12-01T00:00:00.000Z") — split pada 'T'
  // Ini timezone-safe karena kita ambil bagian date string mentah,
  // bukan hasil konversi ke local time.
  if (typeof val === "string" && val.includes("T")) {
    return val.split("T")[0];
  }

  // Date object atau format lain — parse manual komponen UTC
  // Gunakan getUTC* bukan get* agar tidak terpengaruh timezone lokal
  const d = new Date(val);
  if (isNaN(d)) return null;

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const buildPrintHTML = ({
  studentName,
  moduleName,
  ptcDate,
  moduleColor,
  playfairBase64,
  montserratBase64,
}) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Certificate</title>
<style>
@font-face { font-family:'Playfair Display'; font-weight:700; src:url('${playfairBase64}') format('truetype'); }
@font-face { font-family:'Montserrat'; font-weight:700; src:url('${montserratBase64}') format('truetype'); }
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4 landscape;margin:0;}
html,body{width:297mm;height:210mm;overflow:hidden;}
.certificate{width:297mm;height:210mm;position:relative;background:#fff;}
.student-name{position:absolute;top:98.8mm;left:0;right:0;text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:34pt;font-weight:700;text-transform:uppercase;color:#000;line-height:1;white-space:nowrap;letter-spacing:0.02em;}
.module-name{position:absolute;top:142.20mm;left:0;right:0;text-align:center;font-family:'Montserrat',Arial,sans-serif;font-size:28pt;font-weight:700;color:${moduleColor};line-height:1;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.ptc-date{position:absolute;top:172.50mm;left:73.8mm;font-family:'Montserrat',Arial,sans-serif;font-size:18pt;font-weight:700;color:#000;line-height:1;white-space:nowrap;}
</style></head>
<body><div class="certificate">
<div class="student-name">${studentName || ""}</div>
<div class="module-name">${moduleName || ""}</div>
<div class="ptc-date">${formatPtcDate(ptcDate)}</div>
</div>
<script>document.fonts.ready.then(()=>{requestAnimationFrame(()=>{requestAnimationFrame(()=>{window.print();window.onafterprint=()=>window.close();});});});</script>
</body></html>`;

const buildBatchPrintHTML = ({
  items,
  moduleColor,
  playfairBase64,
  montserratBase64,
}) => {
  const pages = items
    .map(
      ({ studentName, moduleName, ptcDate }) => `
<div class="certificate">
<div class="student-name">${studentName || ""}</div>
<div class="module-name">${moduleName || ""}</div>
<div class="ptc-date">${formatPtcDate(ptcDate)}</div>
</div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><title>Certificates</title>
<style>
@font-face { font-family:'Playfair Display'; font-weight:700; src:url('${playfairBase64}') format('truetype'); }
@font-face { font-family:'Montserrat'; font-weight:700; src:url('${montserratBase64}') format('truetype'); }
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4 landscape;margin:0;}
html,body{overflow:hidden;}
.certificate{width:297mm;height:210mm;position:relative;background:#fff;page-break-after:always;}
.certificate:last-child{page-break-after:avoid;}
.student-name{position:absolute;top:98.8mm;left:0;right:0;text-align:center;font-family:'Playfair Display',Georgia,serif;font-size:34pt;font-weight:700;text-transform:uppercase;color:#000;line-height:1;white-space:nowrap;letter-spacing:0.02em;}
.module-name{position:absolute;top:142.20mm;left:0;right:0;text-align:center;font-family:'Montserrat',Arial,sans-serif;font-size:28pt;font-weight:700;color:${moduleColor};line-height:1;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.ptc-date{position:absolute;top:172.50mm;left:73.8mm;font-family:'Montserrat',Arial,sans-serif;font-size:18pt;font-weight:700;color:#000;line-height:1;white-space:nowrap;}
</style></head>
<body>${pages}
<script>document.fonts.ready.then(()=>{requestAnimationFrame(()=>{requestAnimationFrame(()=>{window.print();window.onafterprint=()=>window.close();});});});</script>
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
          className="relative w-8 h-8 rounded-full border-2 transition-all duration-150 focus:outline-none"
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
function UploadScanButton({ certId, isReprint = false, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !certId) return;

    setUploading(true);
    try {
      await driveService.uploadScan(certId, file, isReprint);
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
        size="sm"
        className="w-full"
        disabled={!certId || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {uploading ? "Uploading..." : "Upload Scan"}
      </Button>
    </>
  );
}

// ── Certificate Preview ──────────────────────────────────────
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
              fontWeight: 700,
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
              fontWeight: 700,
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
              fontWeight: 700,
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

// ── Status Badge helper ──────────────────────────────────────
function EnrollmentStatusBadge({ status }) {
  const map = {
    pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
    cert_printed: {
      label: "Cert Printed",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    scan_uploaded: {
      label: "Scan Uploaded",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    report_uploaded: {
      label: "Report Uploaded",
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    complete: {
      label: "Complete",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  };
  const s = map[status] ?? { label: status ?? "—", className: "bg-muted" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}

// ── After-print scan upload panel ───────────────────────────
function ScanUploadPanel({ printedItems, onAllUploaded }) {
  const navigate = useNavigate();
  const [uploadedIds, setUploadedIds] = useState(new Set());

  const markUploaded = (enrollmentId) => {
    setUploadedIds((prev) => {
      const next = new Set(prev);
      next.add(enrollmentId);
      return next;
    });
  };

  const allDone =
    printedItems.length > 0 &&
    printedItems.every((item) =>
      uploadedIds.has(item.enrollment.enrollment_id),
    );

  useEffect(() => {
    if (allDone) onAllUploaded?.();
  }, [allDone, onAllUploaded]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Upload Scanned Certificates</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upload the scanned certificate for each student below.
        </p>
      </div>

      <div className="space-y-2">
        {printedItems.map((item) => {
          const uploaded = uploadedIds.has(item.enrollment.enrollment_id);
          return (
            <div
              key={item.enrollment.enrollment_id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.enrollment.student_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.enrollment.module_name}
                  {item.isReprint && (
                    <span className="ml-1.5 text-amber-500 font-medium">
                      · Reprint
                    </span>
                  )}
                </p>
              </div>
              <div className="shrink-0 w-36">
                {uploaded ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Uploaded
                  </div>
                ) : (
                  <UploadScanButton
                    certId={item.certId}
                    isReprint={item.isReprint}
                    onUploadSuccess={() =>
                      markUploaded(item.enrollment.enrollment_id)
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-sm text-green-700 dark:text-green-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            All scans uploaded successfully.
          </div>
          {printedItems.some((i) => !i.isReprint) && (
            <Button
              className="w-full"
              onClick={() => {
                const nonReprintItems = printedItems
                  .filter((i) => !i.isReprint)
                  .map((i) => i.enrollment);
                if (nonReprintItems.length === 1) {
                  navigate("/teacher/final-report", {
                    state: { enrollment: nonReprintItems[0] },
                  });
                } else {
                  navigate("/teacher/final-report", {
                    state: { enrollments: nonReprintItems },
                  });
                }
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Final Report
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function PrintPage() {
  const [activeEnrollments, setActiveEnrollments] = useState([]);
  const [reprintEnrollments, setReprintEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("active");

  const [printSelected, setPrintSelected] = useState(new Set());
  const [reprintSelected, setReprintSelected] = useState(new Set());

  const [ptcDate, setPtcDate] = useState("");
  const [moduleColorKey, setModuleColorKey] = useState("cornflowerblue");

  const [printing, setPrinting] = useState(false);
  const [printedItems, setPrintedItems] = useState(null);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, allRes, certsRes] = await Promise.all([
        teacherActionService.getEnrollments({ limit: 200 }),
        teacherActionService.getEnrollments({
          limit: 200,
          include_inactive: "true",
        }),
        teacherActionService.getCertificates({
          limit: 500,
          is_reprint: "false",
        }),
      ]);

      const activeData = activeRes.data ?? [];
      const allData = allRes.data ?? [];
      const certsData = certsRes.data ?? [];

      // Build map: enrollment_id → { originalCertId, originalPtcDate }
      // [FIX-1] toYMD sekarang timezone-safe — tidak ada off-by-one lagi
      const certMap = {};
      for (const cert of certsData) {
        if (!certMap[cert.enrollment_id]) {
          certMap[cert.enrollment_id] = {
            originalCertId: cert.id,
            originalPtcDate: toYMD(cert.ptc_date),
          };
        }
      }

      const active = activeData.filter(
        (e) => e.enrollment_status === "pending",
      );

      const seenIds = new Set();
      const reprint = allData
        .filter((e) => {
          if ((e.cert_printed_count ?? 0) === 0) return false;
          if (e.enrollment_status === "pending") return false;
          if (seenIds.has(e.enrollment_id)) return false;
          seenIds.add(e.enrollment_id);
          return true;
        })
        .map((e) => ({
          ...e,
          originalCertId: certMap[e.enrollment_id]?.originalCertId ?? null,
          originalPtcDate: certMap[e.enrollment_id]?.originalPtcDate ?? null,
        }));

      setActiveEnrollments(active);
      setReprintEnrollments(reprint);
    } catch {
      toast.error("Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Preload fonts saat komponen mount agar tidak ada jeda saat print pertama
  useEffect(() => {
    fetchFontAsBase64("playfair", FONT_URLS.playfair).catch(() => {});
    fetchFontAsBase64("montserrat", FONT_URLS.montserrat).catch(() => {});
  }, []);

  const currentList =
    viewMode === "active" ? activeEnrollments : reprintEnrollments;

  const filtered = useMemo(() => {
    if (!search) return currentList;
    const q = search.toLowerCase();
    return currentList.filter(
      (e) =>
        e.student_name?.toLowerCase().includes(q) ||
        e.module_name?.toLowerCase().includes(q),
    );
  }, [currentList, search]);

  const togglePrint = (id) => {
    setPrintSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleReprint = (id) => {
    setReprintSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const firstSelectedId =
    viewMode === "active"
      ? ([...printSelected][0] ?? null)
      : ([...reprintSelected][0] ?? null);

  const previewEnrollment = firstSelectedId
    ? currentList.find((e) => e.enrollment_id === firstSelectedId)
    : null;

  const previewPtcDate =
    viewMode === "reprint"
      ? (previewEnrollment?.originalPtcDate ?? null)
      : ptcDate;

  const totalPrint = printSelected.size;
  const totalReprint = reprintSelected.size;
  const totalSelected = viewMode === "active" ? totalPrint : totalReprint;

  const canPrint =
    viewMode === "active" ? totalSelected > 0 && !!ptcDate : totalSelected > 0;

  const handlePrint = async () => {
    if (viewMode === "active" && !ptcDate) {
      toast.error("PTC date is required");
      return;
    }
    if (totalSelected === 0) {
      toast.error("Select at least one student");
      return;
    }

    setPrinting(true);
    try {
      const [playfairBase64, montserratBase64] = await Promise.all([
        fetchFontAsBase64("playfair", FONT_URLS.playfair),
        fetchFontAsBase64("montserrat", FONT_URLS.montserrat),
      ]);

      const moduleColor =
        MODULE_COLORS[moduleColorKey]?.printValue ?? "cornflowerblue";

      const isReprintMode = viewMode === "reprint";

      const selectedIds = isReprintMode
        ? [...reprintSelected]
        : [...printSelected];

      const printItems = selectedIds
        .map((id) => ({
          enrollment: currentList.find((e) => e.enrollment_id === id),
          isReprint: isReprintMode,
        }))
        .filter((item) => item.enrollment);

      const resultItems = [];

      if (!isReprintMode) {
        if (printItems.length === 1) {
          const response = await teacherActionService.printCert({
            enrollment_id: printItems[0].enrollment.enrollment_id,
            ptc_date: ptcDate,
          });
          resultItems.push({
            enrollment: printItems[0].enrollment,
            certId: response.data?.id,
            isReprint: false,
          });
        } else {
          const response = await teacherActionService.printCertBatch({
            items: printItems.map((i) => ({
              enrollment_id: i.enrollment.enrollment_id,
              ptc_date: ptcDate,
            })),
          });
          const certs = response?.data?.certs ?? [];
          const certMap = Object.fromEntries(
            certs.map((c) => [c.enrollment_id, c]),
          );
          printItems.forEach((i) => {
            resultItems.push({
              enrollment: i.enrollment,
              certId: certMap[i.enrollment.enrollment_id]?.id ?? null,
              isReprint: false,
            });
          });
        }
      } else {
        for (const item of printItems) {
          const { originalCertId, originalPtcDate } = item.enrollment;

          if (!originalCertId) {
            toast.error(
              `No original certificate found for ${item.enrollment.student_name}`,
            );
            continue;
          }

          if (!originalPtcDate) {
            toast.error(
              `Original PTC date not found for ${item.enrollment.student_name}`,
            );
            continue;
          }

          const response = await teacherActionService.reprintCert({
            original_cert_id: originalCertId,
            // [FIX-1] originalPtcDate sudah YYYY-MM-DD dari toYMD yang fixed
            ptc_date: originalPtcDate,
          });
          resultItems.push({
            enrollment: item.enrollment,
            certId: response.data?.id,
            isReprint: true,
          });
        }
      }

      const allPrintData = printItems.map((i) => ({
        studentName: i.enrollment.student_name,
        moduleName: i.enrollment.module_name,
        ptcDate: isReprintMode
          ? (i.enrollment.originalPtcDate ?? ptcDate)
          : ptcDate,
      }));

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups and try again.");
        return;
      }

      if (allPrintData.length === 1) {
        printWindow.document.write(
          buildPrintHTML({
            studentName: allPrintData[0].studentName,
            moduleName: allPrintData[0].moduleName,
            ptcDate: allPrintData[0].ptcDate,
            moduleColor,
            playfairBase64,
            montserratBase64,
          }),
        );
      } else {
        printWindow.document.write(
          buildBatchPrintHTML({
            items: allPrintData,
            moduleColor,
            playfairBase64,
            montserratBase64,
          }),
        );
      }
      printWindow.document.close();

      toast.success(
        `${allPrintData.length} certificate${allPrintData.length > 1 ? "s" : ""} sent to printer`,
      );

      setPrintedItems(resultItems);
      if (isReprintMode) {
        setReprintSelected(new Set());
      } else {
        setPrintSelected(new Set());
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Print failed");
    } finally {
      setPrinting(false);
    }
  };

  if (printedItems) {
    return (
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-xl font-bold">Print Certificate</h1>
          <p className="text-sm text-muted-foreground">
            Upload scans for the printed certificates.
          </p>
        </div>
        <ScanUploadPanel printedItems={printedItems} onAllUploaded={() => {}} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPrintedItems(null);
            fetchEnrollments();
          }}
        >
          Print More
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Print Certificate</h1>
        <p className="text-sm text-muted-foreground">
          Select students from the table below to print their certificates.
        </p>
      </div>

      {/* ── Enrollment Table ── */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
            <button
              onClick={() => {
                setViewMode("active");
                setPrintSelected(new Set());
                setReprintSelected(new Set());
                setSearch("");
              }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              Print
            </button>
            <button
              onClick={() => {
                setViewMode("reprint");
                setPrintSelected(new Set());
                setReprintSelected(new Set());
                setSearch("");
              }}
              className={`px-4 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                viewMode === "reprint"
                  ? "bg-amber-500 text-white"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Reprint
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search student or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selection badge + clear */}
          {totalSelected > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              {viewMode === "active" ? (
                <Badge variant="default" className="text-xs">
                  {totalPrint} selected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs text-amber-500 border-amber-500/40"
                >
                  {totalReprint} selected
                </Badge>
              )}
              <button
                onClick={() => {
                  setPrintSelected(new Set());
                  setReprintSelected(new Set());
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                  {viewMode === "reprint" ? "Reprint" : "Print"}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Module
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Center
                </th>
                {viewMode === "reprint" && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Original PTC Date
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={viewMode === "reprint" ? 6 : 5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading enrollments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={viewMode === "reprint" ? 6 : 5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {viewMode === "active"
                      ? "No pending enrollments found."
                      : "No printed enrollments found."}
                  </td>
                </tr>
              ) : (
                filtered.map((enrollment, idx) => {
                  const id = enrollment.enrollment_id;
                  const isChecked =
                    viewMode === "active"
                      ? printSelected.has(id)
                      : reprintSelected.has(id);

                  return (
                    <tr
                      key={id}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-accent/30 ${
                        isChecked
                          ? viewMode === "reprint"
                            ? "bg-amber-500/5"
                            : "bg-primary/5"
                          : idx % 2 === 0
                            ? "bg-background"
                            : "bg-muted/10"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() =>
                              viewMode === "active"
                                ? togglePrint(id)
                                : toggleReprint(id)
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">
                          {enrollment.student_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {enrollment.module_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">
                          {enrollment.center_name ?? "—"}
                        </span>
                      </td>
                      {viewMode === "reprint" && (
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-foreground">
                            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {enrollment.originalPtcDate ? (
                              formatDateDisplay(enrollment.originalPtcDate)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <EnrollmentStatusBadge
                          status={enrollment.enrollment_status}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Print Settings ── */}
      <div className="glass-card rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Print Settings
          {totalSelected > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              — {totalSelected === 1 ? "Single" : "Batch"} mode
              {totalSelected > 1 && ` (${totalSelected} certificates)`}
            </span>
          )}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {viewMode === "active" ? (
            <div className="space-y-1.5">
              <Label htmlFor="ptc-date">
                PTC Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ptc-date"
                type="date"
                value={ptcDate}
                onChange={(e) => setPtcDate(e.target.value)}
                className="h-9"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>PTC Date</Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>
                  {previewEnrollment?.originalPtcDate
                    ? formatDateDisplay(previewEnrollment.originalPtcDate)
                    : "Uses original print date"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Module Name Color</Label>
            <ColorSwatchPicker
              value={moduleColorKey}
              onChange={setModuleColorKey}
            />
          </div>
        </div>

        {viewMode === "reprint" && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            <RotateCcw className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Reprint will use the same PTC date as the original certificate.
            </span>
          </div>
        )}

        <Button
          className="w-full sm:w-auto"
          onClick={handlePrint}
          disabled={printing || !canPrint}
        >
          {printing ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Preparing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {viewMode === "reprint" ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              {totalSelected === 0
                ? viewMode === "reprint"
                  ? "Reprint Certificate"
                  : "Print Certificate"
                : totalSelected === 1
                  ? `${viewMode === "reprint" ? "Reprint" : "Print"} 1 Certificate`
                  : `${viewMode === "reprint" ? "Reprint" : "Print"} ${totalSelected} Certificates`}
            </span>
          )}
        </Button>

        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg text-xs space-y-1">
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

      {/* ── Preview ── */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Preview
          {previewEnrollment && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              — {previewEnrollment.student_name}
            </span>
          )}
        </h3>
        <CertPreview
          studentName={previewEnrollment?.student_name ?? ""}
          moduleName={previewEnrollment?.module_name ?? ""}
          ptcDate={previewPtcDate}
          moduleColorKey={moduleColorKey}
        />
      </div>
    </div>
  );
}
