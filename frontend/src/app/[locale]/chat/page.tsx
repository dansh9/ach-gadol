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
  sourceMap?: Record<string, { title: string; url?: string }>;
  confidence?: number;
  isStreaming?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: typeof ClipboardCheck;
  message: string;
}

/* ===== Fallback URL for sources without an external link ===== */

const FALLBACK_SOURCE_URL = "/rights";

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

/**
 * Parse message content and render:
 *   - [N] citation numbers as small clickable badges linking to KB sources
 *   - [text](url) markdown links as clickable external links (e.g. Kol-Zchut)
 */
function renderMessageContent(
  content: string,
  sourceMap?: Record<string, { title: string; url?: string }>,
  locale?: string
) {
  if (!content) return null;

  // Strip confidence marker that may appear during streaming
  const cleaned = content
    .replace(/\[\[CONFIDENCE:[\d.]*\]\]/, "")
    .replace(/\[\[CONFIDENCE:?[\d.]*$/, "")
    .trim();

  // Split by both [N] citations AND [text](url) markdown links (keep delimiters)
  // Order matters: match markdown links first (they also start with [)
  const parts = cleaned.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\[\d+\])/g);

  return (
    <>
      {parts.map((part, i) => {
        // Match markdown links: [link text](url)
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

        // Match [N] citation numbers
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

function MessageBubble({ message }: { message: Message }) {
  const isBot = message.role === "bot";
  const locale = useLocale();
  const tChat = useTranslations("chat");

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
        {/* Loading state — before first token arrives */}
        {isBot && message.isStreaming && !message.content ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />
            <span className="text-sm text-muted-foreground">...</span>
          </div>
        ) : (
          /* Message content with clickable citations */
          <div className="whitespace-pre-line text-sm leading-relaxed">
            {renderMessageContent(message.content, message.sourceMap, locale)}
            {/* Blinking cursor during streaming */}
            {message.isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-sm bg-[hsl(var(--primary)/0.6)]" />
            )}
          </div>
        )}

        {/* Sources — only shown when streaming is complete */}
        {isBot && !message.isStreaming && message.sources && message.sources.length > 0 && (
          <div className="mt-2 border-t border-border/30 pt-2">
            <p className="text-[10px] font-medium text-muted-foreground">
              {tChat("sources_label")}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {message.sources.map((source, i) => {
                // Find external URL from sourceMap by matching title
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
                    className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))]"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    {source}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Timestamp + Confidence — only when done */}
        {!message.isStreaming && (
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
        )}
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledUp = useRef(false);

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

  // Detect if user has scrolled up (so we don't force them back down)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // "Near bottom" = within 150px of the bottom
      userScrolledUp.current = scrollHeight - scrollTop - clientHeight > 150;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Smart auto-scroll: only scroll if user is near the bottom
  useEffect(() => {
    if (userScrolledUp.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // During streaming: instant scroll (no queuing of smooth animations)
    // After streaming: smooth scroll for new messages
    const lastMsg = messages[messages.length - 1];
    const isCurrentlyStreaming = lastMsg?.isStreaming;

    if (isCurrentlyStreaming) {
      // Instant snap to bottom during streaming — no jank
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

      // Add placeholder bot message for streaming
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
      userScrolledUp.current = false; // Reset so we auto-scroll to the new response

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

        // Read SSE stream
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
                // Append token to the streaming bot message
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
                // Finalize the bot message with sources and confidence
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

        // Ensure streaming flag is cleared even if no "done" event
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /** Auto-resize the textarea to fit content (up to ~6 lines) */
  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="space-y-4" aria-live="polite">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

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
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={tChat("placeholder")}
              disabled={isTyping}
              rows={2}
              aria-label={tChat("placeholder")}
              className="flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-base leading-relaxed text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] disabled:opacity-50"
              style={{ minHeight: "3.5rem", maxHeight: "10rem" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="mb-1 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-primary-foreground shadow-md transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
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
