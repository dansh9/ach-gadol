"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Wallet,
  Home,
  Plane,
  GraduationCap,
  Shield,
  ChevronDown,
  ChevronUp,
  Banknote,
  Info,
  ClipboardCheck,
  Zap,
  Building,
  Heart,
  Briefcase,
} from "lucide-react";

/* ===== Rights Data ===== */

interface Right {
  id: string;
  titleHe: string;
  titleEn: string;
  amount?: string;
  frequency?: string;
  frequencyHe?: string;
  conditionsHe?: string;
  conditionsEn?: string;
  sourceHe?: string;
  sourceEn?: string;
}

interface RightsCategory {
  id: string;
  translationKey: string;
  icon: typeof Wallet;
  color: string;
  iconColor: string;
  amountColor: string;
  rights: Right[];
}

const RIGHTS_DATA: RightsCategory[] = [
  {
    id: "financial",
    translationKey: "financial",
    icon: Wallet,
    color:
      "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50",
    iconColor:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    amountColor: "text-emerald-600 dark:text-emerald-400",
    rights: [
      {
        id: "lone_soldier_allowance",
        titleHe: "תוספת חייל בודד",
        titleEn: "Lone Soldier Allowance",
        amount: "620.70",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "כל חייל בודד מוכר",
        conditionsEn: "All recognized lone soldiers",
        sourceHe: "צה\"ל — מדור כוח אדם",
        sourceEn: "IDF — Personnel Division",
      },
      {
        id: "combat_allowance",
        titleHe: "תוספת לוחם",
        titleEn: "Combat Soldier Allowance",
        amount: "482.30",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד בתפקיד לוחם",
        conditionsEn: "Lone soldiers in combat roles",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "combat_support_allowance",
        titleHe: "תוספת תומך לחימה",
        titleEn: "Combat Support Allowance",
        amount: "241.30",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד בתפקיד תומך לחימה",
        conditionsEn: "Lone soldiers in combat support roles",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "food_allowance",
        titleHe: "דמי כלכלה",
        titleEn: "Food Allowance",
        amount: "150",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד בבסיס ללא חדר אוכל",
        conditionsEn: "Lone soldiers at bases without dining facilities",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "holiday_vouchers",
        titleHe: "שוברי חגים",
        titleEn: "Holiday Vouchers",
        amount: "~250",
        frequency: "one_time",
        frequencyHe: "פעמיים בשנה",
        conditionsHe: "לראש השנה ולפסח",
        conditionsEn: "For Rosh Hashana and Passover (~250 x 2)",
        sourceHe: "משרד הקליטה / צה\"ל",
        sourceEn: "Ministry of Immigration / IDF",
      },
      {
        id: "immigration_ministry",
        titleHe: "מענק משרד הקליטה",
        titleEn: "Immigration Ministry Grant",
        amount: "540",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "עולה חדש בלבד",
        conditionsEn: "New immigrants (Olim) only",
        sourceHe: "משרד הקליטה",
        sourceEn: "Ministry of Aliyah and Integration",
      },
      {
        id: "housing_ministry",
        titleHe: "מענק משרד השיכון",
        titleEn: "Housing Ministry Grant",
        amount: "402",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד שמשלם שכירות",
        conditionsEn: "Lone soldiers paying rent",
        sourceHe: "משרד השיכון",
        sourceEn: "Ministry of Housing",
      },
      {
        id: "electricity_discount",
        titleHe: "הנחת חשמל",
        titleEn: "Electricity Discount",
        amount: "105",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד בדירה עצמאית",
        conditionsEn: "Lone soldiers in private apartments",
        sourceHe: "חברת החשמל",
        sourceEn: "Israel Electric Corporation",
      },
      {
        id: "property_tax",
        titleHe: "פטור מארנונה",
        titleEn: "Property Tax Exemption",
        amount: "100%",
        frequency: "one_time",
        frequencyHe: "פטור מלא",
        conditionsHe: "דירה על שם החייל הבודד",
        conditionsEn: "Apartment registered to the lone soldier",
        sourceHe: "רשות מקומית",
        sourceEn: "Local Municipality",
      },
    ],
  },
  {
    id: "housing",
    translationKey: "housing",
    icon: Home,
    color:
      "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50",
    iconColor:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    amountColor: "text-blue-600 dark:text-blue-400",
    rights: [
      {
        id: "rent_subsidy",
        titleHe: "סבסוד שכירות",
        titleEn: "Rent Subsidy",
        amount: "1,800",
        frequency: "per_month",
        frequencyHe: "עד לחודש",
        conditionsHe: "חייל בודד ששוכר דירה",
        conditionsEn: "Lone soldiers renting an apartment (up to NIS 1,800/mo)",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "dirat_alach",
        titleHe: "דירת עלאך (מרוהטת בחינם)",
        titleEn: "Dirat Alach (Free Furnished Apartment)",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "חייל בודד עולה חדש",
        conditionsEn: "New immigrant lone soldiers",
        sourceHe: "עמותת עלאך",
        sourceEn: "Alach Association",
      },
      {
        id: "beit_hachayal",
        titleHe: "בית החייל (7 מיקומים)",
        titleEn: "Beit HaChayal (7 Locations)",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "חייל בודד מוכר — 7 סניפים ברחבי הארץ",
        conditionsEn: "Recognized lone soldiers — 7 branches nationwide",
        sourceHe: "בית החייל",
        sourceEn: "Beit HaChayal",
      },
      {
        id: "kibbutz",
        titleHe: "קיבוץ (מגורים + דמי כיס)",
        titleEn: "Kibbutz (Housing + Pocket Money)",
        amount: "150",
        frequency: "per_month",
        frequencyHe: "דמי כיס + מגורים חינם",
        conditionsHe: "חייל בודד המשובץ לקיבוץ",
        conditionsEn: "Lone soldiers assigned to a kibbutz (free housing + NIS 150 pocket money)",
        sourceHe: "תנועה קיבוצית",
        sourceEn: "Kibbutz Movement",
      },
      {
        id: "adoptive_family",
        titleHe: "משפחה מאמצת",
        titleEn: "Adoptive Family",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "חייל בודד — שיבוץ למשפחה מאמצת",
        conditionsEn: "Lone soldiers — matched with a host family",
        sourceHe: "ארגוני מתנדבים",
        sourceEn: "Volunteer Organizations",
      },
    ],
  },
  {
    id: "vacations",
    translationKey: "vacations",
    icon: Plane,
    color:
      "from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50",
    iconColor:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    amountColor: "text-amber-600 dark:text-amber-400",
    rights: [
      {
        id: "abroad_leave",
        titleHe: "חופשה לחו\"ל",
        titleEn: "Overseas Leave",
        amount: "30",
        frequency: "one_time",
        frequencyHe: "ימים בשנה",
        conditionsHe: "חייל בודד עם הורים בחו\"ל",
        conditionsEn: "30 days per year for soldiers with parents abroad",
        sourceHe: "צה\"ל — פקודת מטכ\"ל",
        sourceEn: "IDF — General Staff Order",
      },
      {
        id: "flight_funding",
        titleHe: "מימון טיסות",
        titleEn: "Flight Funding",
        frequency: "one_time",
        frequencyHe: "בהתאם לזכאות",
        conditionsHe: "מימון חלקי או מלא לטיסות לבקר משפחה",
        conditionsEn: "Partial or full flight funding to visit family",
        sourceHe: "משרד הקליטה / צה\"ל",
        sourceEn: "Ministry of Immigration / IDF",
      },
      {
        id: "family_visit",
        titleHe: "ימי ביקור משפחה",
        titleEn: "Family Visit Days",
        amount: "4",
        frequency: "one_time",
        frequencyHe: "ימים בשנה",
        conditionsHe: "כאשר משפחה מגיעה לביקור בארץ",
        conditionsEn: "4 days when family visits Israel",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "regular_leave",
        titleHe: "יום חופשה כל חודשיים",
        titleEn: "Regular Leave Day",
        amount: "1",
        frequency: "one_time",
        frequencyHe: "יום כל חודשיים",
        conditionsHe: "חייל בודד מוכר",
        conditionsEn: "1 additional day every 2 months",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "early_leave",
        titleHe: "יציאה מוקדמת לחגים",
        titleEn: "Early Leave for Holidays",
        frequency: "one_time",
        frequencyHe: "לפני חגים",
        conditionsHe: "יציאה מוקדמת ערב חג",
        conditionsEn: "Early release before holidays",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
    ],
  },
  {
    id: "post_service",
    translationKey: "post_service",
    icon: GraduationCap,
    color:
      "from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50",
    iconColor:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    amountColor: "text-purple-600 dark:text-purple-400",
    rights: [
      {
        id: "discharge_grant",
        titleHe: "מענק שחרור",
        titleEn: "Discharge Grant",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "עם השחרור — סכום בהתאם לתקופת השירות",
        conditionsEn: "Upon discharge — amount based on service duration",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "personal_deposit",
        titleHe: "פיקדון אישי (6 ייעודים, 5 שנים)",
        titleEn: "Personal Deposit (6 Purposes, 5 Years)",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "ניתן לשימוש ל-6 מטרות: לימודים, דיור, עסק, נסיעות, חתונה, רכב",
        conditionsEn: "Can be used for 6 purposes: education, housing, business, travel, wedding, vehicle. Valid 5 years.",
        sourceHe: "משרד הביטחון",
        sourceEn: "Ministry of Defense",
      },
      {
        id: "free_accommodation",
        titleHe: "3 חודשי מגורים חינם",
        titleEn: "3 Months Free Accommodation",
        frequency: "one_time",
        frequencyHe: "3 חודשים",
        conditionsHe: "לאחר שחרור — מגורים חינם",
        conditionsEn: "Free accommodation for 3 months after discharge",
        sourceHe: "צה\"ל / עמותות",
        sourceEn: "IDF / NGOs",
      },
      {
        id: "rent_assistance",
        titleHe: "סיוע בשכירות",
        titleEn: "Rent Assistance",
        amount: "12,000",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "עד 12,000 ש\"ח סיוע בשכירות לאחר שחרור",
        conditionsEn: "Up to NIS 12,000 rent assistance post-discharge",
        sourceHe: "משרד הקליטה",
        sourceEn: "Ministry of Immigration",
      },
      {
        id: "rent_grant",
        titleHe: "מענק שכירות חד-פעמי",
        titleEn: "One-Time Rent Grant",
        amount: "5,000",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "מענק חד-פעמי לשכירת דירה",
        conditionsEn: "One-time NIS 5,000 grant for renting an apartment",
        sourceHe: "משרד השיכון",
        sourceEn: "Ministry of Housing",
      },
      {
        id: "extended_benefits",
        titleHe: "הטבות מורחבות — 10 שנים",
        titleEn: "Extended Benefits — 10 Years",
        frequency: "one_time",
        frequencyHe: "עד 10 שנים",
        conditionsHe: "זכאות להטבות מורחבות עד 10 שנים לאחר שחרור",
        conditionsEn: "Eligibility for extended benefits up to 10 years post-discharge",
        sourceHe: "משרד הקליטה",
        sourceEn: "Ministry of Immigration",
      },
      {
        id: "career_assessment",
        titleHe: "אבחון קריירה",
        titleEn: "Career Assessment",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "ייעוץ מקצועי והכוונה תעסוקתית",
        conditionsEn: "Professional career counseling and job guidance",
        sourceHe: "משרד הקליטה / עמותות",
        sourceEn: "Ministry of Immigration / NGOs",
      },
      {
        id: "education_funding",
        titleHe: "מימון לימודים",
        titleEn: "Education Funding",
        frequency: "one_time",
        frequencyHe: "בהתאם לזכאות",
        conditionsHe: "סיוע במימון לימודים אקדמיים ומקצועיים",
        conditionsEn: "Assistance for academic and vocational education",
        sourceHe: "משרד הקליטה / משרד החינוך",
        sourceEn: "Ministry of Immigration / Ministry of Education",
      },
      {
        id: "knafayim",
        titleHe: "תוכנית כנפיים",
        titleEn: "Knafayim Program",
        frequency: "one_time",
        frequencyHe: "תוכנית מלגות",
        conditionsHe: "מלגות ותמיכה כלכלית לחיילים בודדים משוחררים",
        conditionsEn: "Scholarships and financial support for discharged lone soldiers",
        sourceHe: "עמותת כנפיים",
        sourceEn: "Knafayim Foundation",
      },
    ],
  },
  {
    id: "reserves",
    translationKey: "reserves",
    icon: Shield,
    color:
      "from-rose-500/10 to-rose-600/5 border-rose-200/50 dark:border-rose-800/50",
    iconColor:
      "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    amountColor: "text-rose-600 dark:text-rose-400",
    rights: [
      {
        id: "reserve_accommodation",
        titleHe: "מגורים בזמן מילואים",
        titleEn: "Accommodation During Reserves",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "מגורים מסובסדים בזמן שירות מילואים",
        conditionsEn: "Subsidized accommodation during reserve duty",
        sourceHe: "צה\"ל",
        sourceEn: "IDF",
      },
      {
        id: "reserve_expenses",
        titleHe: "החזר הוצאות",
        titleEn: "Expense Reimbursement",
        frequency: "one_time",
        frequencyHe: "בהתאם להוצאות",
        conditionsHe: "החזר הוצאות שכירות ומחיה בזמן מילואים",
        conditionsEn: "Reimbursement for rent and living expenses during reserves",
        sourceHe: "משרד הביטחון",
        sourceEn: "Ministry of Defense",
      },
      {
        id: "reserve_mental_health",
        titleHe: "בריאות הנפש",
        titleEn: "Mental Health Support",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "תמיכה נפשית ומקצועית למשרתי מילואים",
        conditionsEn: "Professional mental health support for reservists",
        sourceHe: "צה\"ל / משרד הבריאות",
        sourceEn: "IDF / Ministry of Health",
      },
      {
        id: "reserve_career",
        titleHe: "ייעוץ תעסוקתי",
        titleEn: "Career Counseling",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "הכוונה מקצועית והשמה תעסוקתית",
        conditionsEn: "Professional guidance and job placement",
        sourceHe: "משרד הביטחון / עמותות",
        sourceEn: "Ministry of Defense / NGOs",
      },
    ],
  },
];

/* ===== Category Tab Component ===== */

function CategoryTab({
  category,
  isActive,
  onClick,
  tRights,
}: {
  category: RightsCategory;
  isActive: boolean;
  onClick: () => void;
  tRights: ReturnType<typeof useTranslations>;
}) {
  const Icon = category.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? "bg-[hsl(var(--primary))] text-primary-foreground shadow-md"
          : "bg-card text-muted-foreground hover:bg-[hsl(var(--primary)/0.08)] hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{tRights(`categories.${category.translationKey}`)}</span>
    </button>
  );
}

