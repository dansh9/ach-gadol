"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Approval {
  id: string;
  approval_type: string;
  risk_level: string;
  status: string;
  ai_suggestion: Record<string, unknown> | null;
  created_at: string;
}

const RISK_COLORS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  yellow: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function VolunteerApprovalsPage() {
  const t = useTranslations("volunteer_dashboard");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function fetchApprovals() {
    try {
      const res = await fetch("/api/approvals?status=pending");
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
      }
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApprovals((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to update approval:", error);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("approvals_title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {approvals.length} {t("pending_items")}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-20">
          <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500/50" />
          <p className="text-muted-foreground">{t("no_approvals")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLORS[approval.risk_level] ?? RISK_COLORS.yellow}`}
                    >
                      {approval.risk_level.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {approval.approval_type.replace(/_/g, " ")}
                    </span>
                  </div>

                  {approval.ai_suggestion && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        AI Suggestion:
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {typeof approval.ai_suggestion === "object"
                          ? JSON.stringify(approval.ai_suggestion).slice(0, 200)
                          : String(approval.ai_suggestion)}
                      </p>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(approval.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-shrink-0 gap-2">
                  <button
                    onClick={() => handleDecision(approval.id, "approved")}
                    disabled={actionLoading === approval.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    {actionLoading === approval.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {t("approve")}
                  </button>
                  <button
                    onClick={() => handleDecision(approval.id, "rejected")}
                    disabled={actionLoading === approval.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                  >
                    <XCircle className="h-3 w-3" />
                    {t("reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
