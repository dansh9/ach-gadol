"use client";

import { useTranslations } from "next-intl";
import { Phone, Globe, ExternalLink } from "lucide-react";

/* ===== Data ===== */

interface Hotline {
  id: string;
  nameHe: string;
  nameEn: string;
  phone: string;
  descriptionHe: string;
  descriptionEn: string;
}

interface OfficialResource {
  id: string;
  nameHe: string;
  nameEn: string;
  descriptionHe: string;
  descriptionEn: string;
  website?: string;
  phone?: string;
}

const HOTLINES: Hotline[] = [
  {
    id: "idf_center",
    nameHe: "מרכז מידע צה\"ל",
    nameEn: "IDF Information Center",
    phone: "1111 (ext 2)",
    descriptionHe: "מרכז שירות ומידע של צה\"ל — שלוחה 2 לחיילים בודדים",
    descriptionEn: "IDF service center — extension 2 for lone soldiers",
  },
  {
    id: "whatsapp",
    nameHe: "וואטסאפ צה\"ל",
    nameEn: "IDF WhatsApp",
    phone: "052-9437725",
    descriptionHe: "מענה בוואטסאפ לשאלות ובירורים",
    descriptionEn: "WhatsApp support for questions and inquiries",
  },
  {
    id: "soldier_complaints",
    nameHe: "נציב תלונות חיילים",
    nameEn: "Soldier Complaints Commissioner",
    phone: "03-6977374",
    descriptionHe: "הגשת תלונות וברורים על זכויות חיילים",
    descriptionEn: "Filing complaints about soldier rights",
  },
  {
    id: "government_info",
    nameHe: "מרכז מידע ממשלתי",
    nameEn: "Government Information Center",
    phone: "1299",
    descriptionHe: "מידע כללי על שירותים ממשלתיים",
    descriptionEn: "General information about government services",
  },
  {
    id: "rehabilitation",
    nameHe: "שיקום נכים — משרד הביטחון",
    nameEn: "Rehabilitation Services — Ministry of Defense",
    phone: "*8150",
    descriptionHe: "אגף שיקום — משרד הביטחון",
    descriptionEn: "Rehabilitation Division — Ministry of Defense",
  },
];

const OFFICIAL_RESOURCES: OfficialResource[] = [
  {
    id: "ministry_immigration",
    nameHe: "משרד העלייה והקליטה",
    nameEn: "Ministry of Aliyah and Integration",
    descriptionHe: "מענקים, סיוע בדיור ושירותי קליטה לעולים חדשים וחיילים בודדים",
    descriptionEn: "Grants, housing assistance and absorption services for new immigrants and lone soldiers",
    website: "https://www.gov.il/he/departments/ministry_of_aliyah_and_integration",
    phone: "*3721",
  },
  {
    id: "ministry_housing",
    nameHe: "משרד הבינוי והשיכון",
    nameEn: "Ministry of Housing",
    descriptionHe: "סיוע בשכירות ומענקי דיור לחיילים בודדים",
    descriptionEn: "Rent assistance and housing grants for lone soldiers",
    website: "https://www.gov.il/he/departments/ministry_of_construction_and_housing",
    phone: "*5442",
  },
  {
    id: "ministry_defense",
    nameHe: "משרד הביטחון — אגף שיקום",
    nameEn: "Ministry of Defense — Rehabilitation",
    descriptionHe: "שיקום, תמיכה נפשית וסיוע לאחר שחרור",
    descriptionEn: "Rehabilitation, mental health support and post-discharge assistance",
    website: "https://www.gov.il/he/departments/ministry_of_defense",
    phone: "*8150",
  },
  {
    id: "bituach_leumi",
    nameHe: "המוסד לביטוח לאומי",
    nameEn: "National Insurance Institute",
    descriptionHe: "הטבות ביטוח לאומי, קצבאות ודמי שחרור",
    descriptionEn: "National insurance benefits, allowances and discharge grants",
    website: "https://www.btl.gov.il",
    phone: "*6050",
  },
];

/* ===== Main Page Component ===== */

export default function ResourcesPage() {
  const t = useTranslations("resources");

  return (
    <div className="flex flex-col">
      {/* ===== Header ===== */}
      <section className="border-b border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Hotlines Section ===== */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">
            {t("hotlines")}
          </h2>

          <div className="space-y-3">
            {HOTLINES.map((hotline) => (
              <div
                key={hotline.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {hotline.nameHe}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {hotline.descriptionHe}
                  </p>
                </div>
                <a
                  href={`tel:${hotline.phone.replace(/[^0-9*#]/g, "")}`}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary)/0.08)] px-3 py-2 font-mono text-sm font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.15)]"
                  dir="ltr"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {hotline.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Official Resources Section ===== */}
      <section className="border-t border-border/40 bg-[hsl(var(--primary)/0.02)] py-8 sm:py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-5 text-xl font-bold text-foreground sm:text-2xl">
            {t("organizations")}
          </h2>

          <div className="space-y-3">
            {OFFICIAL_RESOURCES.map((resource) => (
              <div
                key={resource.id}
                className="rounded-xl border border-border/50 bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {resource.nameHe}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {resource.descriptionHe}
                    </p>
                  </div>
                  {resource.phone && (
                    <a
                      href={`tel:${resource.phone.replace(/[^0-9*#]/g, "")}`}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary)/0.08)] px-3 py-2 font-mono text-sm font-bold text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.15)]"
                      dir="ltr"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {resource.phone}
                    </a>
                  )}
                </div>
                {resource.website && (
                  <a
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-[hsl(var(--primary))] transition-colors hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{t("website")}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
