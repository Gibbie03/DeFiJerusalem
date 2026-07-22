import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Shield, Zap, AlertTriangle, BarChart3, RefreshCw, Share2, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const STARTER_QUESTIONS = [
  { icon: Shield, text: "Which protocols have the highest security scores?" },
  { icon: BarChart3, text: "What are the top DeFi protocols by TVL?" },
  { icon: AlertTriangle, text: "Show me recently flagged or risky protocols" },
  { icon: Zap, text: "Which Arbitrum protocols have been audited?" },
];

function formatContent(text: string) {
  // Convert markdown-ish formatting to JSX-friendly HTML-ish structure
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) {
      return (
        <p key={i} className="font-semibold text-primary mt-3 mb-1">
          {line.slice(4)}
        </p>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <p key={i} className="font-bold text-base text-foreground mt-3 mb-1">
          {line.slice(3)}
        </p>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="font-semibold text-foreground">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return (
        <li key={i} className="ml-4 text-sm text-foreground/90 list-disc">
          {renderInline(line.slice(2))}
        </li>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={i} className="ml-4 text-sm text-foreground/90 list-decimal">
          {renderInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    }
    if (line.trim() === "") {
      return <br key={i} />;
    }
    return (
      <p key={i} className="text-sm text-foreground/90">
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(text: string) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [copiedInPopover, setCopiedInPopover] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const autoSentRef = useRef(false);

  const hasAssistantReply = messages.some((m) => m.role === "assistant");

  const { data: statusData } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/chat/status"],
    refetchOnWindowFocus: false,
  });

  const isConfigured = statusData?.configured ?? true;

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      // Build history for context (last 10 exchanges)
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

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to get a response";
        toast({
          title: "Chat Error",
          description: errorMsg,
          variant: "destructive",
        });
        // Remove the user message if we failed
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setInput(content);
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [input, isLoading, messages, toast]
  );

  // Auto-send message from ?q= URL parameter (e.g. from protocol detail page).
  // After reading the param we immediately strip it from the URL via
  // history.replaceState so that a hard-refresh or back-navigation does not
  // re-trigger the auto-send.
  useEffect(() => {
    if (autoSentRef.current || !isConfigured || statusData === undefined) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      autoSentRef.current = true;
      // Remove ?q= so a page refresh can't re-send the same message
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("q");
      history.replaceState(null, "", cleanUrl.pathname + (cleanUrl.search || ""));
      sendMessage(q);
    }
  }, [isConfigured, statusData, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShareUrl(null);
    setShowSharePopover(false);
    setCopiedInPopover(false);
  };

  const shareChat = useCallback(async () => {
    if (isSharing || messages.length === 0) return;
    setIsSharing(true);
    try {
      // Derive a title from the first user message (truncated)
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser
        ? firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? "…" : "")
        : "AI Security Chat";

      const payload = {
        title,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        })),
      };

      const res = await fetch("/api/chat/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? res.statusText);
      }

      const { id } = await res.json();
      const url = `${window.location.origin}/chat/share/${id}`;
      setShareUrl(url);
      setShowSharePopover(true);

      // Best-effort clipboard write; popover lets users copy manually if it fails
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // clipboard unavailable — popover still shows the link
      }
    } catch (err) {
      toast({
        title: "Share failed",
        description: err instanceof Error ? err.message : "Could not create share link",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, messages, toast]);

  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInPopover(true);
      setTimeout(() => setCopiedInPopover(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  }, [shareUrl, toast]);

  const handlePopoverOpenChange = (open: boolean) => {
    setShowSharePopover(open);
    if (!open) {
      setCopiedInPopover(false);
      // shareUrl is intentionally kept so re-clicking Share reopens the same link
    }
  };

  const regenerateShare = useCallback(async () => {
    setShareUrl(null);
    setCopiedInPopover(false);
    setShowSharePopover(false);
    // Give React a tick to update state before calling shareChat
    setTimeout(() => shareChat(), 0);
  }, [shareChat]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/60 backdrop-blur-sm px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/80 via-accent/70 to-primary/60 flex items-center justify-center shadow">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                Dada the Defender
              </h1>
              <p className="text-xs text-muted-foreground">
                Ask anything about DeFi protocol security
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConfigured ? "default" : "destructive"}
              className="text-xs"
            >
              {isConfigured ? "● Online" : "● Not Configured"}
            </Badge>
            {hasAssistantReply && (
              <Popover open={showSharePopover} onOpenChange={handlePopoverOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={!shareUrl ? shareChat : undefined}
                    disabled={isSharing}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        Sharing…
                      </>
                    ) : shareUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                        Shared
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 mr-1" />
                        Share
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <p className="text-sm font-medium text-foreground mb-1">Share link</p>
                  <p className="text-xs text-muted-foreground mb-3">Valid for 7 days. Anyone with this link can view the conversation.</p>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 mb-3 border border-border/60">
                    <span className="text-xs text-foreground/80 truncate flex-1 font-mono select-all">
                      {shareUrl}
                    </span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={copyShareUrl}
                    >
                      {copiedInPopover ? (
                        <><Check className="w-3 h-3 mr-1 text-green-500" />Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => window.open(shareUrl ?? "", "_blank", "noopener,noreferrer")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={regenerateShare}
                    disabled={isSharing}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate link
                  </Button>
                </PopoverContent>
              </Popover>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                New chat
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 flex items-center justify-center border border-primary/20">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Dada the Defender
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask me about DeFi protocol security — audits, TVL, risk
                  scores, flagged protocols, bug bounties, and more. Powered by
                  live platform data.
                </p>
              </div>

              {!isConfigured && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    AI chat requires an OpenAI API key. Contact your admin to
                    configure it.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {STARTER_QUESTIONS.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    disabled={isLoading || !isConfigured}
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 transition-all text-sm text-foreground/80 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 py-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === "user"
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-primary" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border/60 rounded-tl-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-0.5">
                    {formatContent(msg.content)}
                  </div>
                )}
                <p
                  className={`text-[10px] mt-2 ${
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
            <div className="flex gap-3 py-3">
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/20">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Querying protocol data…
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-card/60 backdrop-blur-sm px-4 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isConfigured
                ? "Ask about protocol security, audits, TVL, risks… (Enter to send)"
                : "AI chat not configured"
            }
            disabled={isLoading || !isConfigured}
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-32 text-sm bg-background border-border/60 focus-visible:ring-primary/40 disabled:opacity-50"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || !isConfigured}
            size="icon"
            className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="max-w-4xl mx-auto mt-2 text-[10px] text-muted-foreground/60 text-center">
          Data sourced from DeFiLlama · CertiK · Immunefi · DeFiJerusalem
        </p>
      </div>
    </div>
  );
}
