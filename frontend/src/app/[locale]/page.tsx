"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  BookOpen,
  ClipboardCheck,
  MessageCircle,
  Users,
  ArrowLeft,
  ArrowRight,
  Shield,
  Heart,
  Star,
} from "lucide-react";

/**
 * Home page for Ach Gadol - Big Brother for Lone Soldiers.
 *
 * Sections:
 * 1. Hero - Large title, subtitle, two CTA buttons
 * 2. Stats - Soldiers helped, volunteers, rights covered
 * 3. Features - 4 cards grid (Rights Info, Eligibility, Chat, Guidance)
 * 4. CTA - Final call to action
 */

const FEATURE_ICONS = [BookOpen, ClipboardCheck, MessageCircle, Users] as const;

const FEATURE_KEYS = [
  "rights_info",
  "eligibility_checker",
  "ai_chat",
  "personal_guidance",
] as const;

const FEATURE_LINKS = ["/rights", "/check", "/chat", "/volunteer"] as const;

const FEATURE_COLORS = [
  "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50",
  "from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50",
  "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50",
  "from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50",
] as const;

const FEATURE_ICON_COLORS = [
  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
] as const;

export default function HomePage() {
  const tHero = useTranslations("hero");
  const tFeatures = useTranslations("features");
  const tCta = useTranslations("cta");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.03)] via-transparent to-transparent" />
          <div className="absolute -top-24 end-0 h-[500px] w-[500px] rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl" />
          <div className="absolute -bottom-24 start-0 h-[400px] w-[400px] rounded-full bg-[hsl(var(--primary)/0.06)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8 lg:pb-32 lg:pt-36">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.08)] px-4 py-1.5 text-sm font-medium text-[hsl(var(--accent-foreground))]">
              <Shield className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span>אח גדול למען חיילים בודדים</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {tHero("title")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {tHero("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/check"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-[hsl(var(--primary)/0.25)] transition-all hover:shadow-xl hover:shadow-[hsl(var(--primary)/0.3)] hover:brightness-110 sm:w-auto"
              >
                <ClipboardCheck className="h-5 w-5" />
                {tHero("cta_check")}
              </Link>
              <Link
                href="/chat"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.08)] px-8 py-4 text-base font-semibold text-[hsl(var(--accent-foreground))] transition-all hover:bg-[hsl(var(--accent)/0.15)] sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                {tHero("cta_chat")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats Section ===== */}
      <section className="border-y border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <StatsCard
              icon={<Heart className="h-6 w-6 text-[hsl(var(--accent))]" />}
              value={tHero("stats_soldiers")}
            />
            <StatsCard
              icon={<Users className="h-6 w-6 text-[hsl(var(--primary))]" />}
              value={tHero("stats_volunteers")}
            />
            <StatsCard
              icon={<Star className="h-6 w-6 text-[hsl(var(--accent))]" />}
              value={tHero("stats_rights")}
            />
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {tFeatures("title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {tFeatures("subtitle")}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
            {FEATURE_KEYS.map((key, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <Link
                  key={key}
                  href={FEATURE_LINKS[index]}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8 ${FEATURE_COLORS[index]}`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-4 inline-flex rounded-xl p-3 ${FEATURE_ICON_COLORS[index]}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground">
                    {tFeatures(`${key}.title`)}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {tFeatures(`${key}.description`)}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] opacity-0 transition-opacity group-hover:opacity-100">
                    <span>{tCommon("learn_more")}</span>
                    <ArrowLeft className="h-4 w-4 rtl:hidden" />
                    <ArrowRight className="hidden h-4 w-4 rtl:inline-block" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-[hsl(var(--primary))] px-6 py-16 text-center shadow-2xl sm:px-12 sm:py-20">
            {/* Background decoration */}
            <div className="absolute -end-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-[hsl(var(--accent)/0.15)] blur-2xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                {tCta("title")}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
                {tCta("subtitle")}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/check"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[hsl(var(--primary))] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl sm:w-auto"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  {tCta("check_button")}
                </Link>
                <Link
                  href="/chat"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:border-white/50 hover:bg-white/10 sm:w-auto"
                >
                  <MessageCircle className="h-5 w-5" />
                  {tCta("chat_button")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ===== Stats Card Component ===== */

function StatsCard({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.08)]">
        {icon}
      </div>
      <span className="text-lg font-bold text-foreground sm:text-xl">
        {value}
      </span>
    </div>
  );
}
