"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ClipboardCheck,
  FileText,
  Users,
  AlertTriangle,
  Loader2,
  MessageCircle,
} from "lucide-react";

/* ===== Types ===== */

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  labelHe: string;
  labelEn: string;
  icon: typeof ClipboardCheck;
  message: string;
}

/* ===== Mock Responses ===== */

const MOCK_RESPONSES: Record<string, { he: string; en: string }> = {
  rights: {
    he: "כחייל בודד מוכר, מגיעות לך מגוון זכויות כספיות, דיור, חופשות ועוד. הנה סיכום קצר:\n\n- תוספת חייל בודד: 620.70 ש\"ח לחודש\n- דמי כלכלה: 150 ש\"ח לחודש\n- מענק משרד השיכון: 402 ש\"ח לחודש\n- הנחת חשמל: 105 ש\"ח לחודש\n- פטור מלא מארנונה\n\nכדי לדעת בדיוק מה מגיע לך, מומלץ להשתמש בבדיקת הזכאות שלנו.",
    en: "As a recognized lone soldier, you're entitled to various financial benefits, housing, leave days, and more. Here's a brief summary:\n\n- Lone Soldier Allowance: NIS 620.70/mo\n- Food Allowance: NIS 150/mo\n- Housing Ministry Grant: NIS 402/mo\n- Electricity Discount: NIS 105/mo\n- Full Property Tax Exemption\n\nTo find out exactly what you're entitled to, I recommend using our eligibility checker.",
  },
  forms: {
    he: "יש כמה טפסים חשובים שכדאי שתכיר:\n\n1. טופס הכרה כחייל בודד — מוגש דרך הקצין המטפל ביחידה\n2. בקשה לסבסוד דיור — דרך מדור רווחה\n3. טופס פטור מארנונה — ברשות המקומית שלך\n\nרוצה שאפנה אותך למתנדב שיעזור לך למלא את הטפסים?",
    en: "There are several important forms you should know about:\n\n1. Lone Soldier Recognition Form — submitted through your unit's welfare officer\n2. Housing Subsidy Application — through the welfare department\n3. Property Tax Exemption Form — at your local municipality\n\nWould you like me to connect you with a volunteer who can help you fill out the forms?",
  },
  volunteer: {
    he: "בטח! אח גדול מפעיל צוות של כ-250 מתנדבים ברחבי הארץ. מתנדב אישי יכול:\n\n- ללוות אותך בתהליך מיצוי הזכויות\n- לעזור לך עם בירוקרטיה וטפסים\n- להיות כתף תומכת בכל נושא\n\nניתן ליצור קשר עם העמותה לשיבוץ מתנדב אישי.",
    en: "Of course! Ach Gadol has a team of ~250 volunteers across Israel. A personal volunteer can:\n\n- Guide you through claiming your rights\n- Help with bureaucracy and forms\n- Be a supportive presence for any issue\n\nYou can contact the organization to be matched with a personal volunteer.",
  },
  default: {
    he: "תודה על השאלה! אני מנסה לעזור בכל נושא הקשור לזכויות חיילים בודדים. לצערי, אני עדיין בשלב הפיתוח ולא יכול לענות על כל שאלה.\n\nבינתיים, אני ממליץ:\n- לבדוק את הזכויות שלך בעמוד הזכויות\n- להשתמש בבדיקת הזכאות\n- לפנות למתנדבי העמותה לעזרה אישית",
    en: "Thanks for your question! I try to help with everything related to lone soldier rights. Unfortunately, I'm still in development and can't answer every question.\n\nIn the meantime, I recommend:\n- Checking your rights on the Rights page\n- Using the Eligibility Checker\n- Reaching out to our volunteers for personal help",
  },
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "rights",
    labelHe: "מה מגיע לי?",
    labelEn: "What am I entitled to?",
    icon: ClipboardCheck,
    message: "rights",
  },
  {
    id: "forms",
    labelHe: "עזרה עם טפסים",
    labelEn: "Help with forms",
    icon: FileText,
    message: "forms",
  },
  {
    id: "volunteer",
    labelHe: "דברו עם מתנדב",
    labelEn: "Talk to a volunteer",
    icon: Users,
    message: "volunteer",
  },
];

