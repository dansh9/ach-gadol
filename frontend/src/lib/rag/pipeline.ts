/**
 * RAG Pipeline: embed query → vector search → build prompt → Claude → parse response
 * Falls back to keyword-based KB search when API keys are not configured.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";
import { buildSystemPrompt, buildMessages } from "./prompts";
import { detectLanguage } from "./language";

export interface RagResult {
  reply: string;
  sources: string[];
  sourceMap: Record<string, { title: string; url?: string }>;
  confidence: number;
  language: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/* ===== Demo mode responses (keyword-based, no API keys needed) ===== */

const DEMO_RESPONSES: Record<string, Record<string, { reply: string; sources: string[] }>> = {
  rights: {
    he: {
      reply: "כחייל בודד, מגיעות לך זכויות רבות:\n\n• מענק חודשי מקצבת משרד הביטחון (~1,200 ₪)\n• סיוע בשכר דירה (~1,100 ₪/חודש)\n• דמי כלכלה\n• הנחות בארנונה ובחשמל\n• דיור בדירות אל\"ח או לינה בבית החייל\n• חופשה מיוחדת לביקור הורים בחו\"ל\n• מענק שחרור מוגדל (פיקדון ~25,000 ₪)\n• תוספת קרבית ללוחמים (~700 ₪/חודש)\n\nלפרטים מלאים על כל זכות, בקר בעמוד הזכויות שלנו או פנה למתנדב.",
      sources: ["Lone Soldier Rights Overview"],
    },
    en: {
      reply: "As a lone soldier, you're entitled to many benefits:\n\n• Monthly stipend from the Ministry of Defense (~1,200 NIS)\n• Rent assistance (~1,100 NIS/month)\n• Food allowance\n• Property tax and electricity discounts\n• Housing in IDF apartments or Beit HaChayal\n• Special leave to visit parents abroad\n• Enhanced release grant (Pikadon ~25,000 NIS)\n• Combat bonus for combat soldiers (~700 NIS/month)\n\nFor full details on each right, visit our Rights page or contact a volunteer.",
      sources: ["Lone Soldier Rights Overview"],
    },
    ru: {
      reply: "Как одинокий солдат, вы имеете право на многие льготы:\n\n• Ежемесячное пособие от Министерства обороны (~1,200 шекелей)\n• Помощь с арендой жилья (~1,100 шекелей/месяц)\n• Продовольственное пособие\n• Скидки на муниципальный налог и электричество\n• Жильё в квартирах ЦАХАЛ или в Бейт ХаХаяль\n• Специальный отпуск для посещения родителей за рубежом\n• Увеличенный грант при увольнении (Пикадон ~25,000 шекелей)\n\nДля полной информации посетите страницу прав или обратитесь к волонтёру.",
      sources: ["Lone Soldier Rights Overview"],
    },
    am: {
      reply: "እንደ ብቸኛ ወታደር፣ ለብዙ ጥቅማጥቅሞች መብት አለዎት:\n\n• ከመከላከያ ሚኒስቴር ወርሃዊ ድጎማ (~1,200 ₪)\n• የቤት ኪራይ ድጋፍ (~1,100 ₪/ወር)\n• የምግብ አበል\n• በንብረት ግብር እና በኤሌክትሪክ ቅናሽ\n• በጦር ኃይሎች አፓርታማዎች ወይም ቤት ሃሃያል ውስጥ መኖሪያ\n• ወላጆችን ለመጎብኘት ልዩ ፈቃድ\n• የተጨማሪ የመልቀቂያ ድጎማ (ፒካዶን ~25,000 ₪)\n\nለሙሉ ዝርዝር የመብቶች ገጻችንን ይጎብኙ ወይም ከበጎ ፈቃደኛ ጋር ይገናኙ።",
      sources: ["Lone Soldier Rights Overview"],
    },
    fr: {
      reply: "En tant que soldat seul, vous avez droit à de nombreux avantages :\n\n• Allocation mensuelle du Ministère de la Défense (~1 200 NIS)\n• Aide au loyer (~1 100 NIS/mois)\n• Allocation alimentaire\n• Réductions sur la taxe municipale et l'électricité\n• Logement dans des appartements de Tsahal ou au Beit HaChayal\n• Congé spécial pour visiter les parents à l'étranger\n• Prime de libération améliorée (Pikadon ~25 000 NIS)\n\nPour tous les détails, visitez notre page Droits ou contactez un bénévole.",
      sources: ["Lone Soldier Rights Overview"],
    },
    es: {
      reply: "Como soldado solitario, tienes derecho a muchos beneficios:\n\n• Estipendio mensual del Ministerio de Defensa (~1.200 NIS)\n• Asistencia de alquiler (~1.100 NIS/mes)\n• Asignación de alimentos\n• Descuentos en impuesto municipal y electricidad\n• Vivienda en apartamentos de las FDI o Beit HaChayal\n• Permiso especial para visitar a los padres en el extranjero\n• Bono de liberación mejorado (Pikadon ~25.000 NIS)\n\nPara más detalles, visita nuestra página de Derechos o contacta a un voluntario.",
      sources: ["Lone Soldier Rights Overview"],
    },
    ar: {
      reply: "كجندي وحيد، يحق لك الحصول على العديد من المزايا:\n\n• منحة شهرية من وزارة الدفاع (~1,200 شيكل)\n• مساعدة في الإيجار (~1,100 شيكل/شهر)\n• بدل طعام\n• خصومات على ضريبة الأملاك والكهرباء\n• سكن في شقق الجيش أو بيت هحيال\n• إجازة خاصة لزيارة الوالدين في الخارج\n• منحة تسريح محسنة (بيكادون ~25,000 شيكل)\n\nلمزيد من التفاصيل، قم بزيارة صفحة الحقوق أو تواصل مع متطوع.",
      sources: ["Lone Soldier Rights Overview"],
    },
  },
  rent: {
    he: {
      reply: "כדי להגיש בקשה לסיוע בשכר דירה:\n\n1. השג אישור חייל בודד מאגף כוח אדם של צה\"ל\n2. הכן חוזה שכירות חתום\n3. צלם תעודת חייל\n4. הכן פרטי חשבון בנק להפקדה\n5. מלא את טופס הבקשה במשרד השיכון או באינטרנט\n\nזמן טיפול: 4-6 שבועות. הסכום החודשי כ-1,100 ₪ (משתנה לפי מיקום).\n\nניתן להגיש בקשה בכל שלב של השירות. לשאלות, פנה לקו החם של משרד השיכון או לקצין הרווחה ביחידה.",
      sources: ["How to Apply for Rent Assistance"],
    },
    en: {
      reply: "To apply for rent assistance:\n\n1. Get a lone soldier confirmation letter from the IDF Personnel Directorate\n2. Prepare a signed rental agreement\n3. Copy of your military ID (Teudat Chayal)\n4. Bank account details for direct deposit\n5. Complete the application at Misrad HaShikun offices or online\n\nProcessing time: 4-6 weeks. Monthly amount is ~1,100 NIS (varies by location).\n\nYou can apply at any point during service. For questions, contact the Misrad HaShikun hotline or your unit welfare officer.",
      sources: ["How to Apply for Rent Assistance"],
    },
    ru: {
      reply: "Для подачи заявки на помощь с арендой:\n\n1. Получите подтверждение статуса одинокого солдата\n2. Подготовьте подписанный договор аренды\n3. Копию военного удостоверения\n4. Реквизиты банковского счёта\n5. Заполните заявку в Мисрад ХаШикун или онлайн\n\nСрок обработки: 4-6 недель. Ежемесячная сумма ~1,100 шекелей.\n\nПодать заявку можно в любой момент службы. Обратитесь к офицеру по социальным вопросам в вашем подразделении.",
      sources: ["How to Apply for Rent Assistance"],
    },
    am: { reply: "የቤት ኪራይ ድጋፍ ለማመልከት:\n\n1. ከጦር ኃይሎች የብቸኛ ወታደር ማረጋገጫ ያግኙ\n2. የተፈረመ የኪራይ ውል ያዘጋጁ\n3. የወታደራዊ መታወቂያ ቅጂ\n4. የባንክ ሂሳብ ዝርዝሮች\n5. በሚስራድ ሃሺኩን ቢሮ ወይም በኦንላይን ማመልከቻውን ይሙሉ\n\nየሂደት ጊዜ: 4-6 ሳምንታት። ወርሃዊ መጠን ~1,100 ₪።\n\nበአገልግሎት ጊዜ በማንኛውም ጊዜ ማመልከት ይችላሉ።", sources: ["How to Apply for Rent Assistance"] },
    fr: { reply: "Pour demander l'aide au loyer :\n\n1. Obtenez une lettre de confirmation de soldat seul\n2. Préparez un contrat de location signé\n3. Copie de la carte militaire\n4. Coordonnées bancaires\n5. Remplissez le formulaire au Misrad HaShikun ou en ligne\n\nDélai : 4-6 semaines. Montant mensuel ~1 100 NIS.\n\nVous pouvez postuler à tout moment pendant votre service.", sources: ["How to Apply for Rent Assistance"] },
    es: { reply: "Para solicitar asistencia de alquiler:\n\n1. Obtén una carta de confirmación de soldado solitario\n2. Prepara un contrato de alquiler firmado\n3. Copia de tu identificación militar\n4. Datos bancarios\n5. Completa el formulario en Misrad HaShikun o en línea\n\nTiempo de procesamiento: 4-6 semanas. Monto mensual ~1,100 NIS.\n\nPuedes solicitar en cualquier momento durante tu servicio.", sources: ["How to Apply for Rent Assistance"] },
    ar: { reply: "للتقدم بطلب للحصول على مساعدة الإيجار:\n\n1. احصل على خطاب تأكيد الجندي الوحيد\n2. جهز عقد إيجار موقع\n3. نسخة من الهوية العسكرية\n4. تفاصيل الحساب البنكي\n5. أكمل الطلب في مسراد هشيكون أو عبر الإنترنت\n\nمدة المعالجة: 4-6 أسابيع. المبلغ الشهري ~1,100 شيكل.", sources: ["How to Apply for Rent Assistance"] },
  },
  release: {
    he: {
      reply: "תהליך השחרור והפיקדון המוגדל:\n\n1. ודא שסטטוס החייל הבודד מעודכן במערכת לפחות 3 חודשים לפני השחרור\n2. השתתף בסמינר הכנה לשחרור של אח גדול\n3. פתח חשבון בנק אם אין לך\n4. הגש בקשה לפיקדון דרך היחידה או דרך אתר משרד הביטחון\n5. המתן 60-90 ימים לעיבוד לאחר תאריך השחרור\n\nהפיקדון המוגדל לחיילים בודדים: כ-25,000 ₪ בנוסף לפיקדון הרגיל.\n\nלאחר שחרור תקבל גם גישה להטבות נוספות: סיוע בשכר לימוד, הכשרה מקצועית, ועוד.",
      sources: ["Release Process and Enhanced Pikadon"],
    },
    en: {
      reply: "Release process and enhanced Pikadon:\n\n1. Confirm your lone soldier status is up to date at least 3 months before release\n2. Attend the release preparation seminar by Ach Gadol\n3. Open a bank account if you don't have one\n4. Submit the Pikadon application through your unit or the Ministry of Defense portal\n5. Allow 60-90 days for processing after release\n\nEnhanced grant for lone soldiers: ~25,000 NIS on top of the regular Pikadon.\n\nAfter release you also get: higher education tuition assistance, vocational training subsidies, and more.",
      sources: ["Release Process and Enhanced Pikadon"],
    },
    ru: { reply: "Процесс увольнения и увеличенный Пикадон:\n\n1. Убедитесь, что ваш статус одинокого солдата обновлён за 3 месяца до увольнения\n2. Посетите семинар подготовки к увольнению от Ах Гадоль\n3. Откройте банковский счёт\n4. Подайте заявку на Пикадон через подразделение или портал Минобороны\n5. Ожидайте 60-90 дней обработки\n\nУвеличенный грант: ~25,000 шекелей сверх обычного Пикадона.", sources: ["Release Process and Enhanced Pikadon"] },
    am: { reply: "የመልቀቂያ ሂደት እና የተጨማሪ ፒካዶን:\n\n1. ከመልቀቅ 3 ወራት በፊት የብቸኛ ወታደር ሁኔታዎ የተዘመነ መሆኑን ያረጋግጡ\n2. በአኽ ጋዶል የመልቀቂያ ዝግጅት ሴሚናር ይሳተፉ\n3. የባንክ ሂሳብ ይክፈቱ\n4. የፒካዶን ማመልከቻ ያስገቡ\n5. ከመልቀቅ በኋላ 60-90 ቀናት ይጠብቁ\n\nየተጨማሪ ድጎማ: ~25,000 ₪።", sources: ["Release Process and Enhanced Pikadon"] },
    fr: { reply: "Processus de libération et Pikadon amélioré :\n\n1. Confirmez votre statut de soldat seul 3 mois avant la libération\n2. Participez au séminaire de préparation d'Ach Gadol\n3. Ouvrez un compte bancaire\n4. Soumettez la demande de Pikadon via votre unité ou le portail du Ministère\n5. Attendez 60-90 jours de traitement\n\nPrime améliorée : ~25 000 NIS en plus du Pikadon standard.", sources: ["Release Process and Enhanced Pikadon"] },
    es: { reply: "Proceso de liberación y Pikadon mejorado:\n\n1. Confirma tu estado de soldado solitario 3 meses antes de la liberación\n2. Asiste al seminario de preparación de Ach Gadol\n3. Abre una cuenta bancaria\n4. Envía la solicitud de Pikadon a través de tu unidad o el portal del Ministerio\n5. Espera 60-90 días de procesamiento\n\nBono mejorado: ~25,000 NIS adicionales al Pikadon estándar.", sources: ["Release Process and Enhanced Pikadon"] },
    ar: { reply: "عملية التسريح وبيكادون المحسن:\n\n1. تأكد من تحديث حالة الجندي الوحيد قبل 3 أشهر من التسريح\n2. احضر ندوة الإعداد للتسريح من أخ جادول\n3. افتح حساب بنكي\n4. قدم طلب البيكادون عبر وحدتك أو بوابة وزارة الدفاع\n5. انتظر 60-90 يومًا للمعالجة\n\nالمنحة المحسنة: ~25,000 شيكل إضافية.", sources: ["Release Process and Enhanced Pikadon"] },
  },
  volunteer: {
    he: { reply: "בהחלט! תוכל ליצור קשר עם מתנדב של אח גדול בכמה דרכים:\n\n• דרך עמוד המשאבים שלנו באתר\n• וואטסאפ: 058-785-0457\n• מייל: info@achgadol.org\n\nהמתנדבים שלנו זמינים לעזור בכל נושא — מזכויות ומענקים, דרך טפסים ובירוקרטיה, ועד ליווי אישי.", sources: [] },
    en: { reply: "Absolutely! You can contact an Ach Gadol volunteer in several ways:\n\n• Through our Resources page on the website\n• WhatsApp: +972-58-785-0457\n• Email: info@achgadol.org\n\nOur volunteers are available to help with everything — from rights and grants, to forms and bureaucracy, to personal support.", sources: [] },
    ru: { reply: "Конечно! Вы можете связаться с волонтёром Ах Гадоль:\n\n• Через страницу ресурсов на сайте\n• WhatsApp: +972-58-785-0457\n• Email: info@achgadol.org\n\nНаши волонтёры помогут с любым вопросом.", sources: [] },
    am: { reply: "በእርግጥ! ከአኽ ጋዶል በጎ ፈቃደኛ ጋር መገናኘት ይችላሉ:\n\n• በድረ-ገጻችን የመረጃ ገጽ በኩል\n• WhatsApp: +972-58-785-0457\n• ኢሜይል: info@achgadol.org", sources: [] },
    fr: { reply: "Bien sûr ! Vous pouvez contacter un bénévole d'Ach Gadol :\n\n• Via notre page Ressources\n• WhatsApp : +972-58-785-0457\n• Email : info@achgadol.org\n\nNos bénévoles sont disponibles pour toute question.", sources: [] },
    es: { reply: "¡Por supuesto! Puedes contactar a un voluntario de Ach Gadol:\n\n• A través de nuestra página de Recursos\n• WhatsApp: +972-58-785-0457\n• Email: info@achgadol.org\n\nNuestros voluntarios están disponibles para ayudar con todo.", sources: [] },
    ar: { reply: "بالطبع! يمكنك التواصل مع متطوع أخ جادول:\n\n• عبر صفحة الموارد على موقعنا\n• WhatsApp: +972-58-785-0457\n• بريد: info@achgadol.org\n\nمتطوعونا متاحون للمساعدة في أي موضوع.", sources: [] },
  },
  forms: {
    he: {
      reply: "הטפסים העיקריים שתצטרך כחייל בודד:\n\n• אישור חייל בודד — מאגף כוח אדם\n• טופס בקשה לסיוע בשכר דירה — משרד השיכון\n• טופס פיקדון — משרד הביטחון (לקראת שחרור)\n• טופס בקשה למענק חודשי — משרד הביטחון\n• טופס הנחה בארנונה — הרשות המקומית\n\nהמתנדבים שלנו יכולים לעזור לך למלא כל טופס. פנה אלינו דרך עמוד המשאבים.",
      sources: ["How to Apply for Rent Assistance"],
    },
    en: {
      reply: "Key forms you'll need as a lone soldier:\n\n• Lone Soldier Confirmation (Ishur Chayal Boded) — from IDF Personnel\n• Rent Assistance Application — Ministry of Housing\n• Pikadon Application — Ministry of Defense (before release)\n• Monthly Stipend Application — Ministry of Defense\n• Property Tax Discount Form — Local municipality\n\nOur volunteers can help you fill out any form. Reach out through our Resources page.",
      sources: ["How to Apply for Rent Assistance"],
    },
    ru: { reply: "Основные формы для одинокого солдата:\n\n• Подтверждение статуса одинокого солдата — от кадрового управления ЦАХАЛ\n• Заявка на помощь с арендой — Министерство жилья\n• Заявка на Пикадон — Министерство обороны\n• Заявка на ежемесячное пособие — Министерство обороны\n• Форма скидки на муниципальный налог — местная администрация\n\nНаши волонтёры помогут заполнить любую форму.", sources: ["How to Apply for Rent Assistance"] },
    am: { reply: "እንደ ብቸኛ ወታደር የሚያስፈልጉዎት ዋና ቅጾች:\n\n• የብቸኛ ወታደር ማረጋገጫ\n• የኪራይ ድጋፍ ማመልከቻ\n• የፒካዶን ማመልከቻ\n• ወርሃዊ ድጎማ ማመልከቻ\n• የንብረት ግብር ቅናሽ ቅጽ\n\nበጎ ፈቃደኞቻችን ማንኛውንም ቅጽ ለመሙላት ይረዱዎታል።", sources: ["How to Apply for Rent Assistance"] },
    fr: { reply: "Formulaires clés pour un soldat seul :\n\n• Confirmation de soldat seul — Direction du personnel de Tsahal\n• Demande d'aide au loyer — Ministère du Logement\n• Demande de Pikadon — Ministère de la Défense\n• Demande d'allocation mensuelle — Ministère de la Défense\n• Formulaire de réduction de taxe municipale — Mairie\n\nNos bénévoles peuvent vous aider à remplir tout formulaire.", sources: ["How to Apply for Rent Assistance"] },
    es: { reply: "Formularios clave como soldado solitario:\n\n• Confirmación de soldado solitario — Personal de las FDI\n• Solicitud de asistencia de alquiler — Ministerio de Vivienda\n• Solicitud de Pikadon — Ministerio de Defensa\n• Solicitud de estipendio mensual — Ministerio de Defensa\n• Formulario de descuento de impuesto municipal — Municipalidad\n\nNuestros voluntarios pueden ayudarte con cualquier formulario.", sources: ["How to Apply for Rent Assistance"] },
    ar: { reply: "النماذج الرئيسية كجندي وحيد:\n\n• تأكيد الجندي الوحيد — من قسم شؤون الأفراد\n• طلب مساعدة الإيجار — وزارة الإسكان\n• طلب البيكادون — وزارة الدفاع\n• طلب المنحة الشهرية — وزارة الدفاع\n• نموذج خصم ضريبة الأملاك — البلدية\n\nمتطوعونا يمكنهم مساعدتك في ملء أي نموذج.", sources: ["How to Apply for Rent Assistance"] },
  },
  distress: {
    he: { reply: "אני שומע אותך, ואני רוצה שתדע שהרגשות שלך מובנים לחלוטין. להיות חייל בודד זה לא קל.\n\n**תמיכה מיידית:**\n• קו חירום ער\"ן: 1201 (24/7, חינם, חסוי)\n• מתנדבי אח גדול בוואטסאפ: 058-785-0457\n• קצין הרווחה ביחידה שלך\n\n**זכור:**\n• אתה לא לבד — יש אנשים שרוצים לעזור\n• הכוח שלך נמדד גם בבקשת עזרה\n• הרגשות האלה זמניים, גם אם עכשיו קשה\n\nאני כאן אם תרצה לדבר על זכויות או כל דבר אחר, אבל אם אתה מרגיש שאתה צריך מישהו אמיתי — פנה עכשיו.", sources: [] },
    en: { reply: "I hear you, and I want you to know that your feelings are completely understandable. Being a lone soldier is incredibly challenging.\n\n**Immediate Support:**\n• Eran Crisis Hotline: 1201 (24/7, free, confidential)\n• Ach Gadol volunteers WhatsApp: +972-58-785-0457\n• Your unit's welfare officer\n\n**Remember:**\n• You are NOT alone — there are people who care and want to help\n• Asking for help is a sign of strength, not weakness\n• These feelings are temporary, even when they feel overwhelming\n\nI'm here if you want to talk about your rights or anything else, but if you need a real person right now — please reach out.", sources: [] },
    ru: { reply: "Я вас слышу. Быть одиноким солдатом невероятно трудно, и ваши чувства полностью понятны.\n\n**Немедленная поддержка:**\n• Кризисная линия Эран: 1201 (24/7, бесплатно)\n• Волонтёры Ах Гадоль WhatsApp: +972-58-785-0457\n• Офицер социальной службы вашего подразделения\n\nВы не одиноки. Обращение за помощью — это признак силы.", sources: [] },
    am: { reply: "እሰማዎታለሁ። ብቸኛ ወታደር መሆን እጅግ ፈታኝ ነው።\n\n**ፈጣን ድጋፍ:**\n• ኤራን ቀውስ መስመር: 1201 (24/7, ነፃ)\n• አኽ ጋዶል በጎ ፈቃደኞች WhatsApp: +972-58-785-0457\n\nብቻዎን አይደሉም — ሰዎች ሊረዱዎት ይፈልጋሉ።", sources: [] },
    fr: { reply: "Je vous entends. Être un soldat seul est incroyablement difficile.\n\n**Soutien immédiat :**\n• Ligne de crise Eran : 1201 (24/7, gratuit)\n• Bénévoles Ach Gadol WhatsApp : +972-58-785-0457\n• L'officier social de votre unité\n\nVous n'êtes pas seul(e). Demander de l'aide est un signe de force.", sources: [] },
    es: { reply: "Te escucho. Ser un soldado solitario es increíblemente difícil.\n\n**Apoyo inmediato:**\n• Línea de crisis Eran: 1201 (24/7, gratis)\n• Voluntarios Ach Gadol WhatsApp: +972-58-785-0457\n• El oficial de bienestar de tu unidad\n\nNo estás solo/a. Pedir ayuda es una señal de fortaleza.", sources: [] },
    ar: { reply: "أسمعك. كونك جنديًا وحيدًا أمر صعب للغاية.\n\n**دعم فوري:**\n• خط أزمات إيران: 1201 (24/7، مجاني)\n• متطوعو أخ جادول WhatsApp: +972-58-785-0457\n• مسؤول الرعاية في وحدتك\n\nأنت لست وحدك. طلب المساعدة علامة قوة.", sources: [] },
  },
  leave: {
    he: { reply: "כחייל בודד, מגיעות לך חופשות מיוחדות:\n\n• **חופשה לביקור הורים בחו\"ל** — עד 28 ימים בשנה\n• **מימון טיסות** — סיוע במימון כרטיס טיסה (פעם בשנה)\n• **חופשה לביקור הורים בארץ** — ימים נוספים כשהורים מבקרים\n• **יום חופשה לסידורים** — יום אחד בחודש לסידורים אישיים\n• **חופשה מיוחדת** — ימי חופשה נוספים לחיילים בודדים\n\nלמידע מלא: https://www.kolzchut.org.il/he/חופשה_לחיילים_בודדים_לצורך_ביקור_הוריהם_בחו״ל\n\nפנה לקצין הרווחה ביחידה שלך להגשת בקשה.", sources: ["Lone Soldier Rights Overview"] },
    en: { reply: "As a lone soldier, you're entitled to special leave:\n\n• **Overseas Leave**: Up to 28 days/year to visit parents abroad\n• **Flight Funding**: Partial/full flight cost coverage (once per year)\n• **Family Visit Leave**: Extra days when parents visit Israel\n• **Personal Errands Day**: 1 day/month for personal errands\n• **Special Leave**: Additional leave days for lone soldiers\n\nFor details: https://www.kolzchut.org.il/he/חופשה_לחיילים_בודדים_לצורך_ביקור_הוריהם_בחו״ל\n\nContact your unit's welfare officer to apply.", sources: ["Lone Soldier Rights Overview"] },
    ru: { reply: "Как одинокий солдат, вы имеете право на специальные отпуска:\n\n• **Отпуск за рубеж**: до 28 дней в год для посещения родителей\n• **Оплата перелёта**: частичная/полная компенсация раз в год\n• **Отпуск при визите родителей**: дополнительные дни\n• **День для личных дел**: 1 день в месяц\n• **Специальный отпуск**: дополнительные дни для одиноких солдат\n\nОбратитесь к офицеру по социальным вопросам.", sources: ["Lone Soldier Rights Overview"] },
    am: { reply: "እንደ ብቸኛ ወታደር ልዩ ፈቃዶች አሉዎት:\n\n• **የውጭ ፈቃድ**: ወላጆችን ለመጎብኘት እስከ 28 ቀናት/ዓመት\n• **የበረራ ድጋፍ**: በዓመት አንድ ጊዜ\n• **ለግል ጉዳዮች ቀን**: በወር 1 ቀን\n\nለማመልከት ከማህበራዊ ጉዳይ መኮንን ጋር ያነጋግሩ።", sources: ["Lone Soldier Rights Overview"] },
    fr: { reply: "En tant que soldat seul, vous avez droit à des congés spéciaux :\n\n• **Congé à l'étranger** : jusqu'à 28 jours/an\n• **Financement de vol** : prise en charge partielle/totale une fois par an\n• **Jour pour démarches** : 1 jour/mois\n• **Congé spécial** : jours supplémentaires\n\nContactez l'officier social de votre unité.", sources: ["Lone Soldier Rights Overview"] },
    es: { reply: "Como soldado solitario, tienes derecho a permisos especiales:\n\n• **Permiso al extranjero**: hasta 28 días/año\n• **Financiación de vuelo**: cobertura parcial/total una vez al año\n• **Día para trámites**: 1 día/mes\n• **Permiso especial**: días adicionales\n\nContacta al oficial de bienestar de tu unidad.", sources: ["Lone Soldier Rights Overview"] },
    ar: { reply: "كجندي وحيد، يحق لك إجازات خاصة:\n\n• **إجازة خارجية**: حتى 28 يومًا/سنة لزيارة الوالدين\n• **تمويل الطيران**: تغطية جزئية/كاملة مرة في السنة\n• **يوم للشؤون الشخصية**: يوم واحد/شهر\n• **إجازة خاصة**: أيام إضافية\n\nتواصل مع مسؤول الرعاية في وحدتك.", sources: ["Lone Soldier Rights Overview"] },
  },
  stipend: {
    he: { reply: "כחייל בודד, מגיעים לך מענקים חודשיים:\n\n• **מענק חודשי ממשרד הביטחון**: ~1,200 ₪/חודש\n• **דמי כלכלה**: ~800 ₪/חודש\n• **תוספת קרבית (ללוחמים)**: ~700 ₪/חודש\n• **סיוע בשכר דירה**: ~1,100 ₪/חודש\n• **מענק משרד הקליטה (לעולים)**: ~5,300 ₪ חד-פעמי\n\nהסכומים הם משוערים ועשויים להשתנות. פנה לקצין הרווחה ביחידה לפרטים מדויקים.\n\nלמידע: https://www.kolzchut.org.il/he/מענק_חודשי_לחיילים_בודדים", sources: ["Lone Soldier Rights Overview"] },
    en: { reply: "As a lone soldier, you're entitled to monthly financial support:\n\n• **Monthly Stipend (Ministry of Defense)**: ~1,200 NIS/month\n• **Food Allowance**: ~800 NIS/month\n• **Combat Bonus (combat soldiers)**: ~700 NIS/month\n• **Rent Assistance**: ~1,100 NIS/month\n• **Immigration Grant (for Olim)**: ~5,300 NIS one-time from Misrad HaKlita\n\nAmounts are approximate and may change. Contact your unit's welfare officer for exact details.\n\nMore info: https://www.kolzchut.org.il/he/מענק_חודשי_לחיילים_בודדים", sources: ["Lone Soldier Rights Overview"] },
    ru: { reply: "Как одинокий солдат, вы получаете ежемесячную финансовую поддержку:\n\n• **Ежемесячное пособие**: ~1,200 ₪/месяц\n• **Продовольственное пособие**: ~800 ₪/месяц\n• **Боевая надбавка**: ~700 ₪/месяц\n• **Помощь с арендой**: ~1,100 ₪/месяц\n• **Грант для новых репатриантов**: ~5,300 ₪ единоразово\n\nСуммы приблизительные. Обратитесь к офицеру подразделения.", sources: ["Lone Soldier Rights Overview"] },
    am: { reply: "እንደ ብቸኛ ወታደር ወርሃዊ የገንዘብ ድጋፍ ይገባዎታል:\n\n• **ወርሃዊ ድጎማ**: ~1,200 ₪/ወር\n• **የምግብ አበል**: ~800 ₪/ወር\n• **የኪራይ ድጋፍ**: ~1,100 ₪/ወር\n\nለትክክለኛ ዝርዝር ከማህበራዊ ጉዳይ መኮንን ጋር ያነጋግሩ።", sources: ["Lone Soldier Rights Overview"] },
    fr: { reply: "En tant que soldat seul, vous recevez un soutien financier mensuel :\n\n• **Allocation mensuelle** : ~1 200 NIS/mois\n• **Allocation alimentaire** : ~800 NIS/mois\n• **Prime de combat** : ~700 NIS/mois\n• **Aide au loyer** : ~1 100 NIS/mois\n• **Prime d'immigration (Olim)** : ~5 300 NIS\n\nMontants approximatifs. Contactez votre officier social.", sources: ["Lone Soldier Rights Overview"] },
    es: { reply: "Como soldado solitario, recibes apoyo financiero mensual:\n\n• **Estipendio mensual**: ~1,200 NIS/mes\n• **Asignación alimentaria**: ~800 NIS/mes\n• **Bono de combate**: ~700 NIS/mes\n• **Asistencia de alquiler**: ~1,100 NIS/mes\n• **Beca de inmigración (Olim)**: ~5,300 NIS\n\nMontos aproximados. Contacta al oficial de bienestar.", sources: ["Lone Soldier Rights Overview"] },
    ar: { reply: "كجندي وحيد، يحق لك دعم مالي شهري:\n\n• **منحة شهرية**: ~1,200 شيكل/شهر\n• **بدل طعام**: ~800 شيكل/شهر\n• **مكافأة قتالية**: ~700 شيكل/شهر\n• **مساعدة إيجار**: ~1,100 شيكل/شهر\n\nالمبالغ تقريبية. تواصل مع مسؤول الرعاية.", sources: ["Lone Soldier Rights Overview"] },
  },
  eligibility: {
    he: { reply: "קטגוריות חיילים בודדים:\n\n1. **חייל בודד קלאסי** — עולה חדש ללא משפחה בישראל\n2. **בן ליוצאים** — הוריו עזבו את ישראל\n3. **בן שליחים** — הוריו שליחים בחו\"ל\n4. **חוסר קשר משפחתי** — מנותק מהמשפחה\n5. **יתום**\n6. **בוגר אומנה/מוסד** — חריג רעננה\n\nלכל קטגוריה יש תנאים וזכויות שונים. פנה לאגף כוח אדם בצה\"ל לאישור הסטטוס שלך.\n\nלמידע: https://www.kolzchut.org.il/he/חיילים_בודדים", sources: ["Lone Soldier Rights Overview"] },
    en: { reply: "Lone soldier categories:\n\n1. **Classic Lone Soldier** — New immigrant (Oleh) without family in Israel\n2. **Child of Emigrants** — Parents left Israel\n3. **Child of Envoys** — Parents are Israeli representatives abroad\n4. **No Family Support** — Estranged from family\n5. **Orphan**\n6. **Foster Care Graduate** — From foster family or institutional care\n\nEach category has different conditions and benefits. Contact IDF Personnel Directorate to confirm your status.\n\nMore info: https://www.kolzchut.org.il/he/חיילים_בודדים", sources: ["Lone Soldier Rights Overview"] },
    ru: { reply: "Категории одиноких солдат:\n\n1. **Классический** — новый репатриант без семьи в Израиле\n2. **Ребёнок эмигрантов** — родители уехали из Израиля\n3. **Ребёнок посланников** — родители за рубежом\n4. **Без семейной поддержки** — разрыв с семьёй\n5. **Сирота**\n6. **Выпускник приёмной семьи**\n\nОбратитесь в кадровое управление ЦАХАЛ для подтверждения статуса.", sources: ["Lone Soldier Rights Overview"] },
    am: { reply: "የብቸኛ ወታደር ምድቦች:\n\n1. **ክላሲክ** — ያለ ቤተሰብ አዲስ ስደተኛ\n2. **የወጡ ወላጆች ልጅ**\n3. **የልዑካን ልጅ**\n4. **ያለ ቤተሰብ ድጋፍ**\n5. **ወላጅ አልባ**\n6. **የአሳዳጊ ቤተሰብ ተመራቂ**", sources: ["Lone Soldier Rights Overview"] },
    fr: { reply: "Catégories de soldats seuls :\n\n1. **Classique** — Nouvel immigrant sans famille en Israël\n2. **Enfant d'émigrants** — Parents ont quitté Israël\n3. **Enfant d'émissaires**\n4. **Sans soutien familial**\n5. **Orphelin**\n6. **Issu de famille d'accueil**\n\nContactez la Direction du personnel de Tsahal.", sources: ["Lone Soldier Rights Overview"] },
    es: { reply: "Categorías de soldados solitarios:\n\n1. **Clásico** — Nuevo inmigrante sin familia en Israel\n2. **Hijo de emigrantes**\n3. **Hijo de enviados**\n4. **Sin apoyo familiar**\n5. **Huérfano**\n6. **Egresado de acogida**\n\nContacta la Dirección de Personal de las FDI.", sources: ["Lone Soldier Rights Overview"] },
    ar: { reply: "فئات الجنود الوحيدين:\n\n1. **كلاسيكي** — مهاجر جديد بدون عائلة في إسرائيل\n2. **ابن مهاجرين**\n3. **ابن مبعوثين**\n4. **بدون دعم عائلي**\n5. **يتيم**\n6. **خريج رعاية**\n\nتواصل مع قسم شؤون الأفراد في الجيش.", sources: ["Lone Soldier Rights Overview"] },
  },
};

