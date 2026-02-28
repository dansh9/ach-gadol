"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Heart,
  Users,
  Calendar,
  Award,
  Star,
  Shield,
  Target,
  HandHeart,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const STATS = [
  {
    icon: Calendar,
    valueKey: "founded" as const,
    value: "2009",
    color:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: Users,
    valueKey: "volunteers_count" as const,
    value: "~250",
    color:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    icon: Heart,
    valueKey: "soldiers_yearly" as const,
    value: "~1,500",
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
];

export default function AboutPage() {
  const t = useTranslations("about");

  const awards = [
    {
      year: "2014",
      title: t("award_presidential_title"),
      subtitle: t("award_presidential_subtitle"),
      icon: Award,
    },
    {
      year: "2017",
      title: t("award_immigration_title"),
      subtitle: t("award_immigration_subtitle"),
      icon: Star,
    },
  ];

  const milestones = [
    { year: "2009", label: t("milestone_2009") },
    { year: "2012", label: t("milestone_2012") },
    { year: "2014", label: t("milestone_2014") },
    { year: "2017", label: t("milestone_2017") },
    { year: "2020", label: t("milestone_2020") },
    { year: "2024", label: t("milestone_2024") },
  ];

  const volunteerCards = [
    {
      icon: Heart,
      title: t("volunteer_mentoring_title"),
      desc: t("volunteer_mentoring_desc"),
      color:
        "from-rose-500/10 to-rose-600/5 border-rose-200/50 dark:border-rose-800/50",
      iconColor:
        "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
      icon: Shield,
      title: t("volunteer_rights_title"),
      desc: t("volunteer_rights_desc"),
      color:
        "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50",
      iconColor:
        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      icon: Users,
      title: t("volunteer_community_title"),
      desc: t("volunteer_community_desc"),
      color:
        "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50",
      iconColor:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
  ];

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
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.08)] px-4 py-1.5 text-sm font-medium text-[hsl(var(--accent-foreground))]">
              <Shield className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span>{t("org_name")}</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t("description")}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Mission Section ===== */}
      <section className="border-y border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex rounded-xl bg-[hsl(var(--primary)/0.1)] p-3">
              <Target className="h-8 w-8 text-[hsl(var(--primary))]" />
            </div>
            <blockquote className="text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
              &ldquo;{t("mission")}&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* ===== Stats Section ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STATS.map((stat) => (
              <div
                key={stat.valueKey}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mx-auto mb-4 inline-flex rounded-xl p-3 ${stat.color}`}
                >
                  <stat.icon className="h-7 w-7" />
                </div>
                <div className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium text-muted-foreground">
                  {t(stat.valueKey)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Awards Section ===== */}
      <section className="border-y border-border/40 bg-[hsl(var(--accent)/0.04)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("presidential_award")}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {awards.map((award) => (
              <div
                key={award.year}
                className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--accent)/0.3)] bg-gradient-to-br from-[hsl(var(--accent)/0.08)] to-transparent p-8 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-[hsl(var(--accent)/0.15)] p-3">
                  <award.icon className="h-7 w-7 text-[hsl(var(--accent))]" />
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--accent))]">
                  {award.year}
                </div>
                <p className="mt-2 text-lg font-medium text-foreground">
                  {award.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {award.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Timeline Section ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("history_title")}
            </h2>
          </div>

          <div className="relative mt-12">
            {/* Vertical line */}
            <div className="absolute start-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border sm:block" />

            <div className="space-y-8 sm:space-y-0">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex flex-col items-center gap-4 sm:flex-row sm:gap-0 ${
                    index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`w-full sm:w-[calc(50%-2rem)] ${
                      index % 2 === 0
                        ? "sm:text-end sm:pe-8"
                        : "sm:text-start sm:ps-8"
                    }`}
                  >
                    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="text-lg font-bold text-[hsl(var(--primary))]">
                        {milestone.year}
                      </div>
                      <p className="text-sm text-foreground">
                        {milestone.label}
                      </p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="z-10 hidden h-4 w-4 flex-shrink-0 rounded-full border-2 border-[hsl(var(--primary))] bg-background sm:block" />

                  {/* Spacer */}
                  <div className="hidden w-[calc(50%-2rem)] sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Volunteers Section ===== */}
      <section className="border-t border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
              <HandHeart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("volunteers_title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {volunteerCards.map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border bg-gradient-to-br p-6 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8 ${item.color}`}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${item.iconColor}`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA to volunteer */}
          <div className="mt-12 text-center">
            <Link
              href="/volunteer"
              className="group inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-[hsl(var(--primary)/0.25)] transition-all hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.3)] hover:brightness-110"
            >
              <HandHeart className="h-5 w-5" />
              <span>{t("join_volunteers")}</span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 rtl:hidden" />
              <ArrowRight className="hidden h-4 w-4 transition-transform group-hover:translate-x-1 rtl:inline-block" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
