/* ===================================================================
 * Eligibility Rules Engine
 * Shared between client (check page) and server (API route).
 * Amounts based on Ach Gadol Rights Guide 2025-26 (primary source).
 * =================================================================== */

export type SoldierType =
  | "lone_classic"
  | "child_of_emigrants"
  | "child_of_envoys"
  | "no_family_support"
  | "orphan"
  | "foster_family";

export type ServiceStatus = "pre_service" | "in_service" | "released" | "reserves";

export interface EligibilityAnswers {
  soldierType: SoldierType | null;
  serviceStatus: ServiceStatus | null;
  isCombat: boolean | null;
  isImmigrant: boolean | null;
  parentsAbroad: boolean | null;
}

export interface EligibleRight {
  id: string;
  titleHe: string;
  titleEn: string;
  monthlyAmount?: number;
  oneTimeAmount?: number;
  noteHe: string;
  noteEn: string;
  category: "financial" | "housing" | "vacations" | "post_service" | "reserves";
  /**
   * Rights sharing a group are alternatives, not additions. Only the highest
   * monthlyAmount in the group counts toward a total. Both are still listed,
   * because which one applies depends on the soldier's housing situation.
   */
  exclusiveGroup?: string;
}

/**
 * Monthly total across eligible rights, counting each exclusive group once.
 *
 * Summing every monthlyAmount overstated the total, because rent reimbursement
 * (option A) and the housing maintenance allowance (option A2) are alternatives
 * and cannot both be received. The notes on those two rights have always said
 * so; the total did not reflect it.
 */
export function totalMonthly(rights: EligibleRight[]): number {
  const bestPerGroup = new Map<string, number>();
  let sum = 0;

  for (const right of rights) {
    const amount = right.monthlyAmount ?? 0;
    if (right.exclusiveGroup) {
      const best = bestPerGroup.get(right.exclusiveGroup) ?? 0;
      bestPerGroup.set(right.exclusiveGroup, Math.max(best, amount));
    } else {
      sum += amount;
    }
  }

  bestPerGroup.forEach((amount) => {
    sum += amount;
  });

  return sum;
}

