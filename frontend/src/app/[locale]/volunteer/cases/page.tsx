"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Loader2,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

interface Case {
  id: string;
  title: string;
  notes: string | null;
  case_status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  awaiting_human: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  awaiting_soldier: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  closed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const PRIORITY_ICONS: Record<string, typeof Clock> = {
  low: Clock,
  medium: Clock,
  high: AlertTriangle,
  urgent: AlertTriangle,
};

export default function VolunteerCasesPage() {
  const t = useTranslations("volunteer_dashboard");
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  async function fetchCases() {
    try {
      setError(false);
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/cases${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCases(data.cases || []);
    } catch (error) {
      console.error("Failed to fetch cases:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCases();
  }, [statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("cases_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {cases.length} {t("cases_count")}
          </p>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setLoading(true);
            }}
            className="appearance-none rounded-xl border border-border bg-card px-4 py-2 pe-10 text-sm text-foreground outline-none focus:border-[hsl(var(--primary))]"
          >
            <option value="">{t("all_statuses")}</option>
            <option value="open">{t("status_open")}</option>
            <option value="in_progress">{t("status_in_progress")}</option>
            <option value="awaiting_human">{t("status_awaiting")}</option>
            <option value="closed">{t("status_closed")}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-20">
          <AlertTriangle className="mb-4 h-12 w-12 text-amber-500/50" />
          <p className="text-muted-foreground">{t("load_error")}</p>
          <button
            onClick={() => { setError(false); setLoading(true); fetchCases(); }}
            className="mt-4 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
          >
            {t("retry")}
          </button>
        </div>
      ) : cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-20">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t("no_cases")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const PriorityIcon = PRIORITY_ICONS[c.priority] ?? Clock;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">
                      {c.title || t("untitled_case")}
                    </h3>
                    {c.notes && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {c.notes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {c.priority === "high" || c.priority === "urgent" ? (
                      <PriorityIcon className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.case_status] ?? STATUS_COLORS.open}`}
                    >
                      {c.case_status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
