"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  HandHeart,
  LogIn,
  Briefcase,
  CheckCircle2,
  MessageSquare,
  BookOpen,
} from "lucide-react";

const FEATURES = [
  {
    icon: Briefcase,
    titleKey: "open_cases" as const,
    color:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: CheckCircle2,
    titleKey: "pending_approvals" as const,
    color:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    icon: MessageSquare,
    titleKey: "active_chats" as const,
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    icon: BookOpen,
    titleKey: "kb_documents" as const,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

export default function VolunteerLandingPage() {
  const t = useTranslations("volunteer_dashboard");

  return (
    <div className="flex flex-col">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.05)] via-transparent to-transparent" />
          <div className="absolute -top-24 end-0 h-[500px] w-[500px] rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl" />
          <div className="absolute -bottom-24 start-0 h-[400px] w-[400px] rounded-full bg-[hsl(var(--primary)/0.06)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.08)] px-4 py-1.5 text-sm font-medium text-[hsl(var(--accent-foreground))]">
              <HandHeart className="h-4 w-4 text-[hsl(var(--accent))]" />
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t("volunteer_landing_title")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("volunteer_landing_subtitle")}
            </p>

            <div className="mt-8">
              <Link
                href="/volunteer/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-[hsl(var(--primary)/0.25)] transition-all hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.3)] hover:brightness-110"
              >
                <LogIn className="h-5 w-5" />
                <span>{t("volunteer_login_button")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section className="border-t border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.titleKey}
                className="group rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mx-auto mb-4 inline-flex rounded-xl p-3 ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t(feature.titleKey)}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
