"use client";

import { useTranslations } from "next-intl";
import {
  Phone,
  Globe,
  ExternalLink,
  Headphones,
  Building2,
  MessageSquare,
  Heart,
  Shield,
  Users,
  HelpCircle,
  BookOpen,
  Stethoscope,
} from "lucide-react";

/* ===== Data ===== */

interface Hotline {
  id: string;
  nameHe: string;
  nameEn: string;
  phone: string;
  descriptionHe: string;
  descriptionEn: string;
  icon: typeof Phone;
  color: string;
  iconColor: string;
}

interface Organization {
  id: string;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  website?: string;
  phone?: string;
  icon: typeof Building2;
  color: string;
  iconColor: string;
}

const HOTLINES: Hotline[] = [
  {
    id: "idf_center",
    nameHe: "מרכז מידע צה\"ל",
    nameEn: "IDF Information Center",
    phone: "1111 (ext 2)",
    descriptionHe: "מרכז שירות ומידע של צה\"ל — שלוחה 2 לחיילים בודדים",
    descriptionEn: "IDF service center — extension 2 for lone soldiers",
    icon: Shield,
    color:
      "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50",
    iconColor:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "whatsapp",
    nameHe: "וואטסאפ צה\"ל",
    nameEn: "IDF WhatsApp",
    phone: "052-9437725",
    descriptionHe: "מענה בוואטסאפ לשאלות ובירורים",
    descriptionEn: "WhatsApp support for questions and inquiries",
    icon: MessageSquare,
    color:
      "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50",
    iconColor:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    id: "soldier_complaints",
    nameHe: "נציב תלונות חיילים",
    nameEn: "Soldier Complaints Commissioner",
    phone: "03-6977374",
    descriptionHe: "הגשת תלונות וברורים על זכויות חיילים",
    descriptionEn: "Filing complaints about soldier rights",
    icon: HelpCircle,
    color:
      "from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50",
    iconColor:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: "government_info",
    nameHe: "מרכז מידע ממשלתי",
    nameEn: "Government Information Center",
    phone: "1299",
    descriptionHe: "מידע כללי על שירותים ממשלתיים",
    descriptionEn: "General information about government services",
    icon: Building2,
    color:
      "from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50",
    iconColor:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    id: "rehabilitation",
    nameHe: "שיקום נכים",
    nameEn: "Rehabilitation Services",
    phone: "*8150",
    descriptionHe: "אגף שיקום — משרד הביטחון",
    descriptionEn: "Rehabilitation Division — Ministry of Defense",
    icon: Stethoscope,
    color:
      "from-rose-500/10 to-rose-600/5 border-rose-200/50 dark:border-rose-800/50",
    iconColor:
      "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
];

const ORGANIZATIONS: Organization[] = [
  {
    id: "nbn",
    nameHe: "נפש בנפש (NBN)",
    nameEn: "Nefesh B'Nefesh",
    descriptionHe: "ארגון המסייע לעלייה מצפון אמריקה ובריטניה",
    descriptionEn: "Organization facilitating Aliyah from North America and UK",
    website: "https://www.nbn.org.il",
    icon: Globe,
    color:
      "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50",
    iconColor:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "garin_tzabar",
    nameHe: "צופים — גרעין צבר",
    nameEn: "Tzofim Garin Tzabar",
    descriptionHe: "תוכנית לחיילים בודדים מחו\"ל — ליווי לפני, במהלך ואחרי השירות",
    descriptionEn: "Program for lone soldiers from abroad — support before, during, and after service",
    website: "https://www.garintzabar.org",
    icon: Users,
    color:
      "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50",
    iconColor:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    id: "awis",
    nameHe: "AWIS",
    nameEn: "Association for the Wellbeing of Israel's Soldiers",
    descriptionHe: "עמותה לרווחת חיילי ישראל",
    descriptionEn: "Supporting the wellbeing of IDF soldiers",
    website: "https://www.awis.org",
    icon: Heart,
    color:
      "from-rose-500/10 to-rose-600/5 border-rose-200/50 dark:border-rose-800/50",
    iconColor:
      "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
  {
    id: "jewish_agency",
    nameHe: "הסוכנות היהודית",
    nameEn: "The Jewish Agency",
    descriptionHe: "תמיכה בעלייה ובקליטה בישראל",
    descriptionEn: "Supporting Aliyah and absorption in Israel",
    website: "https://www.jewishagency.org",
    icon: Building2,
    color:
      "from-indigo-500/10 to-indigo-600/5 border-indigo-200/50 dark:border-indigo-800/50",
    iconColor:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    id: "mentor_lechaim",
    nameHe: "מנטור לחיים",
    nameEn: "Mentor LeChaim",
    descriptionHe: "חונכות וליווי לחיילים בודדים משוחררים",
    descriptionEn: "Mentoring for discharged lone soldiers",
    icon: BookOpen,
    color:
      "from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50",
    iconColor:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    id: "lamerhav",
    nameHe: "למרחב",
    nameEn: "LaMerhav",
    descriptionHe: "מעטפת תמיכה לחיילים בודדים",
    descriptionEn: "Support network for lone soldiers",
    icon: Heart,
    color:
      "from-teal-500/10 to-teal-600/5 border-teal-200/50 dark:border-teal-800/50",
    iconColor:
      "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  {
    id: "lsc",
    nameHe: "LSC — מרכז חיילים בודדים",
    nameEn: "Lone Soldier Center",
    descriptionHe: "מרכז תמיכה ומשאבים לחיילים בודדים",
    descriptionEn: "Support and resource center for lone soldiers",
    icon: Shield,
    color:
      "from-cyan-500/10 to-cyan-600/5 border-cyan-200/50 dark:border-cyan-800/50",
    iconColor:
      "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  {
    id: "michael_levin",
    nameHe: "בסיס מייקל לוין",
    nameEn: "Michael Levin Base",
    descriptionHe: "מרכז קהילתי ותמיכה לחיילים בודדים בירושלים",
    descriptionEn: "Community center and support for lone soldiers in Jerusalem",
    website: "https://www.michaellevinbase.org",
    icon: Users,
    color:
      "from-violet-500/10 to-violet-600/5 border-violet-200/50 dark:border-violet-800/50",
    iconColor:
      "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    id: "habayit_shel_benji",
    nameHe: "הבית של בנג'י",
    nameEn: "HaBayit Shel Benji",
    descriptionHe: "בית חם ותמיכה לחיילים בודדים בראש העין",
    descriptionEn: "A warm home and support for lone soldiers in Rosh HaAyin",
    icon: Heart,
    color:
      "from-pink-500/10 to-pink-600/5 border-pink-200/50 dark:border-pink-800/50",
    iconColor:
      "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  },
];

/* ===== Main Page Component ===== */

export default function ResourcesPage() {
  const t = useTranslations("resources");

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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.08)] px-4 py-1.5 text-sm font-medium text-[hsl(var(--accent-foreground))]">
              <Headphones className="h-4 w-4 text-[hsl(var(--accent))]" />
              <span>24/7</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Hotlines Section ===== */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-rose-100 p-3 dark:bg-rose-900/30">
              <Phone className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("hotlines")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOTLINES.map((hotline) => (
              <div
                key={hotline.id}
                className={`group overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${hotline.color}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 rounded-xl p-3 ${hotline.iconColor}`}
                  >
                    <hotline.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">
                      {hotline.nameHe}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {hotline.nameEn}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {hotline.descriptionHe}
                </p>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                  <Phone className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <a
                    href={`tel:${hotline.phone.replace(/[^0-9*#]/g, "")}`}
                    className="font-mono text-base font-bold text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--accent))]"
                    dir="ltr"
                  >
                    {hotline.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Organizations Section ===== */}
      <section className="border-t border-border/40 bg-[hsl(var(--primary)/0.02)] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("organizations")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ORGANIZATIONS.map((org) => (
              <div
                key={org.id}
                className={`group overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${org.color}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 rounded-xl p-3 ${org.iconColor}`}
                  >
                    <org.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">
                      {org.nameHe}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {org.nameEn}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {org.descriptionHe}
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm font-medium text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--accent))]"
                    >
                      <Globe className="h-4 w-4" />
                      <span>{t("website")}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {org.phone && (
                    <a
                      href={`tel:${org.phone.replace(/[^0-9*#]/g, "")}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm font-medium text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--accent))]"
                    >
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{org.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
