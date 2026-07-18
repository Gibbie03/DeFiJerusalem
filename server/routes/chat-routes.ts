import type { Express, Request, Response } from "express";
import { runChatAgent, type ChatMessage } from "../lib/ai-chat-agent";
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
}
