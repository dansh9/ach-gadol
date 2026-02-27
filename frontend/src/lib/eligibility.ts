/* ===================================================================
 * Eligibility Rules Engine
 * Shared between client (check page) and server (API route).
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
      monthlyAmount: 620.7,
      noteHe: "לכל חייל בודד מוכר",
      noteEn: "For all recognized lone soldiers",
      category: "financial",
    });

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

    rights.push({
      id: "food_allowance",
      titleHe: "דמי כלכלה",
      titleEn: "Food Allowance",
      monthlyAmount: 150,
      noteHe: "בבסיסים ללא חדר אוכל",
      noteEn: "At bases without dining facilities",
      category: "financial",
    });

    rights.push({
      id: "holiday_vouchers",
      titleHe: "שוברי חגים",
      titleEn: "Holiday Vouchers",
      oneTimeAmount: 500,
      noteHe: "~250 ש\"ח פעמיים בשנה",
      noteEn: "~NIS 250 twice a year",
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
    }

    rights.push({
      id: "housing_ministry",
      titleHe: "מענק משרד השיכון",
      titleEn: "Housing Ministry Grant",
      monthlyAmount: 402,
      noteHe: "לחיילים ששוכרים דירה",
      noteEn: "For soldiers renting an apartment",
      category: "financial",
    });

    rights.push({
      id: "electricity_discount",
      titleHe: "הנחת חשמל",
      titleEn: "Electricity Discount",
      monthlyAmount: 105,
      noteHe: "בדירה עצמאית",
      noteEn: "In a private apartment",
      category: "financial",
    });

    rights.push({
      id: "property_tax",
      titleHe: "פטור מארנונה (100%)",
      titleEn: "Property Tax Exemption (100%)",
      noteHe: "פטור מלא מארנונה",
      noteEn: "Full property tax exemption",
      category: "financial",
    });

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
    rights.push(
      {
        id: "discharge_grant",
        titleHe: "מענק שחרור",
        titleEn: "Discharge Grant",
        noteHe: "סכום בהתאם לתקופת השירות",
        noteEn: "Amount based on service duration",
        category: "post_service",
      },
      {
        id: "personal_deposit",
        titleHe: "פיקדון אישי (6 ייעודים, 5 שנים)",
        titleEn: "Personal Deposit (6 Purposes, 5 Years)",
        noteHe: "לימודים, דיור, עסק, נסיעות, חתונה, רכב",
        noteEn: "Education, housing, business, travel, wedding, vehicle",
        category: "post_service",
      },
      {
        id: "free_accommodation",
        titleHe: "3 חודשי מגורים חינם",
        titleEn: "3 Months Free Accommodation",
        noteHe: "מיד לאחר שחרור",
        noteEn: "Immediately after discharge",
        category: "post_service",
      }
    );

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

    rights.push(
      {
        id: "rent_grant",
        titleHe: "מענק שכירות חד-פעמי (5,000 ש\"ח)",
        titleEn: "One-Time Rent Grant (NIS 5,000)",
        oneTimeAmount: 5000,
        noteHe: "מענק חד-פעמי",
        noteEn: "One-time grant",
        category: "post_service",
      },
      {
        id: "extended_benefits",
        titleHe: "הטבות מורחבות — עד 10 שנים",
        titleEn: "Extended Benefits — Up to 10 Years",
        noteHe: "זכאות מורחבת לאחר שחרור",
        noteEn: "Extended eligibility post-discharge",
        category: "post_service",
      },
      {
        id: "career_assessment",
        titleHe: "אבחון קריירה",
        titleEn: "Career Assessment",
        noteHe: "ייעוץ מקצועי חינם",
        noteEn: "Free professional counseling",
        category: "post_service",
      },
      {
        id: "education_funding",
        titleHe: "מימון לימודים",
        titleEn: "Education Funding",
        noteHe: "סיוע במימון לימודים",
        noteEn: "Education funding assistance",
        category: "post_service",
      },
      {
        id: "knafayim",
        titleHe: "תוכנית כנפיים",
        titleEn: "Knafayim Program",
        noteHe: "מלגות ותמיכה כלכלית",
        noteEn: "Scholarships and financial support",
        category: "post_service",
      }
    );
  }

  // === Reserve Duty Rights ===
  if (serviceStatus === "reserves") {
    rights.push(
      {
        id: "reserve_accommodation",
        titleHe: "מגורים בזמן מילואים",
        titleEn: "Accommodation During Reserves",
        noteHe: "מגורים מסובסדים",
        noteEn: "Subsidized accommodation",
        category: "reserves",
      },
      {
        id: "reserve_expenses",
        titleHe: "החזר הוצאות",
        titleEn: "Expense Reimbursement",
        noteHe: "שכירות ומחיה",
        noteEn: "Rent and living expenses",
        category: "reserves",
      },
      {
        id: "reserve_mental_health",
        titleHe: "בריאות הנפש",
        titleEn: "Mental Health Support",
        noteHe: "תמיכה מקצועית חינם",
        noteEn: "Free professional support",
        category: "reserves",
      },
      {
        id: "reserve_career",
        titleHe: "ייעוץ תעסוקתי",
        titleEn: "Career Counseling",
        noteHe: "הכוונה מקצועית",
        noteEn: "Professional guidance",
        category: "reserves",
      }
    );
  }

  return rights;
}