const DEFAULT_RESPONSES: Record<string, { reply: string }> = {
  he: { reply: "תודה על השאלה! אני הצ'אטבוט של אח גדול.\n\nאני יכול לעזור לך בנושאים הבאים:\n• זכויות חיילים בודדים (מענקים, דיור, חופשות)\n• עזרה עם טפסים ובירוקרטיה\n• תהליך השחרור והפיקדון\n• חיבור למתנדב אישי\n\nנסה לשאול שאלה ספציפית, למשל: \"מה הזכויות שמגיעות לי?\" או \"איך מגישים בקשה לסיוע בשכר דירה?\"\n\nלחלופין, פנה למתנדב שלנו בוואטסאפ 058-785-0457." },
  en: { reply: "Thanks for your question! I'm the Ach Gadol chatbot.\n\nI can help you with:\n• Lone soldier rights (grants, housing, leave)\n• Help with forms and bureaucracy\n• Release process and Pikadon\n• Connecting you with a personal volunteer\n\nTry asking something specific, like: \"What rights am I entitled to?\" or \"How do I apply for rent assistance?\"\n\nOr contact our volunteer on WhatsApp: +972-58-785-0457." },
  ru: { reply: "Спасибо за вопрос! Я чат-бот Ах Гадоль.\n\nЯ могу помочь с:\n• Правами одиноких солдат\n• Формами и бюрократией\n• Процессом увольнения и Пикадоном\n• Связью с волонтёром\n\nПопробуйте задать конкретный вопрос или напишите в WhatsApp: +972-58-785-0457." },
  am: { reply: "ለጥያቄዎ እናመሰግናለን! እኔ የአኽ ጋዶል ቻትቦት ነኝ።\n\nልረዳዎት የምችለው:\n• የብቸኛ ወታደር መብቶች\n• ቅጾች እና ቢሮክራሲ\n• የመልቀቂያ ሂደት\n• ከበጎ ፈቃደኛ ጋር ግንኙነት\n\nWhatsApp: +972-58-785-0457" },
  fr: { reply: "Merci pour votre question ! Je suis le chatbot d'Ach Gadol.\n\nJe peux vous aider avec :\n• Les droits des soldats seuls\n• Les formulaires et la bureaucratie\n• Le processus de libération et le Pikadon\n• La mise en contact avec un bénévole\n\nEssayez de poser une question spécifique ou contactez-nous sur WhatsApp : +972-58-785-0457." },
  es: { reply: "¡Gracias por tu pregunta! Soy el chatbot de Ach Gadol.\n\nPuedo ayudarte con:\n• Derechos de soldados solitarios\n• Formularios y burocracia\n• Proceso de liberación y Pikadon\n• Conexión con un voluntario\n\nIntenta hacer una pregunta específica o contáctanos por WhatsApp: +972-58-785-0457." },
  ar: { reply: "شكرًا على سؤالك! أنا روبوت الدردشة الخاص بأخ جادول.\n\nيمكنني مساعدتك في:\n• حقوق الجنود الوحيدين\n• النماذج والبيروقراطية\n• عملية التسريح والبيكادون\n• التواصل مع متطوع\n\nحاول طرح سؤال محدد أو تواصل عبر WhatsApp: +972-58-785-0457." },
};

