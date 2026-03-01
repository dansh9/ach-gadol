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
        amount: "620.70",
        frequency: "per_month",
        frequencyHe: "לחודש",
        conditionsHe: "כל חייל בודד מוכר",
        conditionsEn: "All recognized lone soldiers",
        sourceHe: 'צה"ל — מדור כוח אדם',
        sourceEn: "IDF — Personnel Division",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%9B%D7%9C%D7%9B%D7%9C%D7%99%D7%95%D7%AA-%D7%A7%D7%91%D7%95%D7%A2%D7%95%D7%AA/",
        howToGetHe:
          "פנו למדור כוח אדם ביחידה. התוספת מחושבת אוטומטית לאחר הכרה כחייל בודד.",
        howToGetEn:
          "Contact your unit's Personnel Division. The allowance is calculated automatically after lone soldier recognition.",
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
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%9B%D7%9C%D7%9B%D7%9C%D7%99%D7%95%D7%AA-%D7%A7%D7%91%D7%95%D7%A2%D7%95%D7%AA/",
        howToGetHe:
          "התוספת מחושבת אוטומטית על פי סיווג התפקיד ביחידה.",
        howToGetEn:
          "Automatically calculated based on your unit role classification.",
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
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%9B%D7%9C%D7%9B%D7%9C%D7%99%D7%95%D7%AA-%D7%A7%D7%91%D7%95%D7%A2%D7%95%D7%AA/",
        howToGetHe:
          "התוספת מחושבת אוטומטית על פי סיווג התפקיד ביחידה.",
        howToGetEn:
          "Automatically calculated based on your unit role classification.",
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
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%A0%D7%9C%D7%95%D7%95%D7%AA/",
        howToGetHe:
          "פנו למדור כוח אדם ביחידה עם אישור שהבסיס ללא חדר אוכל.",
        howToGetEn:
          "Contact your unit's Personnel Division with confirmation that the base has no dining facility.",
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
        sourceHe: 'משרד הקליטה / צה"ל',
        sourceEn: "Ministry of Immigration / IDF",
        sourceUrl: "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA%D7%A0%D7%90%D7%99-%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA-%D7%A9/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%94%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%91%D7%A1%D7%93%D7%99%D7%A8/",
        howToGetHe:
          "השוברים מחולקים אוטומטית לפני החגים דרך היחידה. יש לוודא שהפרטים מעודכנים.",
        howToGetEn:
          "Vouchers are distributed automatically before holidays through your unit. Ensure your details are up to date.",
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
        sourceUrl:
          "https://www.gov.il/he/Departments/General/olim_soldiers_lonely_soldiers",
        howToGetHe:
          "פנו לסניף משרד הקליטה הקרוב עם תעודת עולה ואישור חייל בודד. ניתן לפנות גם דרך טלפון *3721.",
        howToGetEn:
          "Visit your nearest Ministry of Immigration office with Oleh certificate and lone soldier confirmation. Call *3721.",
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
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8/",
        howToGetHe:
          'הגישו בקשה באתר משרד השיכון או בסניף הקרוב. יש לצרף חוזה שכירות ואישור חייל בודד. טלפון *5442.',
        howToGetEn:
          "Apply via the Ministry of Housing website or nearest branch. Attach rental contract and lone soldier certificate. Call *5442.",
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
        sourceUrl:
          "https://www.iec.co.il/content/tariffs/contentpages/socialtariff",
        howToGetHe:
          "פנו לחברת החשמל עם אישור חייל בודד וחשבון חשמל על שמכם. ניתן להגיש בקשה מקוונת.",
        howToGetEn:
          "Contact Israel Electric Corporation with lone soldier certificate and an electricity bill in your name. Online application available.",
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
        sourceUrl:
          "https://www.gov.il/he/departments/guides/tax?chapterIndex=2",
        howToGetHe:
          "פנו למחלקת הארנונה ברשות המקומית עם אישור חייל בודד וחוזה שכירות/נסח טאבו.",
        howToGetEn:
          "Contact the local municipality's property tax department with lone soldier certificate and rental contract/land registry.",
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
        titleHe: "סבסוד שכירות",
        titleEn: "Rent Subsidy",
        amount: "1,800",
        frequency: "per_month",
        frequencyHe: "עד לחודש",
        conditionsHe: "חייל בודד ששוכר דירה",
        conditionsEn: "Lone soldiers renting an apartment (up to NIS 1,800/mo)",
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8/",
        howToGetHe:
          "פנו למדור כוח אדם ביחידה עם חוזה שכירות ואישור חייל בודד. הסבסוד מועבר ישירות לחשבון הבנק.",
        howToGetEn:
          "Contact your unit's Personnel Division with rental contract and lone soldier certificate. Subsidy is transferred directly to your bank account.",
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
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8/",
        howToGetHe:
          "הגישו בקשה דרך אתר עמותת עלאך או פנו לנציג העמותה בבסיס. יש לצרף אישור חייל בודד ותעודת עולה.",
        howToGetEn:
          "Apply through the Alach Association website or contact their representative at your base. Attach lone soldier certificate and Oleh ID.",
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
        sourceUrl:
          "https://www.hachvana.mod.gov.il/ExtraBenefits/SingleSolders/Pages/default.aspx",
        howToGetHe:
          "פנו ישירות לסניף בית החייל הקרוב עם תעודה צבאית ואישור חייל בודד. ניתן להירשם גם דרך מדור כוח אדם.",
        howToGetEn:
          "Contact your nearest Beit HaChayal branch with military ID and lone soldier certificate. You can also register through your Personnel Division.",
      },
      {
        id: "kibbutz",
        titleHe: "קיבוץ (מגורים + דמי כיס)",
        titleEn: "Kibbutz (Housing + Pocket Money)",
        amount: "150",
        frequency: "per_month",
        frequencyHe: "דמי כיס + מגורים חינם",
        conditionsHe: "חייל בודד המשובץ לקיבוץ",
        conditionsEn:
          "Lone soldiers assigned to a kibbutz (free housing + NIS 150 pocket money)",
        sourceHe: "תנועה קיבוצית",
        sourceEn: "Kibbutz Movement",
        sourceUrl: "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA%D7%A0%D7%90%D7%99-%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA-%D7%A9/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%94%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%91%D7%A1%D7%93%D7%99%D7%A8/",
        howToGetHe:
          "פנו לתנועה הקיבוצית או לסוכנות היהודית לשיבוץ לקיבוץ. התהליך כולל ראיון והתאמה.",
        howToGetEn:
          "Contact the Kibbutz Movement or Jewish Agency for kibbutz placement. The process includes an interview and matching.",
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
        sourceUrl: "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA%D7%A0%D7%90%D7%99-%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA-%D7%A9/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%94%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%91%D7%A1%D7%93%D7%99%D7%A8/",
        howToGetHe:
          "פנו לקצין העיר ביחידה או לעמותות חיילים בודדים. השיבוץ למשפחה מתבצע בהתאם לאזור המגורים.",
        howToGetEn:
          "Contact your unit's City Officer or lone soldier organizations. Family matching is based on your area of residence.",
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
        titleHe: 'חופשה לחו"ל',
        titleEn: "Overseas Leave",
        amount: "30",
        frequency: "one_time",
        frequencyHe: "ימים בשנה",
        conditionsHe: 'חייל בודד עם הורים בחו"ל',
        conditionsEn: "30 days per year for soldiers with parents abroad",
        sourceHe: 'צה"ל — פקודת מטכ"ל',
        sourceEn: "IDF — General Staff Order",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA/",
        howToGetHe:
          'הגישו בקשה דרך המפקד הישיר. יש למלא טופס בקשה לחופשת חו"ל ולצרף אישור הורים בחו"ל.',
        howToGetEn:
          "Submit a request through your direct commander. Fill out the overseas leave form and attach proof of parents abroad.",
      },
      {
        id: "flight_funding",
        titleHe: "מימון טיסות",
        titleEn: "Flight Funding",
        frequency: "one_time",
        frequencyHe: "בהתאם לזכאות",
        conditionsHe: "מימון חלקי או מלא לטיסות לבקר משפחה",
        conditionsEn: "Partial or full flight funding to visit family",
        sourceHe: 'משרד הקליטה / צה"ל',
        sourceEn: "Ministry of Immigration / IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA/",
        howToGetHe:
          "פנו למשרד הקליטה עם אישור חייל בודד ומסמך נסיעה. חלק מהמימון ניתן גם דרך צה\"ל — בדקו עם מדור כוח אדם.",
        howToGetEn:
          "Contact the Ministry of Immigration with lone soldier certificate and travel document. Some funding is also available through IDF — check with Personnel Division.",
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
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA/",
        howToGetHe:
          "הגישו בקשה דרך המפקד הישיר כשמשפחה מגיעה לביקור. יש לתאם מראש ולצרף אישור כניסה של בני המשפחה.",
        howToGetEn:
          "Submit a request through your direct commander when family visits. Coordinate in advance and attach family entry confirmation.",
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
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA/",
        howToGetHe:
          "ימי החופשה מחושבים אוטומטית. תאמו עם המפקד הישיר לניצול הימים.",
        howToGetEn:
          "Leave days are calculated automatically. Coordinate with your direct commander to use them.",
      },
      {
        id: "early_leave",
        titleHe: "יציאה מוקדמת לחגים",
        titleEn: "Early Leave for Holidays",
        frequency: "one_time",
        frequencyHe: "לפני חגים",
        conditionsHe: "יציאה מוקדמת ערב חג",
        conditionsEn: "Early release before holidays",
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.idf.il/%D7%90%D7%AA%D7%A8%D7%99%D7%9D/%D7%94%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%94%D7%9B%D7%99-%D7%A0%D7%A4%D7%95%D7%A6%D7%95%D7%AA-%D7%91%D7%A6%D7%94%D7%9C/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%97%D7%95%D7%A4%D7%A9%D7%95%D7%AA/",
        howToGetHe:
          "הזכות ניתנת אוטומטית לחיילים בודדים מוכרים. תאמו עם המפקד לגבי שעת היציאה.",
        howToGetEn:
          "This right is granted automatically to recognized lone soldiers. Coordinate with your commander regarding departure time.",
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
        frequencyHe: "חד-פעמי",
        conditionsHe: "עם השחרור — סכום בהתאם לתקופת השירות",
        conditionsEn: "Upon discharge — amount based on service duration",
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.hachvana.mod.gov.il/GrantAndDeposit/Pages/Grant.aspx",
        howToGetHe:
          'המענק מועבר אוטומטית לחשבון הבנק עם השחרור. ודאו שפרטי הבנק מעודכנים במערכת צה"ל.',
        howToGetEn:
          "The grant is transferred automatically to your bank account upon discharge. Ensure your bank details are updated in the IDF system.",
      },
      {
        id: "personal_deposit",
        titleHe: "פיקדון אישי (6 ייעודים, 5 שנים)",
        titleEn: "Personal Deposit (6 Purposes, 5 Years)",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe:
          "ניתן לשימוש ל-6 מטרות: לימודים, דיור, עסק, נסיעות, חתונה, רכב",
        conditionsEn:
          "Can be used for 6 purposes: education, housing, business, travel, wedding, vehicle. Valid 5 years.",
        sourceHe: "משרד הביטחון",
        sourceEn: "Ministry of Defense",
        sourceUrl:
          "https://www.hachvana.mod.gov.il/GrantAndDeposit/DepositUpTo5/Pages/default.aspx",
        howToGetHe:
          "הפיקדון נפתח אוטומטית. למימוש — הגישו בקשה דרך אתר משרד הביטחון או בסניפי בנק הפועלים. יש לבחור ייעוד ולצרף מסמכים תומכים.",
        howToGetEn:
          "The deposit is opened automatically. To withdraw — apply via the Ministry of Defense website or Bank Hapoalim branches. Choose a purpose and attach supporting documents.",
      },
      {
        id: "free_accommodation",
        titleHe: "3 חודשי מגורים חינם",
        titleEn: "3 Months Free Accommodation",
        frequency: "one_time",
        frequencyHe: "3 חודשים",
        conditionsHe: "לאחר שחרור — מגורים חינם",
        conditionsEn: "Free accommodation for 3 months after discharge",
        sourceHe: 'צה"ל / עמותות',
        sourceEn: "IDF / NGOs",
        sourceUrl:
          "https://www.hachvana.mod.gov.il/ExtraBenefits/SingleSolders/Pages/default.aspx",
        howToGetHe:
          "פנו למדור כוח אדם לפני השחרור לתיאום מגורים. ניתן גם לפנות לעמותות כמו עלאך ובית החייל.",
        howToGetEn:
          "Contact Personnel Division before discharge to arrange accommodation. You can also reach out to organizations like Alach and Beit HaChayal.",
      },
      {
        id: "rent_assistance",
        titleHe: "סיוע בשכירות",
        titleEn: "Rent Assistance",
        amount: "12,000",
        frequency: "one_time",
        frequencyHe: "חד-פעמי",
        conditionsHe: 'עד 12,000 ש"ח סיוע בשכירות לאחר שחרור',
        conditionsEn: "Up to NIS 12,000 rent assistance post-discharge",
        sourceHe: "משרד הקליטה",
        sourceEn: "Ministry of Immigration",
        sourceUrl:
          "https://www.hachvana.mod.gov.il/Soldiers/Pages/default.aspx",
        howToGetHe:
          "פנו לסניף משרד הקליטה הקרוב עם תעודת שחרור ותעודת עולה. ניתן לפנות גם דרך טלפון *3721.",
        howToGetEn:
          "Visit your nearest Ministry of Immigration office with discharge certificate and Oleh ID. You can also call *3721.",
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
        sourceUrl:
          "https://www.hachvana.mod.gov.il/Soldiers/Pages/default.aspx",
        howToGetHe:
          "הגישו בקשה דרך אתר משרד השיכון עם תעודת שחרור וחוזה שכירות. טלפון *5442.",
        howToGetEn:
          "Apply via the Ministry of Housing website with discharge certificate and rental contract. Call *5442.",
      },
      {
        id: "extended_benefits",
        titleHe: "הטבות מורחבות — 10 שנים",
        titleEn: "Extended Benefits — 10 Years",
        frequency: "one_time",
        frequencyHe: "עד 10 שנים",
        conditionsHe:
          "זכאות להטבות מורחבות עד 10 שנים לאחר שחרור",
        conditionsEn:
          "Eligibility for extended benefits up to 10 years post-discharge",
        sourceHe: "משרד הקליטה",
        sourceEn: "Ministry of Immigration",
        sourceUrl:
          "https://www.hachvana.mod.gov.il/Soldiers/Pages/default.aspx",
        howToGetHe:
          "הזכאות היא אוטומטית לעולים חדשים. פנו למשרד הקליטה לבירור הטבות ספציפיות. טלפון *3721.",
        howToGetEn:
          "Eligibility is automatic for new immigrants. Contact the Ministry of Immigration for specific benefit details. Call *3721.",
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
        sourceUrl:
          "https://www.hachvana.mod.gov.il/Soldiers/Pages/default.aspx",
        howToGetHe:
          "פנו למרכזי התעסוקה של משרד הקליטה או לעמותות כמו כנפיים. ניתן לתאם פגישת ייעוץ בטלפון *3721.",
        howToGetEn:
          "Contact Ministry of Immigration employment centers or organizations like Knafayim. Schedule a counseling session at *3721.",
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
        sourceUrl:
          "https://www.hachvana.mod.gov.il/Soldiers/Pages/default.aspx",
        howToGetHe:
          "פנו למשרד הקליטה עם אישור קבלה למוסד לימודים. ניתן לממש גם מתוך הפיקדון האישי.",
        howToGetEn:
          "Contact the Ministry of Immigration with your acceptance letter. Funding can also come from your personal deposit.",
      },
      {
        id: "knafayim",
        titleHe: "תוכנית כנפיים",
        titleEn: "Knafayim Program",
        frequency: "one_time",
        frequencyHe: "תוכנית מלגות",
        conditionsHe:
          "מלגות ותמיכה כלכלית לחיילים בודדים משוחררים",
        conditionsEn:
          "Scholarships and financial support for discharged lone soldiers",
        sourceHe: "עמותת כנפיים",
        sourceEn: "Knafayim Foundation",
        sourceUrl: "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA%D7%A0%D7%90%D7%99-%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%91%D7%A6%D7%94%22%D7%9C/%D7%AA-%D7%A9/%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%94%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%91%D7%A1%D7%93%D7%99%D7%A8/",
        howToGetHe:
          "הגישו בקשה דרך אתר עמותת כנפיים. המלגות מחולקות בתחילת שנת הלימודים.",
        howToGetEn:
          "Apply through the Knafayim Foundation website. Scholarships are awarded at the beginning of the academic year.",
      },
    ],
  },
  {
    id: "reserves",
    translationKey: "reserves",
    icon: Shield,
    rights: [
      {
        id: "reserve_accommodation",
        titleHe: "מגורים בזמן מילואים",
        titleEn: "Accommodation During Reserves",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "מגורים מסובסדים בזמן שירות מילואים",
        conditionsEn: "Subsidized accommodation during reserve duty",
        sourceHe: 'צה"ל',
        sourceEn: "IDF",
        sourceUrl:
          "https://www.btl.gov.il/benefits/Reserve_Service/Pages/default.aspx",
        howToGetHe:
          'פנו למפקד היחידה או למדור כוח אדם עם צו מילואים. המגורים מסופקים דרך צה"ל.',
        howToGetEn:
          "Contact your unit commander or Personnel Division with your reserve duty order. Accommodation is provided through the IDF.",
      },
      {
        id: "reserve_expenses",
        titleHe: "החזר הוצאות",
        titleEn: "Expense Reimbursement",
        frequency: "one_time",
        frequencyHe: "בהתאם להוצאות",
        conditionsHe:
          "החזר הוצאות שכירות ומחיה בזמן מילואים",
        conditionsEn:
          "Reimbursement for rent and living expenses during reserves",
        sourceHe: "משרד הביטחון",
        sourceEn: "Ministry of Defense",
        sourceUrl:
          "https://www.btl.gov.il/benefits/Reserve_Service/Pages/TagmulZacay.aspx",
        howToGetHe:
          "הגישו בקשה להחזר הוצאות דרך אתר משרד הביטחון — אגף שיקום. יש לצרף קבלות ואישורי תשלום.",
        howToGetEn:
          "Submit expense reimbursement request through the Ministry of Defense website — Rehabilitation Division. Attach receipts and payment confirmations.",
      },
      {
        id: "reserve_mental_health",
        titleHe: "בריאות הנפש",
        titleEn: "Mental Health Support",
        frequency: "one_time",
        frequencyHe: "חינם",
        conditionsHe: "תמיכה נפשית ומקצועית למשרתי מילואים",
        conditionsEn: "Professional mental health support for reservists",
        sourceHe: 'צה"ל / משרד הבריאות',
        sourceEn: "IDF / Ministry of Health",
        sourceUrl: "https://www.btl.gov.il/benefits/Reserve_Service/Pages/default.aspx",
        howToGetHe:
          "פנו לקו הסיוע הנפשי של צה\"ל או למרכזי בריאות הנפש של משרד הבריאות. הטיפול ניתן בחינם ובסודיות.",
        howToGetEn:
          "Contact the IDF mental health hotline or Ministry of Health mental health centers. Treatment is free and confidential.",
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
        sourceUrl: "https://www.btl.gov.il/benefits/Reserve_Service/Pages/default.aspx",
        howToGetHe:
          "פנו לאגף שיקום במשרד הביטחון או לעמותות תעסוקה למשרתי מילואים. ניתן לתאם פגישה טלפונית.",
        howToGetEn:
          "Contact the Ministry of Defense Rehabilitation Division or employment organizations for reservists. Phone appointments available.",
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
