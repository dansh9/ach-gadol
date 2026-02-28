"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Briefcase,
  CheckCircle2,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface DashboardStats {
  openCases: number;
  pendingApprovals: number;
  activeSessions: number;
  kbDocuments: number;
}

export default function VolunteerDashboardPage() {
  const t = useTranslations("volunteer_dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchStats() {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    {
      title: t("open_cases"),
      value: stats?.openCases ?? 0,
      icon: Briefcase,
      href: "/volunteer/cases",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: t("pending_approvals"),
      value: stats?.pendingApprovals ?? 0,
      icon: CheckCircle2,
      href: "/volunteer/approvals",
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: t("active_chats"),
      value: stats?.activeSessions ?? 0,
      icon: MessageSquare,
      href: "/volunteer/cases",
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: t("kb_documents"),
      value: stats?.kbDocuments ?? 0,
      icon: BookOpen,
      href: "/volunteer/kb",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t("dashboard_title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard_subtitle")}</p>
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
            onClick={() => { setError(false); setLoading(true); fetchStats(); }}
            className="mt-4 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">
                  {card.value}
                </p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