/**
 * Match a user message to a demo response topic using keyword matching.
 */
function matchDemoTopic(message: string): string | null {
  const lower = message.toLowerCase();

  // Distress/mental health — match first (high priority)
  if (/depress|alone|lonely|sad|help me|distress|crisis|בודד|עצוב|דיכאון|مكتئب|وحيد|déprimé|seul|deprimido|solo|депресси|одинок/.test(lower)) return "distress";
  // Rights/entitlements
  if (/rights|entitled|זכויות|מגיע|حقوق|droits|derechos|права|መብት/.test(lower)) return "rights";
  // Rent/housing
  if (/rent|דירה|שכירות|שכר דירה|housing|דיור|loyer|alquiler|аренд|ኪራይ|إيجار|سكن|beit hachayal|בית החייל|אל.ח/.test(lower)) return "rent";
  // Release/pikadon
  if (/release|שחרור|pikadon|פיקדון|libération|liberación|увольнен|пикадон|تسريح|بيكادون|መልቀቅ|discharge/.test(lower)) return "release";
  // Volunteer / talk to human
  if (/volunteer|מתנדב|bénévole|voluntario|волонтёр|በጎ ፈቃደኛ|متطوع|real person|human|talk to someone/.test(lower)) return "volunteer";
  // Forms
  if (/form|טופס|טפסים|formulaire|formulario|форм|ቅጽ|نموذج|document|מסמך/.test(lower)) return "forms";
  // Leave/vacation
  if (/leave|vacation|חופש|חופשה|flight|טיסה|visit|parents|הורים|congé|vacaciones|отпуск|إجازة/.test(lower)) return "leave";
  // Stipend/money
  if (/stipend|money|מענק|כסף|salary|pay|grant|כלכלה|منحة|مال|subvention|pago|пособие|деньги|ገንዘብ/.test(lower)) return "stipend";
  // Eligibility
  if (/eligible|eligib|category|categor|סוג|קטגוריה|lone soldier|חייל בודד|أهلية|éligib|elegib|категор/.test(lower)) return "eligibility";

  return null;
}

