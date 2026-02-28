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
  ExternalLink,
  ArrowUpRight,
  Phone,
} from "lucide-react";

/* ===== Types ===== */

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  sources?: string[];
  sourceMap?: Record<string, { title: string; url?: string }>;
  confidence?: number;
  isStreaming?: boolean;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof ClipboardCheck;
  message: string;
}

/* ===== Fallback URL for sources without an external link ===== */

const FALLBACK_SOURCE_URL = "/rights";

/* ===== Parse follow-up suggestions from bot content ===== */

function parseSuggestions(content: string): {
  mainContent: string;
  suggestions: string[];
} {
  const lines = content.split("\n");
  const mainLines: string[] = [];
  const suggestions: string[] = [];

  for (const line of lines) {
    if (line.startsWith(">> ")) {
      suggestions.push(line.slice(3).trim());
    } else {
      mainLines.push(line);
    }
  }

  return {
    mainContent: mainLines.join("\n").trimEnd(),
    suggestions,
  };
}

/* ===== Confidence Indicator ===== */

function ConfidenceDot({ confidence }: { confidence: number }) {
  const tChat = useTranslations("chat");
  const color =
    confidence >= 0.8
      ? "bg-emerald-500"
      : confidence >= 0.5
        ? "bg-amber-500"
        : "bg-rose-500";

  const label =
    confidence >= 0.8
      ? tChat("confidence_high")
      : confidence >= 0.5
        ? tChat("confidence_medium")
        : tChat("confidence_low");

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      title={label}
    />
  );
}

/* ===== Citation rendering ===== */