/* ===== Right Card Component ===== */

function RightCard({
  right,
  amountColor,
  tRights,
}: {
  right: Right;
  amountColor: string;
  tRights: ReturnType<typeof useTranslations>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-base font-bold text-foreground sm:text-lg">
              {right.titleHe}
            </h4>
            <p className="text-sm text-muted-foreground">{right.titleEn}</p>
          </div>
          {right.amount && (
            <div className="flex-shrink-0 text-end">
              <div className={`text-xl font-extrabold sm:text-2xl ${amountColor}`}>
                {right.amount === "100%"
                  ? right.amount
                  : `${right.amount}`}
                {right.amount !== "100%" && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    {tRights("per_month") === right.frequencyHe
                      ? ""
                      : ""}
                  </span>
                )}
              </div>
              {right.frequencyHe && (
                <p className="text-xs text-muted-foreground">
                  {right.frequencyHe}
                </p>
              )}
            </div>
          )}
          {!right.amount && right.frequencyHe && (
            <div className="flex-shrink-0">
              <span className="inline-flex rounded-full bg-[hsl(var(--primary)/0.1)] px-3 py-1 text-xs font-medium text-[hsl(var(--primary))]">
                {right.frequencyHe}
              </span>
            </div>
          )}
        </div>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary)/0.8)]"
        >
          <Info className="h-3.5 w-3.5" />
          <span>{tRights("details")}</span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {tRights("conditions")}:
              </span>
              <div>
                <p className="text-xs text-foreground">
                  {right.conditionsHe}
                </p>
                <p className="text-xs text-muted-foreground">
                  {right.conditionsEn}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {tRights("source")}:
              </span>
              <div>
                <p className="text-xs text-foreground">{right.sourceHe}</p>
                <p className="text-xs text-muted-foreground">
                  {right.sourceEn}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Main Page Component ===== */

