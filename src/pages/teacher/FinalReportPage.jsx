import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Star,
  MessageSquare,
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/services/api";
import { toast } from "sonner";

// ─── Print Helper ────────────────────────────────────────────
const printReport = async (reportId) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Popup blocked. Allow popups and try again.");
    return;
  }
  printWindow.document.write(
    `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#888">
      <p>Preparing report for print...</p>
    </body></html>`,
  );

  try {
    const res = await api.get(`/drive/reports/${reportId}/download`, {
      responseType: "arraybuffer",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    printWindow.location.href = url;
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        URL.revokeObjectURL(url);
      };
    };
  } catch {
    printWindow.close();
  }
};

const printReportsBatch = async (reportIds) => {
  for (let i = 0; i < reportIds.length; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    await printReport(reportIds[i]);
  }
};

// ─── Constants ───────────────────────────────────────────────
const SCORE_VALUES = ["A+", "A", "B+", "B"];

const SKILLS = [
  { key: "score_creativity", label: "Creativity" },
  { key: "score_critical_thinking", label: "Critical Thinking" },
  { key: "score_attention", label: "Attention" },
  { key: "score_responsibility", label: "Responsibility" },
  { key: "score_coding_skills", label: "Coding Skills" },
];

const SCORE_COLORS = {
  "A+": "bg-emerald-500",
  A: "bg-blue-500",
  "B+": "bg-amber-500",
  B: "bg-orange-500",
  "": "bg-muted",
};

const SCORE_BAR_WIDTH = {
  "A+": "100%",
  A: "80%",
  "B+": "60%",
  B: "40%",
  "": "0%",
};

const MIN_WORD_COUNT = 120;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = (() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 20 }, (_, i) => current + i);
})();

const EMPTY_FORM = {
  score_creativity: "",
  score_critical_thinking: "",
  score_attention: "",
  score_responsibility: "",
  score_coding_skills: "",
  content: "",
};

const EMPTY_SHARED = {
  year_start: "",
  year_end: "",
  period_start: "",
  period_end: "",
};

// ─── Helpers ─────────────────────────────────────────────────
const countWords = (text) =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

const buildPeriodLabel = (start, end) => {
  if (!start || !end) return "—";
  return start === end ? start : `${start} – ${end}`;
};

const buildPeriodValue = (start, end) => {
  if (!start || !end) return "";
  return start === end ? start : `${start} - ${end}`;
};

