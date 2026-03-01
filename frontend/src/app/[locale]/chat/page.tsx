"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import ReactMarkdown from "react-markdown";
import {
  Send,
  ClipboardCheck,
  FileText,
  Users,
  Loader2,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import SoldierAvatar from "@/components/SoldierAvatar";

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

/* ===== Markdown-rendered bot content with citation support ===== */

function BotMessageContent({
  content,
  sourceMap,
  locale,
  isStreaming,
}: {
  content: string;
  sourceMap?: Record<string, { title: string; url?: string }>;
  locale: string;
  isStreaming?: boolean;
}) {
  if (!content) return null;

  const cleaned = content
    .replace(/\[\[CONFIDENCE:[\d.]*\]\]/, "")
    .replace(/\[\[CONFIDENCE:?[\d.]*$/, "")
    .trim();

  // Replace citation numbers [1], [2] etc. with special markers before markdown parsing
  // so they survive the markdown transformation
  const withCitations = cleaned.replace(/\[(\d+)\]/g, (match, num) => {
    if (sourceMap && sourceMap[num]) {
      const source = sourceMap[num];
      const href = source.url || `/${locale}${FALLBACK_SOURCE_URL}`;
      return `[⁠${num}⁠](${href} "${source.title}")`;
    }
    return match;
  });

  return (
    <div className="prose-chat">
      <ReactMarkdown
        components={{
          // Style links
          a: ({ children, href, title, ...props }) => {
            // Detect citation links (contain invisible chars ⁠)
            const text = String(children);
            const isCitation = text.includes("⁠");
            if (isCitation) {
              const num = text.replace(/⁠/g, "");
              return (
                <a
                  href={href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-0.5 inline-flex items-center justify-center rounded-md bg-[hsl(var(--primary)/0.12)] px-1.5 py-0 text-[11px] font-semibold leading-5 text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--primary)/0.25)] no-underline"
                  title={title || ""}
                >
                  {num}
                </a>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[hsl(var(--primary))] underline decoration-[hsl(var(--primary)/0.3)] underline-offset-2 transition-colors hover:decoration-[hsl(var(--primary))]"
                {...props}
              >
                {children}
                <ExternalLink className="inline h-3 w-3 flex-shrink-0" />
              </a>
            );
          },
          // Style headings
          h1: ({ children }) => (
            <h3 className="mb-2 mt-4 text-[16px] font-bold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-3 text-[15px] font-bold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1.5 mt-3 text-[15px] font-semibold text-foreground first:mt-0">
              {children}
            </h4>
          ),
          // Style paragraphs
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-[15px] leading-[1.75]">
              {children}
            </p>
          ),
          // Style lists
          ul: ({ children }) => (
            <ul className="mb-2 list-none space-y-1 ps-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 ps-5 marker:text-[hsl(var(--primary)/0.6)] marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[15px] leading-[1.7] ps-1 before:content-['•_'] before:text-[hsl(var(--primary)/0.5)] before:font-bold [&_ul]:before:content-none [ol_&]:before:content-none">
              {children}
            </li>
          ),
          // Style bold/strong
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          // Style code
          code: ({ children }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono text-foreground">
              {children}
            </code>
          ),
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-s-3 border-[hsl(var(--primary)/0.3)] ps-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {withCitations}
      </ReactMarkdown>
      {isStreaming && (
        <span className="ml-0.5 inline-block h-[18px] w-[2px] animate-pulse rounded-sm bg-[hsl(var(--primary)/0.6)]" />
      )}
    </div>
  );
}

/* ===== Message Row — ChatGPT-style ===== */

function MessageRow({
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

  if (!isBot) {
    /* ----- User message: subtle bg, aligned to end ----- */
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl bg-[hsl(var(--muted))] px-4 py-3">
          <div className="whitespace-pre-line text-[15px] leading-[1.7] text-foreground">
            {mainContent}
          </div>
        </div>
      </div>
    );
  }

  /* ----- Bot message: full width, no background ----- */
  return (
    <div className="group">
      <div className="flex items-start gap-3">
        {/* Ach Gadol logo avatar */}
        <div className="flex-shrink-0 mt-0.5 h-8 w-8 overflow-hidden rounded-full ring-2 ring-[hsl(var(--primary)/0.1)]">
          <SoldierAvatar className="h-8 w-8 rounded-full" size={40} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pt-0.5">
          {/* Loading dots */}
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-1.5 py-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--primary)/0.4)] [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--primary)/0.4)] [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[hsl(var(--primary)/0.4)] [animation-delay:300ms]" />
            </div>
          ) : (
            <BotMessageContent
              content={mainContent}
              sourceMap={message.sourceMap}
              locale={locale}
              isStreaming={message.isStreaming}
            />
          )}

          {/* Sources */}
          {!message.isStreaming && message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground/60 self-center">
                {tChat("sources_label")}
              </span>
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
                    className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-[hsl(var(--primary)/0.3)] hover:text-[hsl(var(--primary))]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {source}
                  </a>
                );
              })}
            </div>
          )}

          {/* Follow-up Suggestions */}
          {!message.isStreaming && isLastBot && suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3.5 py-2 text-[13px] font-medium text-foreground transition-all hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--primary)/0.04)] hover:text-[hsl(var(--primary))] active:scale-[0.98]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  const isWelcomeState = messages.length === 0 && !isTyping;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* ===== Messages / Welcome Area ===== */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isWelcomeState ? (
          /* ===== Welcome State ===== */
          <div className="flex h-full flex-col items-center justify-center px-4 pb-8">
            {/* Greeting — Ach Gadol logo */}
            <div className="mb-3 h-20 w-20 overflow-hidden rounded-full ring-4 ring-[hsl(var(--primary)/0.1)] shadow-lg">
              <SoldierAvatar className="h-20 w-20 rounded-full" size={96} />
            </div>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {tChat("title")}
            </h1>
            <p className="mt-2 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground">
              {tChat("welcome")}
            </p>

            {/* Quick Action Cards */}
            <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-3 sm:max-w-2xl">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-border/50 bg-card/80 p-4 text-start transition-all hover:border-[hsl(var(--primary)/0.25)] hover:bg-card hover:shadow-md active:scale-[0.98]"
                >
                  <action.icon className="h-5 w-5 text-[hsl(var(--primary)/0.7)] transition-colors group-hover:text-[hsl(var(--primary))]" />
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {action.label}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground/70 hidden sm:block">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        ) : (
          /* ===== Chat Messages ===== */
          <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
            <div className="space-y-6" aria-live="polite">
              {messages.map((message, idx) => (
                <MessageRow
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

      </div>

      {/* ===== Input Area ===== */}
      <div className="flex-shrink-0 pb-3 pt-1 sm:pb-5">
        <div className="mx-auto max-w-2xl px-3 sm:px-5">
          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-card px-4 py-2.5 shadow-sm transition-all focus-within:border-[hsl(var(--primary)/0.4)] focus-within:shadow-md">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={tChat("placeholder")}
              disabled={isTyping}
              rows={1}
              aria-label={tChat("placeholder")}
              className="flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-foreground placeholder-muted-foreground/50 outline-none disabled:opacity-50"
              style={{ maxHeight: "7.5rem" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="mb-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label={tChat("send")}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
