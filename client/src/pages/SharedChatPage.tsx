import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bot, User, AlertTriangle, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SharedMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: SharedMessage[];
  createdAt: string;
  expiresAt: string;
}

function formatContent(text: string) {
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

export default function SharedChatPage() {
  const { id } = useParams<{ id: string }>();

  const { data: session, isLoading, isError } = useQuery<ChatSession>({
    queryKey: [`/api/chat/share/${id}`],
    enabled: Boolean(id),
    retry: false,
  });

  const expiresAt = session ? new Date(session.expiresAt) : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

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
                {session?.title ?? "Shared Conversation"}
              </h1>
              <p className="text-xs text-muted-foreground">
                DeFiJerusalem Security AI · Read-only
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {daysLeft !== null && (
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="w-3 h-3" />
                Expires in {daysLeft}d
              </Badge>
            )}
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                New chat
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-1">
          {isLoading && (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
              Loading conversation…
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Conversation not found
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  This shared conversation may have expired (links are valid for 7 days) or the link may be incorrect.
                </p>
              </div>
              <Link href="/chat">
                <Button variant="outline" size="sm">
                  Start a new chat
                </Button>
              </Link>
            </div>
          )}

          {session?.messages.map((msg, idx) => (
            <div
              key={idx}
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
                  <div className="space-y-0.5">{formatContent(msg.content)}</div>
                )}
                <p
                  className={`text-[10px] mt-2 ${
                    msg.role === "user"
                      ? "text-primary-foreground/60 text-right"
                      : "text-muted-foreground"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-card/60 backdrop-blur-sm px-4 py-3 shrink-0">
        <p className="max-w-4xl mx-auto text-[10px] text-muted-foreground/60 text-center">
          This is a read-only shared conversation · Data sourced from DeFiLlama · CertiK · Immunefi · DeFiJerusalem
        </p>
      </div>
    </div>
  );
}
