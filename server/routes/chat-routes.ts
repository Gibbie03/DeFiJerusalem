import type { Express, Request, Response } from "express";
import { runChatAgent, type ChatMessage } from "../lib/ai-chat-agent";
import { storage } from "../storage";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .default([]),
});

const shareRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        timestamp: z.string(),
      })
    )
    .min(2)
    .max(40),
  title: z.string().max(200).default("AI Security Chat"),
});

export function registerChatRoutes(app: Express): void {
  // POST /api/chat  — main AI agent endpoint
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const parsed = chatRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.flatten(),
        });
      }

      const { message, history } = parsed.data;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          error:
            "AI chat is not configured yet. An OPENAI_API_KEY is required.",
        });
      }

      const reply = await runChatAgent(message, history as ChatMessage[]);

      res.json({ reply });
    } catch (err) {
      console.error("[AI-CHAT] Error:", err);
      const message =
        err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: `AI agent error: ${message}` });
    }
  });

  // GET /api/chat/status — check if AI is configured
  app.get("/api/chat/status", (_req: Request, res: Response) => {
    res.json({ configured: Boolean(process.env.OPENAI_API_KEY) });
  });

  // POST /api/chat/share — save a conversation and return its share URL
  app.post("/api/chat/share", async (req: Request, res: Response) => {
    try {
      const parsed = shareRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parsed.error.flatten(),
        });
      }

      const { messages, title } = parsed.data;
      const session = await storage.createChatSession(messages, title);

      // Fire-and-forget: purge expired rows opportunistically on each share request
      storage.deleteExpiredChatSessions().then(count => {
        if (count > 0) {
          console.log(`[AI-CHAT] Cleaned up ${count} expired chat session(s)`);
        }
      }).catch(err => {
        console.error("[AI-CHAT] Failed to clean up expired chat sessions:", err);
      });

      res.json({ id: session.id, expiresAt: session.expiresAt });
    } catch (err) {
      console.error("[AI-CHAT] Share error:", err);
      res.status(500).json({ error: "Failed to save conversation" });
    }
  });

  // GET /api/admin/chat/sessions/stats — return total and expired chat session counts
  app.get("/api/admin/chat/sessions/stats", async (_req: Request, res: Response) => {
    try {
      const counts = await storage.countChatSessions();
      res.json(counts);
    } catch (err) {
      console.error("[AI-CHAT] Stats error:", err);
      res.status(500).json({ error: "Failed to fetch chat session stats" });
    }
  });

  // POST /api/admin/chat/cleanup — manually trigger expired chat session cleanup (admin only)
  app.post("/api/admin/chat/cleanup", async (req: Request, res: Response) => {
    try {
      const count = await storage.deleteExpiredChatSessions();
      res.json({ deleted: count, message: `Deleted ${count} expired chat session(s)` });
    } catch (err) {
      console.error("[AI-CHAT] Manual cleanup error:", err);
      res.status(500).json({ error: "Failed to clean up expired sessions" });
    }
  });

  // GET /api/chat/share/:id — retrieve a shared conversation
  app.get("/api/chat/share/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const session = await storage.getChatSession(id);

      if (!session) {
        return res.status(404).json({ error: "Conversation not found or has expired" });
      }

      res.json(session);
    } catch (err) {
      console.error("[AI-CHAT] Retrieve share error:", err);
      res.status(500).json({ error: "Failed to retrieve conversation" });
    }
  });
}