/**
 * Run demo mode: keyword-match → pre-written KB-based responses.
 * Used when ANTHROPIC_API_KEY is not configured.
 */
function runDemoMode(message: string, language: string, onToken?: (token: string) => void): RagResult {
  const topic = matchDemoTopic(message);
  const lang = language in DEFAULT_RESPONSES ? language : "en";

  if (topic && DEMO_RESPONSES[topic]) {
    const topicResponses = DEMO_RESPONSES[topic];
    const response = topicResponses[lang] || topicResponses.en;
    if (onToken) onToken(response.reply);
    return {
      reply: response.reply,
      sources: response.sources,
      sourceMap: {},
      confidence: 0.7,
      language,
    };
  }

  // Default response
  const defaultResp = DEFAULT_RESPONSES[lang] || DEFAULT_RESPONSES.en;
  if (onToken) onToken(defaultResp.reply);
  return {
    reply: defaultResp.reply,
    sources: [],
    sourceMap: {},
    confidence: 0.5,
    language,
  };
}

/* ===== KB Chunk Cache (avoids repeated Supabase fetches on warm instances) ===== */

interface CachedChunk {
  chunk_text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  document_title: string;
  source_url: string;
}

let _chunkCache: CachedChunk[] | null = null;
let _chunkCacheTime = 0;
const CHUNK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedKBChunks(): Promise<CachedChunk[]> {
  if (_chunkCache && Date.now() - _chunkCacheTime < CHUNK_CACHE_TTL) {
    return _chunkCache;
  }

  const supabase = createAdminClient();

  // Fetch chunks and document titles in parallel
  const [chunksResult, docsResult] = await Promise.all([
    supabase
      .from("kb_chunks")
      .select("chunk_text, kb_document_id, embedding, metadata")
      .not("embedding", "is", null),
    supabase.from("kb_documents").select("id, title, source_url"),
  ]);

  if (!chunksResult.data || chunksResult.data.length === 0) return [];

  const docMap: Record<string, { title: string; source_url: string }> = {};
  if (docsResult.data) {
    docsResult.data.forEach((d: { id: string; title: string; source_url?: string }) => {
      docMap[d.id] = { title: d.title, source_url: d.source_url || "" };
    });
  }

  // Parse string embeddings once and cache the result (with try-catch for safety)
  _chunkCache = chunksResult.data
    .map(
      (chunk: {
        chunk_text: string;
        kb_document_id: string;
        embedding: string | number[];
        metadata: Record<string, unknown>;
      }) => {
        try {
          return {
            chunk_text: chunk.chunk_text,
            metadata: chunk.metadata || {},
            embedding:
              typeof chunk.embedding === "string"
                ? (JSON.parse(chunk.embedding) as number[])
                : chunk.embedding,
            document_title: docMap[chunk.kb_document_id]?.title || "Unknown",
            source_url: docMap[chunk.kb_document_id]?.source_url || "",
          };
        } catch {
          // Skip chunks with invalid embeddings
          return null;
        }
      }
    )
    .filter((chunk): chunk is CachedChunk => chunk !== null && chunk.embedding.length > 0);
  _chunkCacheTime = Date.now();

  return _chunkCache;
}