function renderMessageContent(
  content: string,
  sourceMap?: Record<string, { title: string; url?: string }>,
  locale?: string
) {
  if (!content) return null;

  const cleaned = content
    .replace(/\[\[CONFIDENCE:[\d.]*\]\]/, "")
    .replace(/\[\[CONFIDENCE:?[\d.]*$/, "")
    .trim();

  const parts = cleaned.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\[\d+\])/g);

  return (
    <>
      {parts.map((part, i) => {
        const mdMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
        if (mdMatch) {
          return (
            <a
              key={i}
              href={mdMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[hsl(var(--primary))] underline decoration-[hsl(var(--primary)/0.3)] underline-offset-2 transition-colors hover:decoration-[hsl(var(--primary))]"
            >
              {mdMatch[1]}
              <ExternalLink className="inline h-3 w-3 flex-shrink-0" />
            </a>
          );
        }

        const numMatch = part.match(/^\[(\d+)\]$/);
        if (numMatch && sourceMap) {
          const num = numMatch[1];
          const source = sourceMap[num];
          if (source) {
            const href = source.url || `/${locale}${FALLBACK_SOURCE_URL}`;
            const isExternal = !!source.url;
            return (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-0.5 inline-flex items-center justify-center rounded bg-[hsl(var(--primary)/0.15)] px-1 py-0 text-[10px] font-bold leading-4 text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.3)] no-underline"
                title={`${source.title}${isExternal ? " ↗" : ""}`}
              >
                {num}
              </a>
            );
          }
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ===== Message Bubble Component ===== */

function MessageBubble({
  message,
  onSuggestionClick,
  isLastBot,
}: {
  message: Message;
  onSuggestionClick?: (text: string) => void;
  isLastBot?: boolean;
}) {
  const isBot = message.role === "bot";
  const locale = useLocale();
  const tChat = useTranslations("chat");

  const { mainContent, suggestions } = isBot
    ? parseSuggestions(message.content)
    : { mainContent: message.content, suggestions: [] };

  return (
    <div className={`flex gap-2.5 ${isBot ? "" : "flex-row-reverse"}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
          isBot
            ? "bg-[hsl(var(--primary)/0.12)] ring-2 ring-[hsl(var(--primary)/0.06)]"
            : "bg-[hsl(var(--accent)/0.15)]"
        }`}
      >
        {isBot ? (
          <Bot className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
        ) : (
          <User className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
        )}
      </div>

      {/* Bubble + Suggestions */}
      <div className="max-w-[82%] sm:max-w-[72%]">
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isBot
              ? "rounded-ss-md bg-card text-foreground shadow-sm ring-1 ring-border/40"
              : "rounded-se-md bg-[hsl(var(--primary))] text-primary-foreground shadow-sm"
          }`}
        >
          {/* Loading dots before first token */}
          {isBot && message.isStreaming && !message.content ? (
            <div className="flex items-center gap-1 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--primary)/0.4)] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--primary)/0.4)] [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[hsl(var(--primary)/0.4)] [animation-delay:300ms]" />
            </div>
          ) : (
            <div className="whitespace-pre-line text-[14px] leading-[1.65]">
              {renderMessageContent(mainContent, message.sourceMap, locale)}
              {message.isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-sm bg-[hsl(var(--primary)/0.5)]" />
              )}
            </div>
          )}

          {/* Sources */}
          {isBot && !message.isStreaming && message.sources && message.sources.length > 0 && (
            <div className="mt-2 border-t border-border/20 pt-2">
              <p className="text-[10px] font-medium text-muted-foreground/70">
                {tChat("sources_label")}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {message.sources.map((source, i) => {
                  const mapEntry = message.sourceMap
                    ? Object.values(message.sourceMap).find((s) => s.title === source)
                    : null;
                  const href = mapEntry?.url || `/${locale}${FALLBACK_SOURCE_URL}`;
                  return (
                    <a
                      key={i}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      {source}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timestamp + Confidence */}
          {!message.isStreaming && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {isBot && message.confidence !== undefined && (
                <ConfidenceDot confidence={message.confidence} />
              )}
              <p
                className={`text-[10px] ${
                  isBot ? "text-muted-foreground/50" : "text-primary-foreground/50"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Follow-up Suggestions */}
        {isBot && !message.isStreaming && isLastBot && suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="inline-flex items-center gap-1 rounded-xl border border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--primary)/0.04)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary))] transition-all hover:bg-[hsl(var(--primary)/0.1)] hover:shadow-sm active:scale-[0.98]"
              >
                <ArrowUpRight className="h-3 w-3" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Escalation Banner ===== */

function EscalationBanner() {
  const tChat = useTranslations("chat");

  return (
    <div className="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
      <div className="rounded-xl border border-amber-200/50 bg-amber-50/80 p-3 dark:border-amber-800/50 dark:bg-amber-900/10">
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
              <Phone className="h-3 w-3" />
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledUp = useRef(false);

  const quickActions: QuickAction[] = [
    {
      id: "rights",
      label: tChat("quick_rights"),
      description: tChat("quick_rights_msg"),
      icon: ClipboardCheck,
      message: tChat("quick_rights_msg"),
    },
    {
      id: "forms",
      label: tChat("quick_forms"),
      description: tChat("quick_forms_msg"),
      icon: FileText,
      message: tChat("quick_forms_msg"),
    },
    {
      id: "volunteer",
      label: tChat("quick_volunteer"),
      description: tChat("quick_volunteer_msg"),
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

  // Detect if user has scrolled up
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 150;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Smart auto-scroll
  useEffect(() => {
    if (userScrolledUp.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const lastMsg = messages[messages.length - 1];
    const isCurrentlyStreaming = lastMsg?.isStreaming;

    if (isCurrentlyStreaming) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      const botMsgId = `bot-${Date.now()}`;
      const botMsg: Message = {
        id: botMsgId,
        role: "bot",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      setInput("");
      setIsTyping(true);
      setShowEscalation(false);
      userScrolledUp.current = false;

      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

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

        if (!response.ok || !response.body) {
          throw new Error("Failed to send message");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            if (!event.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(event.slice(6));

              if (data.type === "session" && data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
              } else if (data.type === "token") {
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg.id === botMsgId) {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMsg, content: lastMsg.content + data.text },
                    ];
                  }
                  return prev;
                });
              } else if (data.type === "done") {
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg.id === botMsgId) {
                    const cleanContent = lastMsg.content
                      .replace(/\[\[CONFIDENCE:[\d.]*\]\]/, "")
                      .trim();
                    return [
                      ...prev.slice(0, -1),
                      {
                        ...lastMsg,
                        content: cleanContent,
                        sources: data.sources,
                        sourceMap: data.sourceMap,
                        confidence: data.confidence,
                        isStreaming: false,
                      },
                    ];
                  }
                  return prev;
                });

                if (data.confidence < 0.5) {
                  setShowEscalation(true);
                }
              } else if (data.type === "error") {
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg.id === botMsgId) {
                    return [
                      ...prev.slice(0, -1),
                      {
                        ...lastMsg,
                        content: tChat("error_message"),
                        isStreaming: false,
                        confidence: 0,
                      },
                    ];
                  }
                  return prev;
                });
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id === botMsgId && lastMsg.isStreaming) {
            const cleanContent = lastMsg.content
              .replace(/\[\[CONFIDENCE:[\d.]*\]\]/, "")
              .trim();
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, content: cleanContent, isStreaming: false },
            ];
          }
          return prev;
        });
      } catch (error) {
        console.error("Send message error:", error);
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.id === botMsgId) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                content: tChat("error_message"),
                isStreaming: false,
                confidence: 0,
              },
            ];
          }
          return prev;
        });
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

  function handleSuggestionClick(text: string) {
    sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  const lastBotIdx = messages.reduceRight(
    (found, msg, idx) => (found === -1 && msg.role === "bot" ? idx : found),
    -1
  );

  const isWelcomeState = messages.length <= 1 && !isTyping;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-gradient-to-b from-background via-background to-muted/20">
      {/* ===== Messages Area ===== */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isWelcomeState ? (
          /* ===== Welcome / Empty State ===== */
          <div className="flex h-full flex-col items-center justify-center px-4 pb-4">
            {/* Bot avatar & branding */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] ring-4 ring-[hsl(var(--primary)/0.05)]">
              <Bot className="h-8 w-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {tChat("title")}
            </h1>
            <div className="mt-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
              <span className="text-sm text-muted-foreground">
                {tChat("powered_by")}
              </span>
            </div>

            {/* Welcome message */}
            <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
              {tChat("welcome")}
            </p>

            {/* Quick Action Cards */}
            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-3 sm:max-w-xl">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-start shadow-sm transition-all hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.04)] hover:shadow-md active:scale-[0.98] sm:flex-col sm:items-start sm:gap-2 sm:p-4"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.08)] transition-colors group-hover:bg-[hsl(var(--primary)/0.14)]">
                    <action.icon className="h-4.5 w-4.5 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground hidden sm:block">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="mt-6 max-w-sm text-center text-[10px] leading-relaxed text-muted-foreground/50">
              {tChat("disclaimer")}
            </p>
          </div>
        ) : (
          /* ===== Chat Messages ===== */
          <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
            <div className="space-y-4" aria-live="polite">
              {messages.map((message, idx) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                  isLastBot={idx === lastBotIdx}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Escalation Banner */}
        {showEscalation && <EscalationBanner />}
      </div>

      {/* ===== Input Area ===== */}
      <div className="flex-shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-3xl px-3 py-2.5 sm:px-5">
          <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-sm transition-all focus-within:border-[hsl(var(--primary)/0.4)] focus-within:ring-2 focus-within:ring-[hsl(var(--primary)/0.08)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={tChat("placeholder")}
              disabled={isTyping}
              rows={1}
              aria-label={tChat("placeholder")}
              className="flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-relaxed text-foreground placeholder-muted-foreground/60 outline-none disabled:opacity-50"
              style={{ maxHeight: "7.5rem" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="mb-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-primary-foreground shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tChat("send")}
            >
              {isTyping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
