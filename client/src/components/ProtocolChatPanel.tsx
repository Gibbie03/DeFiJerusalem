import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, Loader2, X, MessageSquare, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ProtocolChatPanelProps {
  protocolName: string;
  onClose: () => void;
}

// ─── Formatting helpers (shared with ChatPage) ────────────────────────────────

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function formatContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### "))
      return (
        <p key={i} className="font-semibold text-primary mt-3 mb-1">
          {line.slice(4)}
        </p>
      );
    if (line.startsWith("## "))
      return (
        <p key={i} className="font-bold text-base text-foreground mt-3 mb-1">
          {line.slice(3)}
        </p>
      );
    if (line.startsWith("**") && line.endsWith("**"))
      return (
        <p key={i} className="font-semibold text-foreground">
          {line.slice(2, -2)}
        </p>
      );
    if (line.startsWith("- ") || line.startsWith("• "))
      return (
        <li key={i} className="ml-4 text-sm text-foreground/90 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    if (/^\d+\.\s/.test(line))
      return (
        <li key={i} className="ml-4 text-sm text-foreground/90 list-decimal">
          {renderInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="text-sm text-foreground/90">
        {renderInline(line)}
      </p>
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProtocolChatPanel({
  protocolName,
  onClose,
}: ProtocolChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seedSentRef = useRef(false);
  const { toast } = useToast();

  const { data: statusData } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/chat/status"],
    refetchOnWindowFocus: false,
  });

  const isConfigured = statusData?.configured ?? true;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when panel mounts
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ message: content, history }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error ?? res.statusText);
        }
        const data: { reply: string } = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply,
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get a response";
        toast({
          title: "Chat Error",
          description: errorMsg,
          variant: "destructive",
        });
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setInput(content);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, messages, toast]
  );

  // Auto-seed the first message with the protocol name
  useEffect(() => {
    if (seedSentRef.current || !isConfigured || statusData === undefined) return;
    seedSentRef.current = true;
    sendMessage(`Tell me about ${protocolName}'s security`);
  }, [isConfigured, statusData, sendMessage, protocolName]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    /* Overlay backdrop */
    <div
      className="fixed inset-0 z-50 flex justify-end"
      aria-modal="true"
      role="dialog"
      aria-label={`AI chat about ${protocolName}`}
    >
      {/* Semi-transparent backdrop — click to close */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="relative z-10 flex flex-col w-full max-w-md h-full bg-background border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 via-accent/70 to-primary/60 flex items-center justify-center shadow">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Ask AI about {protocolName}</p>
              <p className="text-xs text-muted-foreground">Security-focused answers</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Close chat panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Not-configured warning */}
        {statusData && !isConfigured && (
          <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            AI chat requires an OpenAI API key. Contact your admin.
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-4 space-y-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 py-2 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.role === "user"
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3 h-3 text-primary" />
                  ) : (
                    <Bot className="w-3 h-3 text-primary" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card border border-border/60 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-0.5">{formatContent(msg.content)}</div>
                  )}
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.role === "user"
                        ? "text-primary-foreground/60 text-right"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 py-2">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Querying protocol data…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-card/60 px-4 py-3 shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConfigured
                  ? `Ask anything about ${protocolName}…`
                  : "AI not configured"
              }
              disabled={!isConfigured || isLoading}
              rows={2}
              className="resize-none text-sm min-h-[60px] max-h-[120px]"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || !isConfigured}
              size="icon"
              className="shrink-0 h-10 w-10"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Press Enter to send · Shift+Enter for new line · Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