/* ===== Message Bubble Component ===== */

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === "bot";

  return (
    <div
      className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isBot
            ? "bg-[hsl(var(--primary)/0.1)]"
            : "bg-[hsl(var(--accent)/0.15)]"
        }`}
      >
        {isBot ? (
          <Bot className="h-4 w-4 text-[hsl(var(--primary))]" />
        ) : (
          <User className="h-4 w-4 text-[hsl(var(--accent))]" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
          isBot
            ? "rounded-ss-sm bg-card border border-border/50 text-foreground"
            : "rounded-se-sm bg-[hsl(var(--primary))] text-primary-foreground"
        }`}
      >
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {message.content}
        </p>
        <p
          className={`mt-1 text-[10px] ${
            isBot ? "text-muted-foreground" : "text-primary-foreground/60"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

/* ===== Main Page Component ===== */

export default function ChatPage() {
  const tChat = useTranslations("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: tChat("welcome"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function getMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Check for keyword matches
    if (
      lowerMessage.includes("rights") ||
      lowerMessage.includes("entitled") ||
      lowerMessage.includes("benefits") ||
      lowerMessage.includes("allowance") ||
      lowerMessage.includes("money") ||
      lowerMessage.includes("grant") ||
      lowerMessage.includes("pay")
    ) {
      return MOCK_RESPONSES.rights.he;
    }

    if (
      lowerMessage.includes("form") ||
      lowerMessage.includes("document") ||
      lowerMessage.includes("application") ||
      lowerMessage.includes("paper")
    ) {
      return MOCK_RESPONSES.forms.he;
    }

    if (
      lowerMessage.includes("volunteer") ||
      lowerMessage.includes("person") ||
      lowerMessage.includes("human") ||
      lowerMessage.includes("talk") ||
      lowerMessage.includes("speak")
    ) {
      return MOCK_RESPONSES.volunteer.he;
    }

    // Hebrew keyword check
    if (
      lowerMessage.includes("זכויות") ||
      lowerMessage.includes("מגיע") ||
      lowerMessage.includes("כסף") ||
      lowerMessage.includes("מענק")
    ) {
      return MOCK_RESPONSES.rights.he;
    }

    if (
      lowerMessage.includes("טופס") ||
      lowerMessage.includes("מסמך") ||
      lowerMessage.includes("בקשה")
    ) {
      return MOCK_RESPONSES.forms.he;
    }

    if (
      lowerMessage.includes("מתנדב") ||
      lowerMessage.includes("אדם") ||
      lowerMessage.includes("לדבר")
    ) {
      return MOCK_RESPONSES.volunteer.he;
    }

    return MOCK_RESPONSES.default.he;
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botResponse = getMockResponse(trimmed);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  }

  function handleQuickAction(action: QuickAction) {
    // Add user message (the quick action label)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: action.labelHe,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const response =
        MOCK_RESPONSES[action.message]?.he ?? MOCK_RESPONSES.default.he;
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000 + Math.random() * 600);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* ===== Chat Header ===== */}
      <div className="flex-shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)]">
              <Bot className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                {tChat("title")}
              </h1>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[hsl(var(--accent))]" />
                <span className="text-xs text-muted-foreground">
                  {tChat("powered_by")}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{tChat("escalate").split("?")[0]}?</span>
          </Link>
        </div>
      </div>

      {/* ===== Messages Area ===== */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)]">
                  <Bot className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div className="rounded-2xl rounded-ss-sm border border-border/50 bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
                    <span className="text-sm text-muted-foreground">
                      {tChat("typing")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (shown only at beginning) */}
          {messages.length <= 1 && !isTyping && (
            <div className="mt-6">
              <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
                Quick Actions
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.05)] px-4 py-2 text-sm font-medium text-[hsl(var(--primary))] transition-all hover:bg-[hsl(var(--primary)/0.1)] hover:shadow-sm"
                  >
                    <action.icon className="h-4 w-4" />
                    <span>{action.labelHe}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Disclaimer ===== */}
      <div className="flex-shrink-0 border-t border-border/20 bg-amber-50/50 dark:bg-amber-900/5">
        <div className="mx-auto max-w-4xl px-4 py-1.5 sm:px-6">
          <div className="flex items-center justify-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <p className="text-[10px] text-amber-700 dark:text-amber-300">
              {tChat("disclaimer")}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Input Area ===== */}
      <div className="flex-shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tChat("placeholder")}
              disabled={isTyping}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-primary-foreground shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={tChat("send")}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