/* Fallback source URLs for KB documents that don't have source_url populated */
const KB_SOURCE_URLS: Record<string, string> = {
  "Lone Soldier Rights Overview":
    "https://www.kolzchut.org.il/he/חיילים_בודדים",
  "How to Apply for Rent Assistance":
    "https://www.kolzchut.org.il/he/סיוע_בהוצאות_דיור_לחיילים_בודדים",
  "Release Process and Enhanced Pikadon":
    "https://www.kolzchut.org.il/he/פיקדון_אישי_לחיילים_משוחררים_ומסיימי_שירות_לאומי-אזרחי",
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Run the full RAG pipeline for a chat message.
 * Falls back to demo mode when API keys are not configured.
 */
export async function runRagPipeline(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  preferredLanguage?: string,
  onToken?: (token: string) => void
): Promise<RagResult> {
  // 1. Detect language
  const language = preferredLanguage || detectLanguage(message);

  // 2. Check if we have the Anthropic key — if not, use demo mode
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.log("No ANTHROPIC_API_KEY — running in demo mode");
    return runDemoMode(message, language, onToken);
  }

  // 3. Search KB using multilingual embeddings
  //    text-embedding-3-small is multilingual — use lower threshold for non-English
  const matchThreshold = language === "en" ? 0.3 : 0.2;

  // 4. Generate embedding AND fetch cached KB chunks IN PARALLEL
  let kbChunks: {
    chunk_text: string;
    metadata?: Record<string, unknown>;
    document_title?: string;
    source_url?: string;
  }[] = [];

  try {
    const [embedding, allCachedChunks] = await Promise.all([
      generateEmbedding(message),
      getCachedKBChunks(),
    ]);

    // Compute cosine similarity (fast, in-memory with pre-parsed embeddings)
    const scored = allCachedChunks
      .map((chunk) => ({
        chunk_text: chunk.chunk_text,
        metadata: chunk.metadata,
        document_title: chunk.document_title,
        source_url: chunk.source_url,
        similarity: cosineSimilarity(embedding, chunk.embedding),
      }))
      .filter((c) => c.similarity > matchThreshold)
      .sort((a, b) => b.similarity - a.similarity);

    // Deduplicate: keep only the highest-scoring chunk per document
    const seenDocs = new Set<string>();
    const deduplicated = scored.filter((c) => {
      const key = c.document_title || c.chunk_text.slice(0, 50);
      if (seenDocs.has(key)) return false;
      seenDocs.add(key);
      return true;
    }).slice(0, 5);

    kbChunks = deduplicated.map((s) => ({
      chunk_text: s.chunk_text,
      metadata: s.metadata,
      document_title: s.document_title,
      source_url: s.source_url,
    }));
  } catch (embeddingError) {
    // If embedding fails (no OpenAI key), continue without KB context
    console.warn("Embedding/search failed, continuing without KB:", embeddingError);
  }

  // 5. Build source map for citation links (includes external source URLs)
  const sourceMap: Record<string, { title: string; url?: string }> = {};
  kbChunks.forEach((chunk, i) => {
    const title = chunk.document_title || `Source ${i + 1}`;
    const url = chunk.source_url || KB_SOURCE_URLS[title] || "";
    sourceMap[String(i + 1)] = {
      title,
      ...(url ? { url } : {}),
    };
  });

  // 6. Build system prompt with KB context
  const systemPrompt = buildSystemPrompt(language, kbChunks);

  // 7. Build conversation messages
  const messages = buildMessages(conversationHistory, message);

  // 8. Call Claude (streaming or non-streaming)
  try {
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    let rawReply = "";

    if (onToken) {
      // Streaming mode — buffer to filter out [[CONFIDENCE:X.XX]] marker
      // The marker appears at the end of the response, so we buffer trailing
      // text that might be part of it and only flush confirmed-safe text.
      let buffer = "";

      const flushSafe = () => {
        // Check if buffer might contain the start of a confidence marker
        const markerStart = buffer.indexOf("[[");
        if (markerStart === -1) {
          // No potential marker — flush everything
          if (buffer.length > 0) {
            onToken(buffer);
            buffer = "";
          }
        } else if (markerStart > 0) {
          // Flush text before the potential marker
          onToken(buffer.slice(0, markerStart));
          buffer = buffer.slice(markerStart);
        }
        // else: buffer starts with "[["" — hold it until we know more
      };

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1536,
        system: systemPrompt,
        messages,
      });

      stream.on("text", (text) => {
        rawReply += text;
        buffer += text;

        // If buffer contains a complete confidence marker, strip it
        const markerMatch = buffer.match(/\[\[CONFIDENCE:[\d. ]+\]\]/);
        if (markerMatch) {
          buffer = buffer.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/, "");
        }

        // If buffer is long enough that it's not a partial marker, flush
        // The longest marker is "[[CONFIDENCE:0.XX]]" = 20 chars
        if (!buffer.includes("[[") || buffer.length > 25) {
          flushSafe();
        }
      });

      await stream.finalMessage();

      // Flush any remaining buffer (strip confidence marker if present)
      buffer = buffer.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/, "");
      if (buffer.trim().length > 0) {
        onToken(buffer);
      }
    } else {
      // Non-streaming mode
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1536,
        system: systemPrompt,
        messages,
      });
      rawReply = response.content[0].type === "text" ? response.content[0].text : "";
    }

    // 9. Parse response
    const confidenceMatch = rawReply.match(/\[\[CONFIDENCE:([\d. ]+)\]\]/);
    const rawConfidence = confidenceMatch
      ? parseFloat(confidenceMatch[1].trim())
      : 0.5;
    // Only boost confidence when the answer actually cites KB sources
    // (prevents artificially high confidence on vague answers that happen
    //  to have KB chunks in context but don't meaningfully use them)
    const hasCitations = /\[\d+\]/.test(rawReply);
    const confidence =
      kbChunks.length > 0 && hasCitations
        ? Math.max(rawConfidence, 0.7)
        : rawConfidence;

    // Remove confidence marker from the visible reply
    const cleanReply = rawReply.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/, "").trim();

    // Extract source references
    const sourceRefs: number[] = [];
    const sourceRegex = /\[(\d+)\]/g;
    let sourceMatch: RegExpExecArray | null;
    while ((sourceMatch = sourceRegex.exec(cleanReply)) !== null) {
      sourceRefs.push(parseInt(sourceMatch[1]) - 1);
    }
    const sources = Array.from(new Set(sourceRefs))
      .filter((i) => i >= 0 && i < kbChunks.length)
      .map(
        (i) =>
          kbChunks[i].document_title ||
          `Source ${i + 1}`
      );

    return {
      reply: cleanReply,
      sources,
      sourceMap,
      confidence,
      language,
    };
  } catch (claudeError) {
    console.error("Claude API call failed, falling back to demo mode:", claudeError);
    return runDemoMode(message, language, onToken);
  }
}
