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
import Image from "next/image";

/**
 * Home page for Ach Gadol - Big Brother for Lone Soldiers.
 *
 * Sections:
 * 1. Hero - Large title, subtitle, two CTA buttons
 * 2. Stats - Soldiers helped, volunteers, rights covered
 * 3. Features - 4 cards grid (Rights Info, Eligibility, Chat, Guidance)
 * 4. CTA - Final call to action
 */

const FEATURE_ICONS = [BookOpen, ClipboardCheck, MessageCircle] as const;

const FEATURE_KEYS = [
  "rights_info",
  "eligibility_checker",
  "ai_chat",
] as const;

const FEATURE_LINKS = ["/rights", "/check", "/chat"] as const;

export default function HomePage() {
  const tHero = useTranslations("hero");
  const tFeatures = useTranslations("features");
  const tCta = useTranslations("cta");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col">
      {/* ===== Hero Section ===== */}
      <section className="bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Logo */}
            <div className="mb-5 flex justify-center">
              <Image
                src="/logo-full.jpg"
                alt="אח גדול"
                width={100}
                height={69}
                className="h-16 w-auto sm:h-20"
                priority
              />
            </div>

            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.06)] px-3 py-1 text-sm font-medium text-foreground">
              <Shield className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              <span>{tHero("badge")}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {tHero("title")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {tHero("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/check"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:brightness-110 sm:w-auto"
              >
                <ClipboardCheck className="h-5 w-5" />
                {tHero("cta_check")}
              </Link>
              <Link
                href="/chat"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                {tHero("cta_chat")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats Section ===== */}
      <section className="border-y border-border/40">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            <StatsCard
              icon={<Heart className="h-5 w-5 text-[hsl(var(--primary))]" />}
              value={tHero("stats_soldiers")}
            />
            <StatsCard
              icon={<Users className="h-5 w-5 text-[hsl(var(--primary))]" />}
              value={tHero("stats_volunteers")}
            />
            <StatsCard
              icon={<Star className="h-5 w-5 text-[hsl(var(--primary))]" />}
              value={tHero("stats_rights")}
            />
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {tFeatures("title")}
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {tFeatures("subtitle")}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURE_KEYS.map((key, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <Link
                  key={key}
                  href={FEATURE_LINKS[index]}
                  className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  {/* Icon */}
                  <div className="mb-3 inline-flex rounded-lg bg-[hsl(var(--primary)/0.08)] p-2.5">
                    <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground">
                    {tFeatures(`${key}.title`)}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {tFeatures(`${key}.description`)}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] opacity-0 transition-opacity group-hover:opacity-100">
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
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="rounded-2xl bg-[hsl(var(--primary))] px-6 py-10 text-center sm:px-10 sm:py-12">
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
              {tCta("title")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-primary-foreground/80">
              {tCta("subtitle")}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/check"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-[hsl(var(--primary))] shadow-md transition-all hover:bg-white/90 hover:shadow-lg sm:w-auto"
              >
                <ClipboardCheck className="h-5 w-5" />
                {tCta("check_button")}
              </Link>
              <Link
                href="/chat"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:border-white/50 hover:bg-white/10 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                {tCta("chat_button")}
              </Link>
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
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.08)]">
        {icon}
      </div>
      <span className="text-sm font-bold text-foreground sm:text-base">
        {value}
      </span>
    </div>
  );
}
