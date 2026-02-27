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

/* ===== Types ===== */

type SoldierType =
  | "lone_classic"
  | "child_of_emigrants"
  | "child_of_envoys"
  | "no_family_support"
  | "orphan"
  | "foster_family";

type ServiceStatus = "pre_service" | "in_service" | "released" | "reserves";

interface Answers {
  soldierType: SoldierType | null;
  serviceStatus: ServiceStatus | null;
  isCombat: boolean | null;
  isImmigrant: boolean | null;
  parentsAbroad: boolean | null;
}

interface EligibleRight {
  id: string;
  titleHe: string;
  titleEn: string;
  monthlyAmount?: number;
  oneTimeAmount?: number;
  noteHe: string;
  noteEn: string;
  category: "financial" | "housing" | "vacations" | "post_service" | "reserves";
}

/* ===== Rules Engine ===== */

function calculateEligibility(answers: Answers): EligibleRight[] {
  const rights: EligibleRight[] = [];
  const { soldierType, serviceStatus, isCombat, isImmigrant, parentsAbroad } =
    answers;

  if (!soldierType || !serviceStatus) return rights;

  // === Active Service Rights ===
  if (serviceStatus === "in_service") {
    // All recognized lone soldiers get the base allowance
    rights.push({
      id: "lone_soldier_allowance",
      titleHe: "תוספת חייל בודד",
      titleEn: "Lone Soldier Allowance",
      monthlyAmount: 620.7,
      noteHe: "לכל חייל בודד מוכר",
      noteEn: "For all recognized lone soldiers",
      category: "financial",
    });

    // Combat role bonuses
    if (isCombat === true) {
      rights.push({
        id: "combat_allowance",
        titleHe: "תוספת לוחם",
        titleEn: "Combat Soldier Allowance",
        monthlyAmount: 482.3,
        noteHe: "עבור חיילים בתפקיד לוחם",
        noteEn: "For soldiers in combat roles",
        category: "financial",
      });
    } else if (isCombat === false) {
      rights.push({
        id: "combat_support_allowance",
        titleHe: "תוספת תומך לחימה",
        titleEn: "Combat Support Allowance",
        monthlyAmount: 241.3,
        noteHe: "עבור חיילים בתפקיד תומך לחימה",
        noteEn: "For soldiers in combat support roles",
        category: "financial",
      });
    }

    // Food allowance
    rights.push({
      id: "food_allowance",
      titleHe: "דמי כלכלה",
      titleEn: "Food Allowance",
      monthlyAmount: 150,
      noteHe: "בבסיסים ללא חדר אוכל",
      noteEn: "At bases without dining facilities",
      category: "financial",
    });

    // Holiday vouchers
    rights.push({
      id: "holiday_vouchers",
      titleHe: "שוברי חגים",
      titleEn: "Holiday Vouchers",
      oneTimeAmount: 500,
      noteHe: "~250 ש\"ח פעמיים בשנה",
      noteEn: "~NIS 250 twice a year",
      category: "financial",
    });

    // Immigration ministry (olim only)
    if (isImmigrant === true) {
      rights.push({
        id: "immigration_ministry",
        titleHe: "מענק משרד הקליטה",
        titleEn: "Immigration Ministry Grant",
        monthlyAmount: 540,
        noteHe: "לעולים חדשים בלבד",
        noteEn: "For new immigrants only",
        category: "financial",
      });
    }

    // Housing ministry
    rights.push({
      id: "housing_ministry",
      titleHe: "מענק משרד השיכון",
      titleEn: "Housing Ministry Grant",
      monthlyAmount: 402,
      noteHe: "לחיילים ששוכרים דירה",
      noteEn: "For soldiers renting an apartment",
      category: "financial",
    });

    // Electricity discount
    rights.push({
      id: "electricity_discount",
      titleHe: "הנחת חשמל",
      titleEn: "Electricity Discount",
      monthlyAmount: 105,
      noteHe: "בדירה עצמאית",
      noteEn: "In a private apartment",
      category: "financial",
    });

    // Property tax exemption
    rights.push({
      id: "property_tax",
      titleHe: "פטור מארנונה (100%)",
      titleEn: "Property Tax Exemption (100%)",
      noteHe: "פטור מלא מארנונה",
      noteEn: "Full property tax exemption",
      category: "financial",
    });

    // Housing options
    rights.push({
      id: "rent_subsidy",
      titleHe: "סבסוד שכירות (עד 1,800 ש\"ח)",
      titleEn: "Rent Subsidy (up to NIS 1,800)",
      monthlyAmount: 1800,
      noteHe: "סבסוד שכירות חודשי",
      noteEn: "Monthly rent subsidy",
      category: "housing",
    });

    if (isImmigrant === true) {
      rights.push({
        id: "dirat_alach",
        titleHe: "דירת עלאך (מרוהטת בחינם)",
        titleEn: "Dirat Alach (Free Furnished Apartment)",
        noteHe: "לעולים חדשים — דירה מרוהטת",
        noteEn: "For new immigrants — furnished apartment",
        category: "housing",
      });
    }

    rights.push({
      id: "beit_hachayal",
      titleHe: "בית החייל (חינם, 7 מיקומים)",
      titleEn: "Beit HaChayal (Free, 7 Locations)",
      noteHe: "מגורים חינם ב-7 סניפים",
      noteEn: "Free accommodation at 7 branches",
      category: "housing",
    });

    rights.push({
      id: "adoptive_family",
      titleHe: "משפחה מאמצת",
      titleEn: "Adoptive Family",
      noteHe: "שיבוץ למשפחה מארחת",
      noteEn: "Matched with a host family",
      category: "housing",
    });

    // Vacations
    if (parentsAbroad === true) {
      rights.push({
        id: "abroad_leave",
        titleHe: "30 ימי חופשה לחו\"ל",
        titleEn: "30 Days Overseas Leave",
        noteHe: "לחיילים עם הורים בחו\"ל",
        noteEn: "For soldiers with parents abroad",
        category: "vacations",
      });

      rights.push({
        id: "flight_funding",
        titleHe: "מימון טיסות",
        titleEn: "Flight Funding",
        noteHe: "מימון חלקי או מלא",
        noteEn: "Partial or full flight funding",
        category: "vacations",
      });

      rights.push({
        id: "family_visit",
        titleHe: "4 ימי ביקור משפחה",
        titleEn: "4 Family Visit Days",
        noteHe: "כאשר משפחה מבקרת בארץ",
        noteEn: "When family visits Israel",
        category: "vacations",
      });
    }

    rights.push({
      id: "regular_leave",
      titleHe: "יום חופשה כל חודשיים",
      titleEn: "1 Extra Day Off Every 2 Months",
      noteHe: "חייל בודד מוכר",
      noteEn: "Recognized lone soldier",
      category: "vacations",
    });

    rights.push({
      id: "early_leave",
      titleHe: "יציאה מוקדמת לחגים",
      titleEn: "Early Leave for Holidays",
      noteHe: "ערב חג",
      noteEn: "Before holidays",
      category: "vacations",
    });
  }

  // === Post-Service Rights ===
  if (serviceStatus === "released") {
    rights.push({
      id: "discharge_grant",
      titleHe: "מענק שחרור",
      titleEn: "Discharge Grant",
      noteHe: "סכום בהתאם לתקופת השירות",
      noteEn: "Amount based on service duration",
      category: "post_service",
    });

    rights.push({
      id: "personal_deposit",
      titleHe: "פיקדון אישי (6 ייעודים, 5 שנים)",
      titleEn: "Personal Deposit (6 Purposes, 5 Years)",
      noteHe: "לימודים, דיור, עסק, נסיעות, חתונה, רכב",
      noteEn: "Education, housing, business, travel, wedding, vehicle",
      category: "post_service",
    });

    rights.push({
      id: "free_accommodation",
      titleHe: "3 חודשי מגורים חינם",
      titleEn: "3 Months Free Accommodation",
      noteHe: "מיד לאחר שחרור",
      noteEn: "Immediately after discharge",
      category: "post_service",
    });

    if (isImmigrant === true) {
      rights.push({
        id: "rent_assistance",
        titleHe: "סיוע בשכירות (עד 12,000 ש\"ח)",
        titleEn: "Rent Assistance (up to NIS 12,000)",
        oneTimeAmount: 12000,
        noteHe: "לעולים חדשים",
        noteEn: "For new immigrants",
        category: "post_service",
      });
    }

    rights.push({
      id: "rent_grant",
      titleHe: "מענק שכירות חד-פעמי (5,000 ש\"ח)",
      titleEn: "One-Time Rent Grant (NIS 5,000)",
      oneTimeAmount: 5000,
      noteHe: "מענק חד-פעמי",
      noteEn: "One-time grant",
      category: "post_service",
    });

    rights.push({
      id: "extended_benefits",
      titleHe: "הטבות מורחבות — עד 10 שנים",
      titleEn: "Extended Benefits — Up to 10 Years",
      noteHe: "זכאות מורחבת לאחר שחרור",
      noteEn: "Extended eligibility post-discharge",
      category: "post_service",
    });

    rights.push({
      id: "career_assessment",
      titleHe: "אבחון קריירה",
      titleEn: "Career Assessment",
      noteHe: "ייעוץ מקצועי חינם",
      noteEn: "Free professional counseling",
      category: "post_service",
    });

    rights.push({
      id: "education_funding",
      titleHe: "מימון לימודים",
      titleEn: "Education Funding",
      noteHe: "סיוע במימון לימודים",
      noteEn: "Education funding assistance",
      category: "post_service",
    });

    rights.push({
      id: "knafayim",
      titleHe: "תוכנית כנפיים",
      titleEn: "Knafayim Program",
      noteHe: "מלגות ותמיכה כלכלית",
      noteEn: "Scholarships and financial support",
      category: "post_service",
    });
  }

  // === Reserve Duty Rights ===
  if (serviceStatus === "reserves") {
    rights.push({
      id: "reserve_accommodation",
      titleHe: "מגורים בזמן מילואים",
      titleEn: "Accommodation During Reserves",
      noteHe: "מגורים מסובסדים",
      noteEn: "Subsidized accommodation",
      category: "reserves",
    });

    rights.push({
      id: "reserve_expenses",
      titleHe: "החזר הוצאות",
      titleEn: "Expense Reimbursement",
      noteHe: "שכירות ומחיה",
      noteEn: "Rent and living expenses",
      category: "reserves",
    });

    rights.push({
      id: "reserve_mental_health",
      titleHe: "בריאות הנפש",
      titleEn: "Mental Health Support",
      noteHe: "תמיכה מקצועית חינם",
      noteEn: "Free professional support",
      category: "reserves",
    });

    rights.push({
      id: "reserve_career",
      titleHe: "ייעוץ תעסוקתי",
      titleEn: "Career Counseling",
      noteHe: "הכוונה מקצועית",
      noteEn: "Professional guidance",
      category: "reserves",
    });
  }

  return rights;
}

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
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  housing:
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  vacations:
    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  post_service:
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  reserves:
    "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.05)] via-transparent to-transparent" />
          </div>

          <div className="mx-auto max-w-4xl px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
            {/* Results Header */}
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                {tCheck("results_title")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {tCheck("your_rights")}
              </p>
            </div>

            {/* Total Monthly */}
            {totalMonthly > 0 && (
              <div className="mt-8 rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 text-center dark:border-emerald-800/50">
                <p className="text-sm font-medium text-muted-foreground">
                  {tCheck("total_monthly")}
                </p>
                <div className="mt-1 text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-5xl">
                  {totalMonthly.toLocaleString("he-IL", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  <span className="text-lg">NIS</span>
                </div>
              </div>
            )}

            {/* Grouped Rights */}
            <div className="mt-8 space-y-6">
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
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
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
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
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
            <div className="mt-8 rounded-xl border border-amber-200/50 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {tCheck("disclaimer")}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={handleReset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted sm:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Check Again
              </button>
              <Link
                href="/chat"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-110 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" />
                Ask a Question
              </Link>
              <Link
                href="/rights"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.08)] px-6 py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] transition-all hover:bg-[hsl(var(--accent)/0.15)] sm:w-auto"
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.05)] via-transparent to-transparent" />
          <div className="absolute -top-24 end-0 h-[400px] w-[400px] rounded-full bg-[hsl(var(--accent)/0.06)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-2xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.08)] px-4 py-1.5 text-sm font-medium text-[hsl(var(--accent-foreground))]">
              <ClipboardCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span>
                {step + 1} / {totalSteps}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
              {tCheck("title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{tCheck("subtitle")}</p>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <StepIndicator currentStep={step} totalSteps={totalSteps} />
          </div>

          {/* Question Card */}
          <div className="mt-8 rounded-2xl border border-border/50 bg-card p-6 shadow-lg sm:p-8">
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
          <div className="mt-6 rounded-xl border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/10">
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
