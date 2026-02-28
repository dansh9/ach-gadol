"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Shield,
  Wallet,
  Home,
  Plane,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  MessageCircle,
} from "lucide-react";
import {
  calculateEligibility,
  type EligibilityAnswers as Answers,
  type EligibleRight,
  type SoldierType,
  type ServiceStatus,
} from "@/lib/eligibility";

/* ===== Category Icon Map ===== */

const CATEGORY_ICONS: Record<string, typeof Wallet> = {
  financial: Wallet,
  housing: Home,
  vacations: Plane,
  post_service: GraduationCap,
  reserves: Shield,
};

const CATEGORY_COLORS: Record<string, string> = {
  financial:
    "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]",
  housing:
    "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]",
  vacations:
    "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]",
  post_service:
    "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]",
  reserves:
    "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]",
};

/* ===== Step Components ===== */

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < currentStep
              ? "w-8 bg-[hsl(var(--primary))]"
              : i === currentStep
                ? "w-8 bg-[hsl(var(--accent))]"
                : "w-2 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function OptionButton({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-2 px-5 py-4 text-start text-sm font-medium transition-all sm:text-base ${
        isSelected
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]"
          : "border-border/50 bg-card text-foreground hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.03)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${
            isSelected
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
              : "border-muted-foreground/30"
          }`}
        >
          {isSelected && (
            <CheckCircle2 className="h-full w-full text-primary-foreground" />
          )}
        </div>
        <span>{label}</span>
      </div>
    </button>
  );
}

function YesNoButtons({
  value,
  onSelect,
  tCheck,
}: {
  value: boolean | null;
  onSelect: (val: boolean) => void;
  tCheck: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <OptionButton
        label={tCheck("yes")}
        isSelected={value === true}
        onClick={() => onSelect(true)}
      />
      <OptionButton
        label={tCheck("no")}
        isSelected={value === false}
        onClick={() => onSelect(false)}
      />
    </div>
  );
}

/* ===== Main Page Component ===== */

export default function CheckPage() {
  const tCheck = useTranslations("check");
  const tRights = useTranslations("rights");

  const [step, setStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    soldierType: null,
    serviceStatus: null,
    isCombat: null,
    isImmigrant: null,
    parentsAbroad: null,
  });

  const soldierTypes: { key: SoldierType; label: string }[] = [
    { key: "lone_classic", label: tCheck("soldier_types.lone_classic") },
    {
      key: "child_of_emigrants",
      label: tCheck("soldier_types.child_of_emigrants"),
    },
    {
      key: "child_of_envoys",
      label: tCheck("soldier_types.child_of_envoys"),
    },
    {
      key: "no_family_support",
      label: tCheck("soldier_types.no_family_support"),
    },
    { key: "orphan", label: tCheck("soldier_types.orphan") },
    { key: "foster_family", label: tCheck("soldier_types.foster_family") },
  ];

  const serviceStatuses: { key: ServiceStatus; label: string }[] = [
    { key: "pre_service", label: tCheck("statuses.pre_service") },
    { key: "in_service", label: tCheck("statuses.in_service") },
    { key: "released", label: tCheck("statuses.released") },
    { key: "reserves", label: tCheck("statuses.reserves") },
  ];

  const STEPS = [
    {
      questionKey: "soldier_type",
      question: tCheck("soldier_type"),
    },
    {
      questionKey: "service_status",
      question: tCheck("service_status"),
    },
    {
      questionKey: "is_combat",
      question: tCheck("is_combat"),
    },
    {
      questionKey: "is_immigrant",
      question: tCheck("is_immigrant"),
    },
    {
      questionKey: "parents_abroad",
      question: tCheck("parents_abroad"),
    },
  ];

  const totalSteps = STEPS.length;

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return answers.soldierType !== null;
      case 1:
        return answers.serviceStatus !== null;
      case 2:
        return answers.isCombat !== null;
      case 3:
        return answers.isImmigrant !== null;
      case 4:
        return answers.parentsAbroad !== null;
      default:
        return false;
    }
  }, [step, answers]);

  const eligibleRights = useMemo(
    () => calculateEligibility(answers),
    [answers]
  );

  const totalMonthly = useMemo(
    () =>
      eligibleRights.reduce((sum, r) => sum + (r.monthlyAmount ?? 0), 0),
    [eligibleRights]
  );

  const groupedRights = useMemo(() => {
    const groups: Record<string, EligibleRight[]> = {};
    for (const right of eligibleRights) {
      if (!groups[right.category]) {
        groups[right.category] = [];
      }
      groups[right.category].push(right);
    }
    return groups;
  }, [eligibleRights]);

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleReset() {
    setStep(0);
    setShowResults(false);
    setAnswers({
      soldierType: null,
      serviceStatus: null,
      isCombat: null,
      isImmigrant: null,
      parentsAbroad: null,
    });
  }

  // ===== Results View =====
  if (showResults) {
    return (
      <div className="flex flex-col">
        <section>
          <div className="mx-auto max-w-4xl px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-14 lg:px-8">
            {/* Results Header */}
            <div className="text-center">
              <div className="mb-3 inline-flex rounded-full bg-[hsl(var(--primary)/0.08)] p-3">
                <Sparkles className="h-7 w-7 text-[hsl(var(--primary))]" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
                {tCheck("results_title")}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {tCheck("your_rights")}
              </p>
            </div>

            {/* Total Monthly */}
            {totalMonthly > 0 && (
              <div className="mt-6 rounded-xl border border-border/50 bg-card p-5 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {tCheck("total_monthly")}
                </p>
                <div className="mt-1 text-3xl font-extrabold text-[hsl(var(--primary))] sm:text-4xl">
                  {totalMonthly.toLocaleString("he-IL", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  <span className="text-lg">NIS</span>
                </div>
              </div>
            )}

            {/* Grouped Rights */}
            <div className="mt-6 space-y-5">
              {Object.entries(groupedRights).map(([category, rights]) => {
                const Icon = CATEGORY_ICONS[category] ?? Shield;
                const colorClass =
                  CATEGORY_COLORS[category] ?? CATEGORY_COLORS.financial;
                return (
                  <div key={category}>
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className={`inline-flex rounded-lg p-2 ${colorClass}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {tRights(`categories.${category}`)}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {rights.map((right) => (
                        <div
                          key={right.id}
                          className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {right.titleHe}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {right.titleEn}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {right.noteHe}
                            </p>
                          </div>
                          {right.monthlyAmount && (
                            <div className="flex-shrink-0 text-end">
                              <span className="text-lg font-bold text-[hsl(var(--primary))]">
                                {right.monthlyAmount.toLocaleString("he-IL")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                {tRights("per_month")}
                              </span>
                            </div>
                          )}
                          {right.oneTimeAmount && !right.monthlyAmount && (
                            <div className="flex-shrink-0 text-end">
                              <span className="text-lg font-bold text-[hsl(var(--accent))]">
                                {right.oneTimeAmount.toLocaleString("he-IL")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                {tRights("one_time")}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-5 rounded-lg border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {tCheck("disclaimer")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={handleReset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Check Again
              </button>
              <Link
                href="/chat"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:brightness-110 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                Ask a Question
              </Link>
              <Link
                href="/rights"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110 sm:w-auto"
              >
                <Shield className="h-4 w-4" />
                View All Rights
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===== Questionnaire View =====
  return (
    <div className="flex flex-col">
      <section>
        <div className="mx-auto max-w-2xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.06)] px-3 py-1 text-sm font-medium text-foreground">
              <ClipboardCheck className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              <span>
                {step + 1} / {totalSteps}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
              {tCheck("title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{tCheck("subtitle")}</p>
          </div>

          {/* Progress */}
          <div className="mt-6">
            <StepIndicator currentStep={step} totalSteps={totalSteps} />
          </div>

          {/* Question Card */}
          <div className="mt-6 rounded-xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-6 text-xl font-bold text-foreground">
              {STEPS[step].question}
            </h2>

            {/* Step 0: Soldier Type */}
            {step === 0 && (
              <div className="space-y-3">
                {soldierTypes.map((type) => (
                  <OptionButton
                    key={type.key}
                    label={type.label}
                    isSelected={answers.soldierType === type.key}
                    onClick={() =>
                      setAnswers({ ...answers, soldierType: type.key })
                    }
                  />
                ))}
              </div>
            )}

            {/* Step 1: Service Status */}
            {step === 1 && (
              <div className="space-y-3">
                {serviceStatuses.map((status) => (
                  <OptionButton
                    key={status.key}
                    label={status.label}
                    isSelected={answers.serviceStatus === status.key}
                    onClick={() =>
                      setAnswers({ ...answers, serviceStatus: status.key })
                    }
                  />
                ))}
              </div>
            )}

            {/* Step 2: Combat */}
            {step === 2 && (
              <YesNoButtons
                value={answers.isCombat}
                onSelect={(val) => setAnswers({ ...answers, isCombat: val })}
                tCheck={tCheck}
              />
            )}

            {/* Step 3: Immigrant */}
            {step === 3 && (
              <YesNoButtons
                value={answers.isImmigrant}
                onSelect={(val) =>
                  setAnswers({ ...answers, isImmigrant: val })
                }
                tCheck={tCheck}
              />
            )}

            {/* Step 4: Parents Abroad */}
            {step === 4 && (
              <YesNoButtons
                value={answers.parentsAbroad}
                onSelect={(val) =>
                  setAnswers({ ...answers, parentsAbroad: val })
                }
                tCheck={tCheck}
              />
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="inline-flex items-center gap-1 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4 rtl:hidden" />
                <ChevronLeft className="hidden h-4 w-4 rtl:inline-block" />
                {tCheck("yes") === "Yes" ? "Back" : "חזרה"}
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="inline-flex items-center gap-1 rounded-xl bg-[hsl(var(--primary))] px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === totalSteps - 1
                  ? tCheck("check_button")
                  : tCheck("yes") === "Yes"
                    ? "Next"
                    : "הבא"}
                {step < totalSteps - 1 && (
                  <>
                    <ChevronLeft className="h-4 w-4 rtl:hidden" />
                    <ChevronRight className="hidden h-4 w-4 rtl:inline-block" />
                  </>
                )}
                {step === totalSteps - 1 && (
                  <ClipboardCheck className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-5 rounded-lg border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {tCheck("disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
