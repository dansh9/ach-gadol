"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  ExternalLink,
} from "lucide-react";

/* ===== Types ===== */

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  sources?: string[];
  confidence?: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof ClipboardCheck;
  message: string;
}

/* ===== Confidence Indicator ===== */

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color =
    confidence >= 0.8
      ? "bg-emerald-500"
      : confidence >= 0.5
        ? "bg-amber-500"
        : "bg-rose-500";

  const label =
    confidence >= 0.8
      ? "High confidence"
      : confidence >= 0.5
        ? "Medium confidence"
        : "Low confidence";

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={label}
    />
  );
}

/* ===== Message Bubble Component ===== */

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === "bot";

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
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
            ? "rounded-ss-sm border border-border/50 bg-card text-foreground"
            : "rounded-se-sm bg-[hsl(var(--primary))] text-primary-foreground"
        }`}
      >
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {message.content}
        </p>

        {/* Sources */}
        {isBot && message.sources && message.sources.length > 0 && (
          <div className="mt-2 border-t border-border/30 pt-2">
            <p className="text-[10px] font-medium text-muted-foreground">
              Sources:
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {message.sources.map((source, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp + Confidence */}
        <div className="mt-1 flex items-center gap-1.5">
          {isBot && message.confidence !== undefined && (
            <ConfidenceDot confidence={message.confidence} />
          )}
          <p
            className={`text-[10px] ${
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
    </div>
  );
}

/* ===== Escalation Banner ===== */

function EscalationBanner() {
  const tChat = useTranslations("chat");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <div className="rounded-xl border border-amber-200/50 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {tChat("escalate")}
            </p>
            <Link
              href="/resources"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 underline hover:text-amber-900 dark:text-amber-300"
            >
              <Users className="h-3 w-3" />
              {tChat("contact_volunteer")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Main Page Component ===== */

export default function ChatPage() {
  const tChat = useTranslations("chat");
  const locale = useLocale();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: "rights",
      label: tChat("quick_rights"),
      icon: ClipboardCheck,
      message: tChat("quick_rights_msg"),
    },
    {
      id: "forms",
      label: tChat("quick_forms"),
      icon: FileText,
      message: tChat("quick_forms_msg"),
    },
    {
      id: "volunteer",
      label: tChat("quick_volunteer"),
      icon: Users,
      message: tChat("quick_volunteer_msg"),
    },
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: tChat("welcome"),
      timestamp: new Date(),
      confidence: 1.0,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // Add user message
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      setShowEscalation(false);

      try {
        const response = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            message: text.trim(),
            language: locale,
            channel: "website",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send message");
        }

        // Update session ID
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId);
        }

        // Add bot response
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          role: "bot",
          content: data.reply,
          timestamp: new Date(),
          sources: data.sources,
          confidence: data.confidence,
        };
        setMessages((prev) => [...prev, botMsg]);

        // Show escalation banner for low confidence
        if (data.confidence < 0.5) {
          setShowEscalation(true);
        }
      } catch (error) {
        console.error("Send message error:", error);
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: "bot",
          content: tChat("error_message"),
          timestamp: new Date(),
          confidence: 0,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sessionId, locale, tChat]
  );

  function handleSend() {
    sendMessage(input);
  }

  function handleQuickAction(action: QuickAction) {
    sendMessage(action.message);
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
                {tChat("quick_actions")}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.05)] px-4 py-2 text-sm font-medium text-[hsl(var(--primary))] transition-all hover:bg-[hsl(var(--primary)/0.1)] hover:shadow-sm"
                  >
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Escalation Banner */}
        {showEscalation && <EscalationBanner />}
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