export default function RightsPage() {
  const tRights = useTranslations("rights");
  const [activeCategory, setActiveCategory] = useState(RIGHTS_DATA[0].id);

  const currentCategory = RIGHTS_DATA.find((c) => c.id === activeCategory)!;

  return (
    <div className="flex flex-col">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.05)] via-transparent to-transparent" />
          <div className="absolute -top-24 end-0 h-[500px] w-[500px] rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-1.5 text-sm font-medium text-foreground">
              <Banknote className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span>{tRights("badge_count")}</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              {tRights("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {tRights("subtitle")}
            </p>

            {/* Quick Action */}
            <div className="mt-8">
              <Link
                href="/check"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:brightness-110"
              >
                <ClipboardCheck className="h-4 w-4" />
                <span>{tRights("check_eligibility_button")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Category Tabs ===== */}
      <section className="sticky top-16 z-30 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {RIGHTS_DATA.map((category) => (
              <CategoryTab
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                tRights={tRights}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Rights Grid ===== */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className={`inline-flex rounded-xl p-3 ${currentCategory.iconColor}`}>
              <currentCategory.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {tRights(`categories.${currentCategory.translationKey}`)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentCategory.rights.length} {tRights("rights_count")}
              </p>
            </div>
          </div>

          {/* Rights Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentCategory.rights.map((right) => (
              <RightCard
                key={right.id}
                right={right}
                amountColor={currentCategory.amountColor}
                tRights={tRights}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Summary Banner ===== */}
      <section className="border-t border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.05)] border border-[hsl(var(--primary)/0.15)] p-8 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-xl bg-[hsl(var(--accent)/0.15)] p-3">
              <Zap className="h-7 w-7 text-[hsl(var(--accent))]" />
            </div>
            <h3 className="text-xl font-bold text-foreground sm:text-2xl">
              {tRights("not_sure_title")}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              {tRights("not_sure_description")}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/check"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-8 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:brightness-110"
              >
                <ClipboardCheck className="h-5 w-5" />
                {tRights("check_eligibility_button")}
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.08)] px-8 py-3 font-semibold text-[hsl(var(--accent-foreground))] transition-all hover:bg-[hsl(var(--accent)/0.15)]"
              >
                <Heart className="h-5 w-5" />
                {tRights("ask_question")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