export function calculateEligibility(answers: EligibilityAnswers): EligibleRight[] {
  const rights: EligibleRight[] = [];
  const { soldierType, serviceStatus, isCombat, isImmigrant, parentsAbroad } = answers;

  if (!soldierType || !serviceStatus) return rights;

  // === Active Service Rights ===
  if (serviceStatus === "in_service") {
    rights.push({
      id: "lone_soldier_allowance",
      titleHe: "תוספת חייל בודד",
      titleEn: "Lone Soldier Allowance",
      monthlyAmount: 620,
      noteHe: "לכל חייל בודד מוכר",
      noteEn: "For all recognized lone soldiers",
      category: "financial",
    });

    if (isCombat === true) {
      rights.push({
        id: "combat_allowance",
        titleHe: "תוספת לוחם (רמ\"פ א'+)",
        titleEn: "Combat Allowance (Level א'+)",
        monthlyAmount: 482,
        noteHe: "עבור חיילים בתפקיד לוחם ברמ\"פ א'+",
        noteEn: "For combat soldiers at activity level א'+",
        category: "financial",
      });
    } else if (isCombat === false) {
      rights.push({
        id: "combat_support_allowance",
        titleHe: "תוספת תומך לחימה (רמ\"פ א')",
        titleEn: "Combat Support Allowance (Level א')",
        monthlyAmount: 241,
        noteHe: "עבור חיילים בתפקיד תומך לחימה ברמ\"פ א'",
        noteEn: "For combat support soldiers at activity level א'",
        category: "financial",
      });
    }

    rights.push({
      id: "shopping_vouchers",
      titleHe: "תווי קנייה (חוגר)",
      titleEn: "Shopping Vouchers",
      monthlyAmount: 150,
      noteHe: "שופרסל, יש חסד, קואופ-שופ, כוורת. אסור טבק ואלכוהול!",
      noteEn: "Shufersal, Yesh Chesed, Co-op Shop, Koveret. No tobacco/alcohol!",
      category: "financial",
    });

    rights.push({
      id: "holiday_vouchers",
      titleHe: "שי לחג",
      titleEn: "Holiday Vouchers",
      oneTimeAmount: 500,
      noteHe: "500 ₪ לשנה (פסח וראש השנה)",
      noteEn: "500 ₪/year (Pesach and Rosh Hashana)",
      category: "financial",
    });

    rights.push({
      id: "living_allowance",
      titleHe: "דמי קיום (לפי רמ\"פ)",
      titleEn: "Living Allowance (by Activity Level)",
      noteHe: "רמ\"פ א'+: 1,983 ₪ | רמ\"פ א': 1,666 ₪ | רמ\"פ ב': 1,575 ₪ | רמ\"פ ג': 1,486 ₪ | רמ\"פ ד': 1,366 ₪",
      noteEn: "Level א'+: 1,983 ₪ | Level א': 1,666 ₪ | Level ב': 1,575 ₪ | Level ג': 1,486 ₪ | Level ד': 1,366 ₪",
      category: "financial",
    });

    rights.push({
      id: "general_grant",
      titleHe: "מענק כללי",
      titleEn: "General Grant",
      noteHe: "רמ\"פ א' ומעלה ודרג א': עד 5,000 ₪ | יתר החיילים: עד 4,000 ₪. דורש אישורים תומכים ומיצוי סיוע אחר.",
      noteEn: "Level א'+ & Grade א': up to 5,000 ₪ | Others: up to 4,000 ₪. Requires supporting documents.",
      category: "financial",
    });

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

      rights.push({
        id: "housing_ministry",
        titleHe: "מענק משרד הבינוי והשיכון",
        titleEn: "Housing Ministry Grant",
        monthlyAmount: 402,
        noteHe: "לעולים חדשים השוכרים דירה",
        noteEn: "For new immigrants renting an apartment",
        category: "financial",
      });
    }

    rights.push({
      id: "electricity_discount",
      titleHe: "הנחה בחשמל (50%)",
      titleEn: "Electricity Discount (50%)",
      noteHe: "50% הנחה על 400 וואט ראשונים",
      noteEn: "50% discount on first 400 watts",
      category: "financial",
    });

    rights.push({
      id: "property_tax",
      titleHe: "פטור מארנונה",
      titleEn: "Property Tax Exemption",
      noteHe: "פטור מתשלום ארנונה מטעם העירייה",
      noteEn: "Municipal property tax exemption",
      category: "financial",
    });

    rights.push({
      id: "rent_subsidy",
      titleHe: "השתתפות בשכ\"ד (כ-1,807 ש\"ח)",
      titleEn: "Rent Reimbursement (~NIS 1,807)",
      monthlyAmount: 1807,
      noteHe: "השתתפות בשכ\"ד חודשי. שימו לב: עלויות מחייה גבוהות מההשתתפות! אפשרות A ו-A2 הן חלופיות (לא מצטברות).",
      noteEn: "Monthly rent reimbursement. Note: living costs exceed reimbursement! Options A and A2 are alternatives (not additive).",
      category: "housing",
      exclusiveGroup: "housing_option_a",
    });

    rights.push({
      id: "maintenance_allowance",
      titleHe: "אפשרות A2 — החזר הוצאות אחזקת דירה (הא\"ד)",
      titleEn: "Option A2 — Housing Maintenance (HAD)",
      monthlyAmount: 362,
      noteHe: "לחיילים הגרים בדירה אך לא משלמים שכ\"ד. חלופה לאפשרות A — לא ניתן לקבל שכ\"ד והא\"ד יחד.",
      noteEn: "For soldiers in an apartment but NOT paying rent. Alternative to Option A — cannot receive both.",
      category: "housing",
      exclusiveGroup: "housing_option_a",
    });

    rights.push({
      id: "beit_cham",
      titleHe: "דירת בית חם (אל\"ח — חינם)",
      titleEn: "Beit Cham Apartment (Free)",
      noteHe: "דירה מרוהטת, 3-6 חיילים, חינם. 400 ₪ תווי מזון. דרוש 6+ חודשי שירות שנותרו.",
      noteEn: "Furnished apartment, 3-6 soldiers, free. 400 ₪ food vouchers. Requires 6+ months remaining.",
      category: "housing",
    });

    rights.push({
      id: "beit_hachayal",
      titleHe: "בית החייל (8 מיקומים)",
      titleEn: "Beit HaChayal (8 Locations)",
      noteHe: "ת\"א, ר\"ג, חיפה, ב\"ש, אילת, י-ם, קריית שמונה, טבריה",
      noteEn: "Tel Aviv, Ramat Gan, Haifa, Beer Sheva, Eilat, Jerusalem, Kiryat Shmona, Tiberias",
      category: "housing",
    });

    rights.push({
      id: "kibbutz_adoption",
      titleHe: "אימוץ בקיבוץ",
      titleEn: "Kibbutz Adoption",
      noteHe: "לחיילים בבסיסים סגורים — דירה מרוהטת ללא תשלום",
      noteEn: "For soldiers at closed bases — free furnished apartment",
      category: "housing",
    });

    rights.push({
      id: "furniture",
      titleHe: "ריהוט ומוצרי חשמל (חדשים!)",
      titleEn: "Furniture & Appliances (New!)",
      noteHe: "לשוכרי דירה בלבד. מוצרים חדשים מהחנות, אין צורך להחזיר.",
      noteEn: "For renters only. Brand new items, no need to return.",
      category: "housing",
    });

    if (parentsAbroad === true) {
      rights.push({
        id: "abroad_leave",
        titleHe: "30 ימי חופשה לחו\"ל",
        titleEn: "30 Days Overseas Leave",
        noteHe: "פעם בשנת שירות (ניתן לפצל)",
        noteEn: "Once per service year (can be split)",
        category: "vacations",
      });

      rights.push({
        id: "flight_funding",
        titleHe: "מימון טיסה (100%)",
        titleEn: "Flight Funding (100%)",
        noteHe: "בודד מובהק: מימון מלא. לוחמים: אחרי 8 חודשים (פעמיים בשירות — רק ללוחמים!). תומכ\"ל רמ\"פ א'/א'+: אחרי שנה. אחרים: אחרי מחצית השירות או 12 חודשים.",
        noteEn: "Boded Muvhak: full funding. Combat: after 8 months (twice during service — combat only!). Support at Level א'/א'+: after 1 year. Others: after half service or 12 months.",
        category: "vacations",
      });

      rights.push({
        id: "family_visit",
        titleHe: "4–8 ימי ביקור הורה",
        titleEn: "4–8 Family Visit Days",
        noteHe: "4 ימים ברירת מחדל, עד 8 באישור מפקד. פעם בשנת שירות. בהכשרה — מאושרים 4 ימי חופשה מיוחדת בלבד.",
        noteEn: "4 days standard, up to 8 with commander approval. Once per service year. In training — 4 special leave days only.",
        category: "vacations",
      });
    }

    rights.push({
      id: "errands_day",
      titleHe: "יום סידורים",
      titleEn: "Personal Errands Day",
      noteHe: "פעם ב-2 חודשים בסדיר, פעם בחודש בהכשרה",
      noteEn: "Every 2 months in regular service, monthly during training",
      category: "vacations",
    });

    rights.push({
      id: "moving_leave",
      titleHe: "חופשה למעבר דירה (2 ימים)",
      titleEn: "Moving Leave (2 Days)",
      noteHe: "פעם בשנת שירות",
      noteEn: "Once per service year",
      category: "vacations",
    });

    rights.push({
      id: "dental",
      titleHe: "טיפול שיניים פרוטתי",
      titleEn: "Prosthetic Dental Treatment",
      noteHe: "עד 2 טיפולי כתר/שתל, בהצגת אישור רופא לסגל הת\"ש",
      noteEn: "Up to 2 crown/implant treatments, by presenting doctor's certificate to Tat\"Sh staff",
      category: "financial",
    });

    rights.push({
      id: "legal_aid",
      titleHe: "סיוע משפטי (עמותת נד\"ן)",
      titleEn: "Legal Aid (Nadan Organization)",
      noteHe: "עזרה בסעד משפטי",
      noteEn: "Legal assistance through Nadan org",
      category: "financial",
    });
  }

  // === Post-Service Rights ===
  if (serviceStatus === "released") {
    rights.push(
      {
        id: "discharge_grant",
        titleHe: "מענק שחרור",
        titleEn: "Discharge Grant",
        noteHe: "לוחמים: כ-589 ₪/חודש | תומכי לחימה: כ-491 ₪/חודש | אחרים: כ-392 ₪/חודש",
        noteEn: "Combat: ~589 ₪/mo | Support: ~491 ₪/mo | Other: ~392 ₪/mo",
        category: "post_service",
      },
      {
        id: "personal_deposit",
        titleHe: "פיקדון אישי (6 ייעודים, 5 שנים)",
        titleEn: "Personal Deposit (6 Purposes, 5 Years)",
        noteHe: "הקמת עסק, הכשרה מקצועית, נהיגה, לימודים, דירה, רכב",
        noteEn: "Business, vocational training, driving, studies, apartment, vehicle",
        category: "post_service",
      },
      {
        id: "free_accommodation",
        titleHe: "בית החייל עד 3 חודשים",
        titleEn: "Beit HaChayal Up to 3 Months",
        noteHe: "ללא אפשרות הארכה. לאחר מכן — סיוע שכירות להשלמת 12 חודשים.",
        noteEn: "No extension possible. Then rent assistance for remaining 12 months.",
        category: "post_service",
      }
    );

    rights.push({
      id: "rent_assistance_post",
      titleHe: "סיוע בשכירות (עד 1,000 ש\"ח × 12 חודשים)",
      titleEn: "Rent Assistance (up to NIS 1,000 × 12 months)",
      monthlyAmount: 1000,
      noteHe: "לחיילים שהיו מוכרים כבודדים וזכאים לדיור בשירות. פנייה לאגף והקרן.",
      noteEn: "For soldiers recognized as Boded with housing benefits during service. Apply to Division & Fund.",
      category: "post_service",
    });

    rights.push(
      {
        id: "tax_credits",
        titleHe: "נקודות זיכוי ממס הכנסה",
        titleEn: "Income Tax Credits",
        noteHe: "2 נקודות זיכוי למשך 3 שנים (כ-484 ₪/חודש חיסכון). דרוש 23+ חודשי שירות (גברים) / 22+ (נשים).",
        noteEn: "2 tax credit points for 3 years (~484 ₪/month savings). Requires 23+ months service (male) / 22+ (female).",
        category: "post_service",
      },
      {
        id: "free_transport",
        titleHe: "תחבורה ציבורית חינם (שנה)",
        titleEn: "Free Public Transportation (1 Year)",
        noteHe: "שנה של תחבורה ציבורית חינם מיום השחרור",
        noteEn: "1 year free public transportation from discharge date",
        category: "post_service",
      },
      {
        id: "psychometric_voucher",
        titleHe: "שובר קורס פסיכומטרי (1,500 ₪)",
        titleEn: "Psychometric Course Voucher (1,500 ₪)",
        oneTimeAmount: 1500,
        noteHe: "1,500 ₪ חד-פעמי לקורס הכנה לפסיכומטרי",
        noteEn: "1,500 ₪ one-time for psychometric prep course",
        category: "post_service",
      },
      {
        id: "discharge_seminar",
        titleHe: "סדנת הכנה לאזרחות (5 ימים)",
        titleEn: "Discharge Preparation Seminar (5 days)",
        noteHe: "כ-3 חודשים לפני שחרור. גם אח גדול מקיים סדנאות!",
        noteEn: "~3 months before discharge. Ach Gadol also runs seminars!",
        category: "post_service",
      }
    );
  }

  // === Reserve Duty Rights (per miluim.idf.il — Lone Reservist Support Fund) ===
  if (serviceStatus === "reserves") {
    rights.push(
      {
        id: "reserve_household",
        titleHe: "כלכלת בית",
        titleEn: "Household Maintenance",
        oneTimeAmount: 1000,
        noteHe: "עד 1,000 ₪ — באישור ועדת חריגים. הקרן פעילה עד 31/12/2026.",
        noteEn: "Up to 1,000 ₪ — approved by exceptions committee. Fund active through 31/12/2026.",
        category: "reserves",
      },
      {
        id: "reserve_flight",
        titleHe: "החזר טיסה",
        titleEn: "Flight Reimbursement",
        oneTimeAmount: 5000,
        noteHe: "עד 5,000 ₪ לתושבי חוץ שגויסו בצו 8",
        noteEn: "Up to 5,000 ₪ for non-residents called by Tzav 8",
        category: "reserves",
      },
      {
        id: "reserve_family_grant",
        titleHe: "מענק ניהול משק בית",
        titleEn: "Family Management Grant",
        oneTimeAmount: 2000,
        noteHe: "8+ ימי צו 8 + יש ילד",
        noteEn: "8+ days Tzav 8 + has child",
        category: "reserves",
      },
      {
        id: "reserve_enhanced",
        titleHe: "מענק כלכלת בית מוגבר",
        titleEn: "Enhanced Household Grant",
        oneTimeAmount: 2500,
        noteHe: "45 ימי צו 8 במערך הלחימה",
        noteEn: "45 days Tzav 8 in combat array",
        category: "reserves",
      }
    );
  }

  return rights;
}
