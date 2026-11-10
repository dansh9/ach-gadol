"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Wallet,
  Home,
  Plane,
  GraduationCap,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ClipboardCheck,
  Zap,
  Heart,
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
  sourceUrl?: string;
  howToGetHe?: string;
  howToGetEn?: string;
}

interface RightsCategory {
  id: string;
  translationKey: string;
  icon: typeof Wallet;
  rights: Right[];
}

const IDF_FINANCIAL_URL = "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%9B%D7%9C%D7%9B%D7%9C%D7%99%D7%95%D7%AA-%D7%A7%D7%91%D7%95%D7%A2%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/";
const IDF_HOUSING_URL = "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8/";
const IDF_LONE_URL = "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/";

const RIGHTS_DATA: RightsCategory[] = [
  {
    id: "financial",
    translationKey: "financial",
    icon: Wallet,
    rights: [
      {
        id: "lone_soldier_allowance",
        titleHe: "תוספת חייל בודד",
        titleEn: "Lone Soldier Allowance",
        amount: "620",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "כל חייל בודד מוכר",
        conditionsEn: "All recognized lone soldiers",
        sourceHe: 'צה"ל — מדריך זכויות אח גדול 2025-26',
        sourceEn: "IDF — Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "התוספת מחושבת אוטומטית לאחר הכרה כחייל בודד.",
        howToGetEn:
          "The allowance is calculated automatically after lone soldier recognition.",
      },
      {
        id: "combat_allowance",
        titleHe: "תוספת בודד לוחם (רמ\"פ א'+)",
        titleEn: "Combat Allowance (Activity Level א'+)",
        amount: "482",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד ברמת פעילות (רמ\"פ) א'+ — לוחמים",
        conditionsEn: "Lone soldiers at Activity Level (רמ\"פ) א'+ — combat roles",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "התוספת מחושבת אוטומטית על פי רמת הפעילות (רמ\"פ) של התפקיד.",
        howToGetEn:
          "Automatically calculated based on your Activity Level (רמ\"פ) classification.",
      },
      {
        id: "combat_support_allowance",
        titleHe: "תוספת בודד תומך לחימה (רמ\"פ א')",
        titleEn: "Combat Support Allowance (Activity Level א')",
        amount: "241",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד ברמת פעילות (רמ\"פ) א' — תומכי לחימה",
        conditionsEn: "Lone soldiers at Activity Level (רמ\"פ) א' — combat support",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "התוספת מחושבת אוטומטית על פי רמת הפעילות (רמ\"פ) של התפקיד.",
        howToGetEn:
          "Automatically calculated based on your Activity Level (רמ\"פ) classification.",
      },
      {
        id: "living_allowance",
        titleHe: "דמי קיום (לפי רמ\"פ)",
        titleEn: "Living Allowance (by Activity Level)",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "רמ\"פ א'+: 1,983 ₪ | רמ\"פ א': 1,666 ₪ | רמ\"פ ב': 1,575 ₪ | רמ\"פ ג': 1,486 ₪ | רמ\"פ ד': 1,366 ₪",
        conditionsEn: "Level א'+: 1,983 ₪ | Level א': 1,666 ₪ | Level ב': 1,575 ₪ | Level ג': 1,486 ₪ | Level ד': 1,366 ₪",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "דמי הקיום מחושבים אוטומטית לפי רמת הפעילות (רמ\"פ) של התפקיד.",
        howToGetEn:
          "Living allowance is calculated automatically based on your Activity Level (רמ\"פ).",
      },
      {
        id: "shopping_vouchers",
        titleHe: "תווי קנייה (חוגר)",
        titleEn: "Shopping Vouchers (Hoger)",
        amount: "150",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "שופרסל, יש חסד, קואופ-שופ, כוורת (Koveret). אסור טבק ואלכוהול!",
        conditionsEn: "Shufersal, Yesh Chesed, Co-op Shop, Koveret. No tobacco/alcohol!",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "התווים מחולקים אוטומטית לחיילים בודדים מוכרים.",
        howToGetEn:
          "Vouchers are distributed automatically to recognized lone soldiers.",
      },
      {
        id: "holiday_vouchers",
        titleHe: "תווי שי לחג",
        titleEn: "Holiday Gift Vouchers",
        amount: "500",
        frequency: "one_time",
        frequencyHe: 'סה"כ לשנה',
        conditionsHe: "500 ₪ סה\"כ — לפסח ולראש השנה",
        conditionsEn: "500 ₪ total — for Pesach and Rosh Hashana",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "השוברים מחולקים אוטומטית לפני החגים דרך היחידה.",
        howToGetEn:
          "Vouchers are distributed automatically before holidays through your unit.",
      },
      {
        id: "bazak_grant",
        titleHe: "מענק בזק (חירום)",
        titleEn: "Bazak Emergency Grant",
        amount: "300–600",
        frequency: "one_time",
        frequencyHe: "לשנה (עד פעמיים)",
        conditionsHe: "רמ\"פ ב' ומטה: 300 ₪ | רמ\"פ א' ומעלה: 600 ₪. עד פעמיים בשנת שירות. באישור גורם ת\"ש.",
        conditionsEn: "Activity Level ב' and below: 300 ₪ | Level א' and above: 600 ₪. Up to twice per service year.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה. לא נדרשים מסמכי הוכחה כספיים.",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer. No financial documentation required.",
      },
      {
        id: "general_grant",
        titleHe: "מענק כללי",
        titleEn: "General Grant",
        amount: "4,000–5,000",
        frequency: "one_time",
        frequencyHe: "עד, לשנה",
        conditionsHe: "רמ\"פ א' ומעלה ודרג א': עד 5,000 ₪ | יתר החיילים: עד 4,000 ₪. דורש אישורים תומכים ומיצוי סיוע אחר.",
        conditionsEn: "Activity Level א'+ and Grade א': up to 5,000 ₪ | Others: up to 4,000 ₪. Requires supporting documents and exhausting other aid.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה עם מסמכים תומכים. ניתן גם כמענק מתמשך (לדוגמה: 200 ₪ × 5 חודשים).",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer with supporting documents. Can also be approved as ongoing grant (e.g., 200 ₪ × 5 months).",
      },
      {
        id: "immigration_ministry",
        titleHe: "מענק משרד הקליטה (עולים בלבד)",
        titleEn: "Immigration Ministry Grant (Olim Only)",
        amount: "540",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "עולה חדש בלבד",
        conditionsEn: "New immigrants (Olim) only",
        sourceHe: "משרד הקליטה",
        sourceEn: "Ministry of Aliyah and Integration",
        sourceUrl:
          "https://www.gov.il/he/Departments/General/olim_soldiers_lonely_soldiers",
        howToGetHe:
          "פנו לסניף משרד הקליטה הקרוב עם תעודת עולה ואישור חייל בודד. טלפון *3721.",
        howToGetEn:
          "Visit your nearest Ministry of Immigration office with Oleh certificate and lone soldier confirmation. Call *3721.",
      },
      {
        id: "housing_ministry",
        titleHe: "מענק משרד הבינוי והשיכון (עולים בלבד)",
        titleEn: "Housing Ministry Grant (Olim Only)",
        amount: "402",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "עולה חדש ששוכר דירה",
        conditionsEn: "New immigrants paying rent",
        sourceHe: "משרד הבינוי והשיכון",
        sourceEn: "Ministry of Housing",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          'הגישו בקשה באתר משרד השיכון או בסניף הקרוב. יש לצרף חוזה שכירות ואישור חייל בודד. טלפון *5442.',
        howToGetEn:
          "Apply via the Ministry of Housing website or nearest branch. Attach rental contract and lone soldier certificate. Call *5442.",
      },
      {
        id: "marriage_grant",
        titleHe: "מענק נישואין",
        titleEn: "Marriage Grant",
        amount: "1,410",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "חייל בודד שמתחתן בזמן השירות. לאחר 3 חודשי מעבר, הזכאות כחייל בודד נפסקת ועוברים למסלול חייל נשוי.",
        conditionsEn: "Lone soldier who marries during service. After 3 month transition, lone soldier eligibility ends — transitions to married soldier framework.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_FINANCIAL_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה עם תעודת נישואין.",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer with marriage certificate.",
      },
      {
        id: "electricity_discount",
        titleHe: "הנחה בחשמל (50%)",
        titleEn: "Electricity Discount (50%)",
        amount: "50%",
        frequency: "one_time",
        frequencyHe: "הנחה קבועה",
        conditionsHe: "50% הנחה על 400 וואט ראשונים",
        conditionsEn: "50% discount on first 400 watts",
        sourceHe: "חברת החשמל",
        sourceEn: "Israel Electric Corporation",
        sourceUrl:
          "https://www.iec.co.il/content/tariffs/contentpages/socialtariff",
        howToGetHe:
          "פנו לחברת החשמל עם אישור חייל בודד וחשבון חשמל על שמכם.",
        howToGetEn:
          "Contact Israel Electric Corporation with lone soldier certificate and electricity bill in your name.",
      },
      {
        id: "property_tax",
        titleHe: "פטור מארנונה",
        titleEn: "Property Tax Exemption",
        amount: "100%",
        frequency: "one_time",
        frequencyHe: "פטור מלא",
        conditionsHe: "פטור מתשלום ארנונה מטעם העירייה",
        conditionsEn: "Municipal property tax exemption",
        sourceHe: "רשות מקומית",
        sourceEn: "Local Municipality",
        sourceUrl:
          "https://www.gov.il/he/departments/guides/tax?chapterIndex=2",
        howToGetHe:
          "פנו למחלקת הארנונה ברשות המקומית עם אישור חייל בודד וחוזה שכירות.",
        howToGetEn:
          "Contact the local municipality's property tax department with lone soldier certificate and rental contract.",
      },
      {
        id: "dental",
        titleHe: "טיפול שיניים פרוטתי",
        titleEn: "Prosthetic Dental Treatment",
        frequency: "one_time",
        frequencyHe: "עד 2 טיפולים",
        conditionsHe: "עד 2 טיפולי כתר/שתל, בהצגת אישור רופא לסגל הת\"ש",
        conditionsEn: "Up to 2 crown/implant treatments, by presenting doctor's certificate to Tat\"Sh staff (סגל הת\"ש)",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "קבלו אישור מרופא שיניים והציגו אותו לסגל הת\"ש ביחידה.",
        howToGetEn:
          "Get a certificate from a dentist and present it to your unit's Tat\"Sh staff.",
      },
    ],
  },
  {
    id: "housing",
    translationKey: "housing",
    icon: Home,
    rights: [
      {
        id: "rent_subsidy",
        titleHe: "אפשרות A — השתתפות בשכ\"ד",
        titleEn: "Option A — Rent Reimbursement",
        amount: "1,807",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "חייל בודד מוכר ששוכר דירה. שימו לב: עלויות המחייה גבוהות מההשתתפות! אפשרות A ו-A2 הן חלופיות — לא מצטברות.",
        conditionsEn: "Recognized lone soldiers renting an apartment. Note: living costs exceed reimbursement! Options A and A2 are alternatives — not additive.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה עם חוזה שכירות ואישור חייל בודד.",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer with rental contract and lone soldier certificate.",
      },
      {
        id: "maintenance_allowance",
        titleHe: "אפשרות A2 — החזר הוצאות אחזקה",
        titleEn: "Option A2 — Housing Maintenance",
        amount: "362",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "לחיילים הגרים בדירה אך לא משלמים שכ\"ד. חלופה לאפשרות A — לא ניתן לקבל את שתיהן.",
        conditionsEn: "For soldiers living in an apartment but NOT paying rent. Alternative to Option A — cannot receive both.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה.",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer.",
      },
      {
        id: "beit_cham",
        titleHe: "אפשרות B — בית חם (אל\"ח)",
        titleEn: "Option B — Beit Cham (ALACH)",
        amount: "400",
        frequency: "per_month",
        frequencyHe: "תווי מזון לחודש",
        conditionsHe: "דירות מרוהטות, 3-6 חיילים, חינם. 400 ₪ תווי מזון (מחליפים את 150 ₪ תווי חוגר). דרוש 6+ חודשי שירות שנותרו.",
        conditionsEn: "Free furnished apartments, 3-6 soldiers. 400 ₪ food vouchers (replaces 150 ₪ Hoger). Requires 6+ months remaining service.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          "פנו לגורם ת\"ש או ישירות לאגודה למען החייל (אל\"ח).",
        howToGetEn:
          "Contact your Tat\"Sh officer or the Association for the Soldier (ALACH) directly.",
      },
      {
        id: "beit_hachayal",
        titleHe: "בית החייל (8 מיקומים)",
        titleEn: "Beit HaChayal (8 Locations)",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "ת\"א, ר\"ג, חיפה, ב\"ש, אילת, ירושלים, קריית שמונה, טבריה",
        conditionsEn: "Tel Aviv, Ramat Gan, Haifa, Beer Sheva, Eilat, Jerusalem, Kiryat Shmona, Tiberias",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          "פנו ישירות לסניף בית החייל הקרוב עם תעודה צבאית ואישור חייל בודד.",
        howToGetEn:
          "Contact your nearest Beit HaChayal branch with military ID and lone soldier certificate.",
      },
      {
        id: "kibbutz",
        titleHe: "אפשרות C — אימוץ בקיבוץ",
        titleEn: "Option C — Kibbutz Adoption",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "לחיילים בבסיסים סגורים — דירה מרוהטת ללא תשלום",
        conditionsEn: "For soldiers at closed bases — free furnished apartment",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה לשיבוץ לקיבוץ.",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer for kibbutz placement.",
      },
      {
        id: "furniture",
        titleHe: "ריהוט ומוצרי חשמל (חדשים!)",
        titleEn: "Furniture & Appliances (New!)",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "לשוכרי דירה פרטית בלבד. מוצרים חדשים מהחנות, אין צורך להחזיר. לא זכאים: בית החייל, בית חם, קיבוץ.",
        conditionsEn: "For private renters only. Brand new items, no return needed. Not eligible: Beit HaChayal, Beit Cham, Kibbutz.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_HOUSING_URL,
        howToGetHe:
          "פנו לגורם ת\"ש ביחידה. חשוב לבדוק מידות ריהוט וחיבורי מכשירים בדירה לפני הזמנה.",
        howToGetEn:
          "Contact your unit's Tat\"Sh officer. Verify dimensions and connections in the apartment before ordering.",
      },
    ],
  },
  {
    id: "vacations",
    translationKey: "vacations",
    icon: Plane,
    rights: [
      {
        id: "abroad_leave",
        titleHe: 'חופשה מיוחדת לחו"ל',
        titleEn: "Overseas Special Leave",
        amount: "30",
        frequency: "one_time",
        frequencyHe: "ימים בשנת שירות",
        conditionsHe: 'חייל בודד עם הורים בחו"ל. פעם בשנת שירות, ניתן לפצל.',
        conditionsEn: "Lone soldier with parents abroad. Once per service year, can be split.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          'הגישו בקשה דרך המפקד הישיר. יש למלא טופס יציאה עם אישור ביטחוני + אישור מפקד.',
        howToGetEn:
          "Submit a request through your direct commander. Fill out exit form with security clearance + commander approval.",
      },
      {
        id: "flight_funding",
        titleHe: "מימון טיסה (100%)",
        titleEn: "Flight Funding (100%)",
        frequency: "one_time",
        frequencyHe: "לפי סוג תפקיד",
        conditionsHe: "בודד מובהק בלבד. לוחמים: אחרי 8 חודשים (פעמיים בשירות — רק לוחמים!). תומכ\"ל רמ\"פ א'/א'+: אחרי שנה. אחרים: אחרי חצי שירות או 12 חודשים.",
        conditionsEn: "Boded Muvhak only. Combat: after 8 months (twice during service — combat only!). Support at Level א'/א'+: after 1 year. Others: after half service or 12 months.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "הגישו בקשה חודש+ לפני מועד הנסיעה. דרושים: טופס יציאה, דרכון ישראלי תקף (6+ חודשים), דרכון זר אם אזרח כפול.",
        howToGetEn:
          "Submit request 1+ month before travel. Required: exit form, valid Israeli passport (6+ months), foreign passport if dual citizen.",
      },
      {
        id: "family_visit",
        titleHe: "ביקור הורה בארץ (4–8 ימים)",
        titleEn: "Parent Visit Leave (4–8 Days)",
        amount: "4–8",
        frequency: "one_time",
        frequencyHe: "ימים בשנת שירות",
        conditionsHe: "4 ימים ברירת מחדל. עד 8 באישור מפקד. בהכשרה — מאושרים 4 ימי חופשה מיוחדת בלבד.",
        conditionsEn: "4 days standard. Up to 8 with commander approval. In training — 4 special leave days only.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "הגישו בקשה דרך המפקד הישיר כשהורה מגיע לביקור.",
        howToGetEn:
          "Submit a request through your direct commander when a parent visits.",
      },
      {
        id: "errands_day",
        titleHe: "יום סידורים",
        titleEn: "Personal Errands Day",
        frequency: "one_time",
        frequencyHe: "פעם ב-2 חודשים / פעם בחודש בהכשרה",
        conditionsHe: "פעם ב-2 חודשים בשירות סדיר, פעם בחודש בתקופת הכשרה",
        conditionsEn: "Every 2 months in regular service, monthly during training",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "תאמו עם המפקד הישיר.",
        howToGetEn:
          "Coordinate with your direct commander.",
      },
      {
        id: "moving_leave",
        titleHe: "חופשה למעבר דירה",
        titleEn: "Moving Leave",
        amount: "2",
        frequency: "one_time",
        frequencyHe: "ימים בשנת שירות",
        conditionsHe: "2 ימים, פעם בשנת שירות",
        conditionsEn: "2 days, once per service year",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "הגישו בקשה דרך המפקד הישיר.",
        howToGetEn:
          "Submit a request through your direct commander.",
      },
      {
        id: "special_leaves",
        titleHe: "חופשות מיוחדות (לא נגרעות!)",
        titleEn: "Special Leaves (Not Deducted!)",
        amount: "40",
        frequency: "one_time",
        frequencyHe: "ימים מקסימום בשנה",
        conditionsHe: "חופשה כלכלית + אישית + לימודים — לא נגרעות מסה\"כ ימי החופשה. עד 40 ימים בשנת שירות.",
        conditionsEn: "Economic + personal + study leave — NOT deducted from total leave days. Up to 40 days per service year.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "הגישו בקשה דרך המפקד. דמי כלכלה: 22 ₪/יום בחופשה כלכלית.",
        howToGetEn:
          "Submit through your commander. Food allowance: 22 ₪/day during economic leave.",
      },
      {
        id: "early_leave",
        titleHe: "יציאה מוקדמת בימי שישי וחגים",
        titleEn: "Early Release on Fridays & Holidays",
        frequency: "one_time",
        frequencyHe: "כל שישי וערב חג",
        conditionsHe: "המפקד חייב לשחרר בזמן שמאפשר הגעה הביתה עד 10:00",
        conditionsEn: "Commander must release in time to arrive home by 10:00",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl: IDF_LONE_URL,
        howToGetHe:
          "זכות אוטומטית — תאמו עם המפקד לגבי שעת היציאה.",
        howToGetEn:
          "Automatic right — coordinate with your commander regarding departure time.",
      },
    ],
  },
  {
    id: "post_service",
    translationKey: "post_service",
    icon: GraduationCap,
    rights: [
      {
        id: "discharge_grant",
        titleHe: "מענק שחרור",
        titleEn: "Discharge Grant",
        frequency: "one_time",
        frequencyHe: "לחודש שירות",
        conditionsHe: "לוחמים: כ-589 ₪/חודש | תומכי לחימה: כ-491 ₪/חודש | אחרים: כ-392 ₪/חודש. כ-90% מופקדים תוך שבועיים מהשחרור.",
        conditionsEn: "Combat: ~589 ₪/mo | Support: ~491 ₪/mo | Other: ~392 ₪/mo. ~90% deposited within 2 weeks of discharge.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9C%D7%90-%D7%9E%D7%A4%D7%95%D7%91%D7%9C%D7%A9/%D7%90%D7%99%D7%92%D7%A8%D7%AA-%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%94%D7%9E%D7%A9%D7%AA%D7%97%D7%A8%D7%A8/",
        howToGetHe:
          'המענק מועבר אוטומטית לחשבון הבנק. ודאו שפרטי הבנק מעודכנים במערכת צה"ל.',
        howToGetEn:
          "The grant is transferred automatically to your bank account. Ensure bank details are updated in the IDF system.",
      },
      {
        id: "personal_deposit",
        titleHe: "פיקדון אישי (6 ייעודים, 5 שנים)",
        titleEn: "Personal Deposit (6 Purposes, 5 Years)",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe:
          "הקמת עסק, הכשרה מקצועית, שיעורי נהיגה, לימודים, רכישת דירה, רכישת רכב. ניתן למימוש 5 שנים מהשחרור.",
        conditionsEn:
          "Starting a business, vocational training, driving lessons, studies, purchasing apartment, purchasing vehicle. Valid 5 years post-discharge.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.hachvana.mod.gov.il/GrantAndDeposit/DepositUpTo5/Pages/default.aspx",
        howToGetHe:
          "הפיקדון נפתח אוטומטית. למימוש — הגישו בקשה דרך אתר האגף והקרן.",
        howToGetEn:
          "The deposit is opened automatically. To withdraw — apply via the Division and Fund website.",
      },
      {
        id: "post_housing_rent",
        titleHe: "סיוע בשכירות לאחר שחרור",
        titleEn: "Post-Discharge Rent Assistance",
        amount: "1,000",
        frequency: "per_month",
        frequencyHe: "לחודש × 12 חודשים",
        conditionsHe: "עד 1,000 ₪/חודש למשך 12 חודשים מיום השחרור. לחיילים שהיו מוכרים כבודדים וקיבלו הטבת דיור בשירות.",
        conditionsEn: "Up to 1,000 ₪/month for 12 months from discharge date. For soldiers recognized as Boded with housing benefits during service.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8-%D7%9C%D7%90%D7%97%D7%A8-%D7%94%D7%A9%D7%97%D7%A8%D7%95%D7%A8/",
        howToGetHe:
          "פנו לאגף והקרן לחיילים משוחררים. טלפון 03-7776770.",
        howToGetEn:
          "Contact the Division and Fund for Discharged Soldiers. Phone: 03-7776770.",
      },
      {
        id: "free_accommodation",
        titleHe: "בית החייל — עד 3 חודשים לאחר שחרור",
        titleEn: "Beit HaChayal — Up to 3 Months Post-Discharge",
        frequency: "one_time",
        frequencyHe: "3 חודשים",
        conditionsHe: "ללא אפשרות הארכה. לאחר מכן — סיוע שכירות להשלמת 12 חודשים.",
        conditionsEn: "No extension possible. Afterwards — rent assistance for remaining 12 months.",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8-%D7%9C%D7%90%D7%97%D7%A8-%D7%94%D7%A9%D7%97%D7%A8%D7%95%D7%A8/",
        howToGetHe:
          "פנו לגורם ת\"ש לפני השחרור לתיאום מגורים.",
        howToGetEn:
          "Contact Tat\"Sh before discharge to arrange accommodation.",
      },
      {
        id: "tax_credits",
        titleHe: "נקודות זיכוי ממס הכנסה",
        titleEn: "Income Tax Credits",
        frequency: "one_time",
        frequencyHe: "3 שנים",
        conditionsHe: "2 נקודות זיכוי למשך 3 שנים (כ-484 ₪/חודש חיסכון). דרוש 23+ חודשי שירות (גברים) / 22+ (נשים).",
        conditionsEn: "2 tax credit points for 3 years (~484 ₪/month savings). Requires 23+ months service (male) / 22+ (female).",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9C%D7%90-%D7%9E%D7%A4%D7%95%D7%91%D7%9C%D7%A9/%D7%90%D7%99%D7%92%D7%A8%D7%AA-%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%94%D7%9E%D7%A9%D7%AA%D7%97%D7%A8%D7%A8/",
        howToGetHe:
          "דווחו למעסיק על הזכאות. ניתן לממש גם דרך שומת מס שנתית.",
        howToGetEn:
          "Inform your employer about the eligibility. Can also be claimed through annual tax assessment.",
      },
      {
        id: "free_transport",
        titleHe: "תחבורה ציבורית חינם (שנה)",
        titleEn: "Free Public Transportation (1 Year)",
        frequency: "one_time",
        frequencyHe: "שנה מהשחרור",
        conditionsHe: "שנה של תחבורה ציבורית חינם מיום השחרור",
        conditionsEn: "1 year free public transportation from discharge date",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9C%D7%90-%D7%9E%D7%A4%D7%95%D7%91%D7%9C%D7%A9/%D7%90%D7%99%D7%92%D7%A8%D7%AA-%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%94%D7%9E%D7%A9%D7%AA%D7%97%D7%A8%D7%A8/",
        howToGetHe:
          "הזכאות מופעלת אוטומטית ברב-קו / כרטיס חופשי.",
        howToGetEn:
          "Eligibility is activated automatically on Rav-Kav / free card.",
      },
      {
        id: "psychometric_voucher",
        titleHe: "שובר קורס פסיכומטרי",
        titleEn: "Psychometric Course Voucher",
        amount: "1,500",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "1,500 ₪ חד-פעמי לקורס הכנה לפסיכומטרי",
        conditionsEn: "1,500 ₪ one-time for psychometric prep course",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9C%D7%90-%D7%9E%D7%A4%D7%95%D7%91%D7%9C%D7%A9/%D7%90%D7%99%D7%92%D7%A8%D7%AA-%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%94%D7%9E%D7%A9%D7%AA%D7%97%D7%A8%D7%A8/",
        howToGetHe:
          "פנו לאגף והקרן לחיילים משוחררים.",
        howToGetEn:
          "Contact the Division and Fund for Discharged Soldiers.",
      },
      {
        id: "discharge_seminar",
        titleHe: "סדנת הכנה לאזרחות (5 ימים)",
        titleEn: "Discharge Preparation Seminar (5 Days)",
        frequency: "one_time",
        frequencyHe: "כ-3 חודשים לפני שחרור",
        conditionsHe: "סדנה בת 5 ימים — זכויות, קבלת החלטות, תקצוב, שילוב תעסוקתי. גם אח גדול מקיים סדנאות!",
        conditionsEn: "5-day seminar — rights, decision-making, budgeting, career integration. Ach Gadol also runs seminars!",
        sourceHe: 'מדריך זכויות אח גדול 2025-26',
        sourceEn: "Ach Gadol Rights Guide 2025-26",
        sourceUrl:
          "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9C%D7%90-%D7%9E%D7%A4%D7%95%D7%91%D7%9C%D7%A9/%D7%90%D7%99%D7%92%D7%A8%D7%AA-%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%94%D7%9E%D7%A9%D7%AA%D7%97%D7%A8%D7%A8/",
        howToGetHe:
          "הרשמה דרך מדור כוח אדם ביחידה כ-3 חודשים לפני השחרור.",
        howToGetEn:
          "Register through your unit's Personnel Division ~3 months before discharge.",
      },
    ],
  },
  {
    id: "reserves",
    translationKey: "reserves",
    icon: Shield,
    rights: [
      {
        id: "reserve_household",
        titleHe: "כלכלת בית",
        titleEn: "Household Maintenance",
        amount: "1,000",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "עד 1,000 ₪ — באישור ועדת חריגים",
        conditionsEn: "Up to 1,000 ₪ — approved by exceptions committee",
        sourceHe: "קרן הסיוע למשרתי מילואים בודדים",
        sourceEn: "Lone Reservist Support Fund",
        sourceUrl:
          "https://www.miluim.idf.il/articles-list/%D7%A7%D7%A8%D7%9F-%D7%94%D7%A1%D7%99%D7%95%D7%A2-%D7%9C%D7%9E%D7%A9%D7%A8%D7%AA%D7%99-%D7%94%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D",
        howToGetHe:
          "פנו לקרן הסיוע באתר מילואים. הקרן פעילה 15/11/2023 עד 31/12/2026.",
        howToGetEn:
          "Contact the Support Fund via the miluim website. Fund active: 15/11/2023 through 31/12/2026.",
      },
      {
        id: "reserve_flight",
        titleHe: "החזר טיסה",
        titleEn: "Flight Reimbursement",
        amount: "5,000",
        frequency: "one_time",
        frequencyHe: "עד",
        conditionsHe: "עד 5,000 ₪ לתושבי חוץ שגויסו בצו 8",
        conditionsEn: "Up to 5,000 ₪ for non-residents called by Tzav 8",
        sourceHe: "קרן הסיוע למשרתי מילואים בודדים",
        sourceEn: "Lone Reservist Support Fund",
        sourceUrl:
          "https://www.miluim.idf.il/articles-list/%D7%A7%D7%A8%D7%9F-%D7%94%D7%A1%D7%99%D7%95%D7%A2-%D7%9C%D7%9E%D7%A9%D7%A8%D7%AA%D7%99-%D7%94%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D",
        howToGetHe:
          "פנו לקרן הסיוע באתר מילואים עם צו 8 ותעודת טיסה.",
        howToGetEn:
          "Contact the Support Fund with Tzav 8 order and flight documentation.",
      },
      {
        id: "reserve_family_grant",
        titleHe: "מענק ניהול משק בית",
        titleEn: "Family Management Grant",
        amount: "2,000",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "8+ ימי צו 8 + יש ילד",
        conditionsEn: "8+ days Tzav 8 + has child",
        sourceHe: "קרן הסיוע למשרתי מילואים בודדים",
        sourceEn: "Lone Reservist Support Fund",
        sourceUrl:
          "https://www.miluim.idf.il/articles-list/%D7%A7%D7%A8%D7%9F-%D7%94%D7%A1%D7%99%D7%95%D7%A2-%D7%9C%D7%9E%D7%A9%D7%A8%D7%AA%D7%99-%D7%94%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D",
        howToGetHe:
          "פנו לקרן הסיוע באתר מילואים.",
        howToGetEn:
          "Contact the Support Fund via the miluim website.",
      },
      {
        id: "reserve_enhanced",
        titleHe: "מענק כלכלת בית מוגבר",
        titleEn: "Enhanced Household Grant",
        amount: "2,500",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: "45 ימי צו 8 במערך הלחימה",
        conditionsEn: "45 days Tzav 8 in combat array",
        sourceHe: "קרן הסיוע למשרתי מילואים בודדים",
        sourceEn: "Lone Reservist Support Fund",
        sourceUrl:
          "https://www.miluim.idf.il/articles-list/%D7%A7%D7%A8%D7%9F-%D7%94%D7%A1%D7%99%D7%95%D7%A2-%D7%9C%D7%9E%D7%A9%D7%A8%D7%AA%D7%99-%D7%94%D7%9E%D7%99%D7%9C%D7%95%D7%90%D7%99%D7%9D",
        howToGetHe:
          "פנו לקרן הסיוע באתר מילואים.",
        howToGetEn:
          "Contact the Support Fund via the miluim website.",
      },
    ],
  },
];

/* ===== Right Card Component ===== */

function RightCard({
  right,
  tRights,
  locale,
}: {
  right: Right;
  tRights: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHe = locale === "he";

  const title = isHe ? right.titleHe : right.titleEn;
  const conditions = isHe ? right.conditionsHe : right.conditionsEn;
  const howToGet = isHe ? right.howToGetHe : right.howToGetEn;
  const source = isHe ? right.sourceHe : right.sourceEn;
  const frequency = isHe
    ? right.frequencyHe
    : right.frequency
      ? tRights(right.frequency)
      : undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all hover:shadow-md">
      <div className="p-5 sm:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-bold leading-snug text-foreground sm:text-[17px]">
            {title}
          </h3>
          {right.amount && (
            <div className="flex-shrink-0 text-end">
              <div className="text-xl font-extrabold text-[hsl(var(--primary))] sm:text-2xl">
                {right.amount.includes("%") ? right.amount : `₪${right.amount}`}
              </div>
              {frequency && (
                <p className="text-[11px] font-medium text-muted-foreground">
                  {frequency}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Badge for non-amount items */}
        {!right.amount && frequency && (
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-[hsl(var(--primary)/0.08)] px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
              {frequency}
            </span>
          </div>
        )}

        {/* Conditions preview */}
        {conditions && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {conditions}
          </p>
        )}

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--primary))] transition-colors hover:text-[hsl(var(--primary)/0.7)]"
        >
          <Info className="h-4 w-4" />
          <span>{tRights("details")}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border/30 pt-4">
            {howToGet && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/70">
                  {tRights("how_to_get")}
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {howToGet}
                </p>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground/70">
                {tRights("source")}
              </p>
              {right.sourceUrl ? (
                <a
                  href={right.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--primary))] hover:underline"
                >
                  <span>{source}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <p className="text-sm text-foreground">{source}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Category Section Component ===== */

function CategorySection({
  category,
  tRights,
  locale,
}: {
  category: RightsCategory;
  tRights: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const Icon = category.icon;

  return (
    <section id={category.id} className="scroll-mt-20">
      {/* Category Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
          <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {tRights(`categories.${category.translationKey}`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {category.rights.length} {tRights("rights_count")}
          </p>
        </div>
      </div>

      {/* Rights Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {category.rights.map((right) => (
          <RightCard
            key={right.id}
            right={right}
            tRights={tRights}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

/* ===== Quick Jump Navigation ===== */

function QuickJumpNav({
  tRights,
}: {
  tRights: ReturnType<typeof useTranslations>;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Jump to category">
      {RIGHTS_DATA.map((category) => {
        const Icon = category.icon;
        return (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.04)] hover:text-[hsl(var(--primary))] active:scale-[0.98]"
          >
            <Icon className="h-4 w-4" />
            <span>{tRights(`categories.${category.translationKey}`)}</span>
          </a>
        );
      })}
    </nav>
  );
}

/* ===== Main Page Component ===== */

export default function RightsPage() {
  const tRights = useTranslations("rights");
  const locale = useLocale();

  return (
    <div className="flex flex-col">
      {/* ===== Hero Header ===== */}
      <section className="border-b border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.06)] px-3 py-1 text-sm font-medium text-foreground">
              <Shield className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              <span>{tRights("badge_count")}</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {tRights("title")}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {tRights("subtitle")}
            </p>

            <div className="mt-7">
              <Link
                href="/check"
                className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:brightness-110"
              >
                <ClipboardCheck className="h-5 w-5" />
                <span>{tRights("check_eligibility_button")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Main Content ===== */}
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Quick Jump Navigation */}
        <div className="mb-10">
          <QuickJumpNav tRights={tRights} />
        </div>

        {/* All Category Sections */}
        <div className="space-y-14 sm:space-y-16">
          {RIGHTS_DATA.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              tRights={tRights}
              locale={locale}
            />
          ))}
        </div>
      </div>

      {/* ===== Bottom CTA ===== */}
      <section className="border-t border-border/40 bg-[hsl(var(--primary)/0.03)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-4 inline-flex rounded-xl bg-[hsl(var(--primary)/0.1)] p-3">
              <Zap className="h-7 w-7 text-[hsl(var(--primary))]" />
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {tRights("not_sure_title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {tRights("not_sure_description")}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/check"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg hover:brightness-110 sm:w-auto"
              >
                <ClipboardCheck className="h-5 w-5" />
                {tRights("check_eligibility_button")}
              </Link>
              <Link
                href="/chat"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 sm:w-auto"
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