// ─── Sub-components ──────────────────────────────────────────
function SectionCard({ icon: IconComponent, title, children }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <IconComponent className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ScoreSelect({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {SCORE_VALUES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(value === s ? "" : s)}
          className={`
            w-10 h-8 rounded-md text-xs font-semibold border transition-all duration-150
            ${
              value === s
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-input hover:border-primary/50 hover:text-foreground"
            }
          `}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─── Shared Period Form (batch) ───────────────────────────────
function SharedPeriodForm({ shared, setShared }) {
  const set = (key) => (val) => setShared((prev) => ({ ...prev, [key]: val }));

  return (
    <SectionCard
      icon={CalendarDays}
      title="Learning Period (Shared for All Students)"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Academic Year
          </label>
          <div className="flex items-center gap-2">
            <Select
              value={shared.year_start}
              onValueChange={(val) =>
                setShared((prev) => ({
                  ...prev,
                  year_start: val,
                  year_end:
                    prev.year_end && Number(prev.year_end) < Number(val)
                      ? ""
                      : prev.year_end,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent position="popper">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground shrink-0">/</span>
            <Select
              value={shared.year_end}
              onValueChange={set("year_end")}
              disabled={!shared.year_start}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent position="popper">
                {YEARS.filter(
                  (y) => !shared.year_start || y >= Number(shared.year_start),
                ).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {shared.year_start && shared.year_end && (
            <p className="text-xs text-muted-foreground">
              {shared.year_start}/{shared.year_end}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Period
          </label>
          <div className="flex items-center gap-2">
            <Select
              value={shared.period_start}
              onValueChange={(val) =>
                setShared((prev) => ({
                  ...prev,
                  period_start: val,
                  period_end: prev.period_end === val ? "" : prev.period_end,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent position="popper">
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground shrink-0">–</span>
            <Select
              value={shared.period_end}
              onValueChange={set("period_end")}
              disabled={!shared.period_start}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent position="popper">
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {shared.period_start && shared.period_end && (
            <p className="text-xs text-muted-foreground">
              {buildPeriodLabel(shared.period_start, shared.period_end)}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Per-student Form (scores + content only) ────────────────
function StudentReportForm({ enrollment, form, setForm, error }) {
  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const wordCountOk = wordCount >= MIN_WORD_COUNT;

  const setScore = (key) => (val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      <div className="glass-card px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Student:{" "}
          <span className="font-medium text-foreground">
            {enrollment.student_name}
          </span>
        </span>
        <span className="text-muted-foreground">
          Module:{" "}
          <span className="font-medium text-foreground">
            {enrollment.module_name}
          </span>
        </span>
        <span className="text-muted-foreground">
          Center:{" "}
          <span className="font-medium text-foreground">
            {enrollment.center_name}
          </span>
        </span>
      </div>

      <SectionCard icon={Star} title="Scores per Skill">
        <div className="space-y-3.5">
          {SKILLS.map((skill) => {
            const val = form[skill.key];
            return (
              <div key={skill.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground w-36 shrink-0">
                    {skill.label}
                  </span>
                  <ScoreSelect value={val} onChange={setScore(skill.key)} />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${SCORE_COLORS[val]}`}
                    style={{ width: SCORE_BAR_WIDTH[val] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={MessageSquare} title="Teacher's Notes">
        <div className="space-y-2">
          <textarea
            value={form.content}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder={`Write notes about the student's progress, recommendations, or areas to improve. Minimum ${MIN_WORD_COUNT} words.`}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Minimum {MIN_WORD_COUNT} words
            </span>
            <span
              className={
                wordCountOk
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : wordCount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              }
            >
              {wordCount} / {MIN_WORD_COUNT} words
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                wordCountOk ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{
                width: `${Math.min((wordCount / MIN_WORD_COUNT) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Full Report Form (single mode) ──────────────────────────
function ReportForm({ enrollment, form, setForm, error }) {
  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const wordCountOk = wordCount >= MIN_WORD_COUNT;

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setScore = (key) => (val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-5">
      <div className="glass-card px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Student:{" "}
          <span className="font-medium text-foreground">
            {enrollment.student_name}
          </span>
        </span>
        <span className="text-muted-foreground">
          Module:{" "}
          <span className="font-medium text-foreground">
            {enrollment.module_name}
          </span>
        </span>
        <span className="text-muted-foreground">
          Center:{" "}
          <span className="font-medium text-foreground">
            {enrollment.center_name}
          </span>
        </span>
      </div>

      <SectionCard icon={CalendarDays} title="Learning Period">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Academic Year
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={form.year_start}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    year_start: val,
                    year_end:
                      prev.year_end && Number(prev.year_end) < Number(val)
                        ? ""
                        : prev.year_end,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground shrink-0">/</span>
              <Select
                value={form.year_end}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, year_end: val }))
                }
                disabled={!form.year_start}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {YEARS.filter(
                    (y) => !form.year_start || y >= Number(form.year_start),
                  ).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.year_start && form.year_end && (
              <p className="text-xs text-muted-foreground">
                {form.year_start}/{form.year_end}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Period
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={form.period_start}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    period_start: val,
                    period_end: prev.period_end === val ? "" : prev.period_end,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground shrink-0">–</span>
              <Select
                value={form.period_end}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, period_end: val }))
                }
                disabled={!form.period_start}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.period_start && form.period_end && (
              <p className="text-xs text-muted-foreground">
                {buildPeriodLabel(form.period_start, form.period_end)}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Star} title="Scores per Skill">
        <div className="space-y-3.5">
          {SKILLS.map((skill) => {
            const val = form[skill.key];
            return (
              <div key={skill.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-foreground w-36 shrink-0">
                    {skill.label}
                  </span>
                  <ScoreSelect value={val} onChange={setScore(skill.key)} />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${SCORE_COLORS[val]}`}
                    style={{ width: SCORE_BAR_WIDTH[val] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={MessageSquare} title="Teacher's Notes">
        <div className="space-y-2">
          <textarea
            value={form.content}
            onChange={set("content")}
            placeholder={`Write notes about the student's progress, recommendations, or areas to improve. Minimum ${MIN_WORD_COUNT} words.`}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Minimum {MIN_WORD_COUNT} words
            </span>
            <span
              className={
                wordCountOk
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : wordCount > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              }
            >
              {wordCount} / {MIN_WORD_COUNT} words
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                wordCountOk ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{
                width: `${Math.min((wordCount / MIN_WORD_COUNT) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Single Mode ─────────────────────────────────────────────
function SingleMode({ enrollment }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    year_start: "",
    year_end: "",
    period_start: "",
    period_end: "",
    score_creativity: "",
    score_critical_thinking: "",
    score_attention: "",
    score_responsibility: "",
    score_coding_skills: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const wordCountOk = wordCount >= MIN_WORD_COUNT;
  const allScoresFilled = SKILLS.every((s) => form[s.key] !== "");
  const isFormValid =
    form.year_start &&
    form.year_end &&
    form.period_start &&
    form.period_end &&
    allScoresFilled &&
    wordCountOk;

  const doUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/teacher/reports", {
        enrollment_id: enrollment.enrollment_id,
        academic_year: `${form.year_start}/${form.year_end}`,
        period: buildPeriodValue(form.period_start, form.period_end),
        score_creativity: form.score_creativity,
        score_critical_thinking: form.score_critical_thinking,
        score_attention: form.score_attention,
        score_responsibility: form.score_responsibility,
        score_coding_skills: form.score_coding_skills,
        content: form.content.trim(),
      });
      const data = res.data.data;
      setUploadedData(data);
      setUploaded(true);
      if (data?.id) printReport(data.id);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Failed to upload report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="max-w-lg mx-auto py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Final Report Uploaded
        </h2>
        <p className="text-sm text-muted-foreground">
          Report for{" "}
          <span className="font-medium text-foreground">
            {enrollment.student_name}
          </span>{" "}
          has been generated and uploaded to Google Drive.
        </p>
        {uploadedData?.drive_upload_failed && (
          <div className="w-full rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            Report saved but failed to upload to Drive:{" "}
            {uploadedData.drive_upload_error}
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => navigate("/teacher/print")}>
            Back to Print
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/teacher/history")}
          >
            View History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Final Report"
        description={`${enrollment.student_name} · ${enrollment.module_name}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        }
      />

      <ReportForm
        enrollment={enrollment}
        form={form}
        setForm={setForm}
        error={error}
      />

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Generate & Upload
            </span>
          )}
        </Button>
      </div>

      {/* Confirm Dialog — Single */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm Report Upload"
        description={
          `Student: ${enrollment.student_name}\n` +
          `Module: ${enrollment.module_name}\n` +
          `Academic Year: ${form.year_start}/${form.year_end}\n` +
          `Period: ${buildPeriodLabel(form.period_start, form.period_end)}\n\n` +
          `The report will be generated and uploaded to Google Drive. This action cannot be undone.`
        }
        confirmLabel="Yes, Upload & Print"
        cancelLabel="Review Again"
        loading={loading}
        onConfirm={() => {
          setConfirmOpen(false);
          doUpload();
        }}
      />
    </div>
  );
}

// ─── Batch Mode ──────────────────────────────────────────────
function BatchMode({ enrollments }) {
  const navigate = useNavigate();

  const [shared, setShared] = useState({ ...EMPTY_SHARED });
  const [forms, setForms] = useState(() =>
    enrollments.map(() => ({ ...EMPTY_FORM })),
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errors] = useState(() => enrollments.map(() => null));
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentEnrollment = enrollments[currentIdx];
  const currentForm = forms[currentIdx];

  const setCurrentForm = (updater) =>
    setForms((prev) =>
      prev.map((f, i) =>
        i === currentIdx
          ? typeof updater === "function"
            ? updater(f)
            : updater
          : f,
      ),
    );

  const wordCount = useMemo(
    () => countWords(currentForm.content),
    [currentForm.content],
  );
  const wordCountOk = wordCount >= MIN_WORD_COUNT;
  const allScoresFilled = SKILLS.every((s) => currentForm[s.key] !== "");
  const currentFormValid = allScoresFilled && wordCountOk;

  const sharedValid =
    shared.year_start &&
    shared.year_end &&
    shared.period_start &&
    shared.period_end;

  const isFormReady = (f) =>
    SKILLS.every((s) => f[s.key] !== "") &&
    countWords(f.content) >= MIN_WORD_COUNT;

  const allFormsValid = sharedValid && forms.every(isFormReady);

  const doUploadAll = async () => {
    setUploading(true);
    const results = [];
    const successfulReportIds = [];

    const academicYear = `${shared.year_start}/${shared.year_end}`;
    const period = buildPeriodValue(shared.period_start, shared.period_end);

    for (let i = 0; i < enrollments.length; i++) {
      const enrollment = enrollments[i];
      const form = forms[i];
      try {
        const res = await api.post("/teacher/reports", {
          enrollment_id: enrollment.enrollment_id,
          academic_year: academicYear,
          period,
          score_creativity: form.score_creativity,
          score_critical_thinking: form.score_critical_thinking,
          score_attention: form.score_attention,
          score_responsibility: form.score_responsibility,
          score_coding_skills: form.score_coding_skills,
          content: form.content.trim(),
        });
        const data = res.data.data;
        results.push({ enrollment, success: true, data });
        if (data?.id) successfulReportIds.push(data.id);
      } catch (err) {
        results.push({
          enrollment,
          success: false,
          error: err.response?.data?.message ?? "Upload failed",
        });
      }
    }

    setUploadResults(results);
    setUploading(false);

    if (successfulReportIds.length > 0) {
      printReportsBatch(successfulReportIds);
    }
  };

  if (uploadResults) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Batch Upload Complete"
          description={`${uploadResults.filter((r) => r.success).length} of ${uploadResults.length} reports uploaded`}
        />
        <div className="space-y-2">
          {uploadResults.map((result, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                result.success
                  ? "border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/10"
                  : "border-destructive/20 bg-destructive/5"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {result.enrollment.student_name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {result.enrollment.module_name}
                </p>
              </div>
              {result.success ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Uploaded
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-destructive shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/teacher/print")}>
            Back to Print
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/teacher/history")}
          >
            View History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Final Reports"
        description="Fill in shared settings once, then scores & notes per student."
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        }
      />

      <SharedPeriodForm shared={shared} setShared={setShared} />

      {/* Step indicator */}
      <div className="glass-card px-5 py-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Student{" "}
            <span className="font-semibold text-foreground">
              {currentIdx + 1}
            </span>{" "}
            of {enrollments.length}
          </span>
          <span>
            {forms.filter(isFormReady).length} / {enrollments.length} ready
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {enrollments.map((e, i) => {
            const ready = isFormReady(forms[i]);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIdx(i)}
                title={e.student_name}
                className={`h-2 rounded-full transition-all duration-150 ${
                  i === currentIdx
                    ? "w-6 bg-primary"
                    : ready
                      ? "w-2 bg-emerald-500"
                      : "w-2 bg-muted-foreground/30"
                }`}
              />
            );
          })}
        </div>
      </div>

      <StudentReportForm
        enrollment={currentEnrollment}
        form={currentForm}
        setForm={setCurrentForm}
        error={errors[currentIdx]}
      />

      <div className="flex items-center justify-between gap-3 pb-6">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((i) => i - 1)}
          disabled={currentIdx === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        <div className="flex gap-2">
          {currentIdx < enrollments.length - 1 ? (
            <Button
              onClick={() => setCurrentIdx((i) => i + 1)}
              disabled={!currentFormValid}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!allFormsValid || uploading}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload All Reports
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Dialog — Batch */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Confirm Upload ${enrollments.length} Report${enrollments.length > 1 ? "s" : ""}`}
        description={
          `Academic Year: ${shared.year_start}/${shared.year_end}\n` +
          `Period: ${buildPeriodLabel(shared.period_start, shared.period_end)}\n\n` +
          `${enrollments.length} report${enrollments.length > 1 ? "s" : ""} will be generated and uploaded to Google Drive:\n` +
          enrollments
            .map((e, i) => `${i + 1}. ${e.student_name} (${e.module_name})`)
            .join("\n") +
          `\n\nThis action cannot be undone.`
        }
        confirmLabel={`Yes, Upload & Print ${enrollments.length} Report${enrollments.length > 1 ? "s" : ""}`}
        cancelLabel="Review Again"
        loading={uploading}
        onConfirm={() => {
          setConfirmOpen(false);
          doUploadAll();
        }}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function FinalReportPage() {
  const location = useLocation();

  const enrollment = location.state?.enrollment;
  const enrollments = location.state?.enrollments;

  if (!enrollment && !enrollments?.length) {
    return <NoEnrollmentGuard />;
  }

  if (enrollments?.length) {
    return <BatchMode enrollments={enrollments} />;
  }

  return <SingleMode enrollment={enrollment} />;
}

function NoEnrollmentGuard() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto py-20 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        No enrollment selected
      </h2>
      <p className="text-sm text-muted-foreground">
        Please open this page from the Print page after uploading a scanned
        certificate.
      </p>
      <Button variant="outline" onClick={() => navigate("/teacher/print")}>
        Go to Print
      </Button>
    </div>
  );
}
