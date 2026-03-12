import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Star,
  MessageSquare,
  Upload,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

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

// ─── Helpers ─────────────────────────────────────────────────
const countWords = (text) =>
  text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

// ─── Sub-components ──────────────────────────────────────────
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
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

// ─── Main Page ───────────────────────────────────────────────
export default function FinalReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const enrollment = location.state?.enrollment;

  const [form, setForm] = useState({
    academic_year: "",
    period: "",
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

  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const wordCountOk = wordCount >= MIN_WORD_COUNT;

  const allScoresFilled = SKILLS.every((s) => form[s.key] !== "");

  const isFormValid =
    enrollment?.enrollment_id &&
    form.academic_year.trim() &&
    form.period.trim() &&
    allScoresFilled &&
    wordCountOk;

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setScore = (key) => (val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError(null);

    try {
      const payload = {
        enrollment_id: enrollment.enrollment_id,
        academic_year: form.academic_year.trim(),
        period: form.period.trim(),
        score_creativity: form.score_creativity,
        score_critical_thinking: form.score_critical_thinking,
        score_attention: form.score_attention,
        score_responsibility: form.score_responsibility,
        score_coding_skills: form.score_coding_skills,
        content: form.content.trim(),
      };

      const res = await api.post("/teacher/reports", payload);
      setUploadedData(res.data.data);
      setUploaded(true);
    } catch (err) {
      setError(
        err.response?.data?.message ??
          "Failed to upload report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Guard ──
  if (!enrollment) {
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

  // ── Success state ──
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

  // ── Main form ──
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

      {/* ── Info bar ── */}
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

      {/* ── Period ── */}
      <SectionCard icon={CalendarDays} title="Learning Period">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Academic Year
            </label>
            <input
              type="text"
              value={form.academic_year}
              onChange={set("academic_year")}
              placeholder="e.g. 2024/2025"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Period
            </label>
            <input
              type="text"
              value={form.period}
              onChange={set("period")}
              placeholder="e.g. Semester 1"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Scores ── */}
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

      {/* ── Comment ── */}
      <SectionCard icon={MessageSquare} title="Teacher's Notes">
        <div className="space-y-2">
          <textarea
            value={form.content}
            onChange={set("content")}
            placeholder="Write notes about the student's progress, recommendations, or areas to improve. Minimum 120 words."
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

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isFormValid || loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
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
    </div>
  );
}
