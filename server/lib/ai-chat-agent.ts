import OpenAI from "openai";
import { storage } from "../storage";

// Lazy-initialized — the server starts cleanly without OPENAI_API_KEY.
// The key is read at call time so it picks up runtime env vars.
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_protocols",
      description:
        "Search DeFi protocols by name keyword, blockchain chain, or category. Returns a list of matching protocols with key security metrics.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Name keyword to search for (e.g. 'Aave', 'Uniswap')",
          },
          chain: {
            type: "string",
            description:
              "Filter by blockchain chain (e.g. 'Ethereum', 'Arbitrum', 'BSC')",
          },
          category: {
            type: "string",
            description:
              "Filter by protocol category (e.g. 'Lending', 'DEX', 'Yield')",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 10, max 25)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_protocol_detail",
      description:
        "Get full security details for a specific protocol by its ID or name, including TVL, security score, audit info, bug bounty status, and recent incidents.",
      parameters: {
        type: "object",
        properties: {
          protocol_id: {
            type: "string",
            description: "The protocol's ID or exact name",
          },
        },
        required: ["protocol_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_top_protocols",
      description:
        "List the top DeFi protocols ranked by a given metric: security score, TVL, or 24h volume.",
      parameters: {
        type: "object",
        properties: {
          ranked_by: {
            type: "string",
            enum: ["security", "tvl", "volume"],
            description: "Ranking metric",
          },
          limit: {
            type: "number",
            description: "Number of protocols to return (default 10, max 20)",
          },
          chain: {
            type: "string",
            description: "Optional: filter to a specific chain",
          },
          category: {
            type: "string",
            description: "Optional: filter to a specific category",
          },
        },
        required: ["ranked_by"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_flagged_protocols",
      description:
        "List protocols that have been flagged or blacklisted for security issues, scams, or exploits. Useful for identifying risky protocols.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max results to return (default 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_security_stats",
      description:
        "Get overall security statistics across all tracked DeFi protocols: total protocols, audited count, average security score, flagged count, TVL distribution.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// ─── Tool implementations ────────────────────────────────────────────────────

async function searchProtocols(args: {
  query?: string;
  chain?: string;
  category?: string;
  limit?: number;
}) {
  const { query, chain, category, limit = 10 } = args;
  const protocols = await storage.getProtocols({
    chain,
    category,
  });

  let results = protocols;
  if (query) {
    const q = query.toLowerCase();
    results = protocols.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }

  const capped = results.slice(0, Math.min(limit, 25));

  return capped.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    chains: p.chains,
    tvl: p.tvl,
    securityScore: p.securityScore,
    audited: p.audited,
    auditCount: p.auditCount,
    description: p.description,
    website: p.website,
  }));
}

async function getProtocolDetail(args: { protocol_id: string }) {
  const { protocol_id } = args;
  const protocols = await storage.getProtocols();

  // Try exact ID match first, then fuzzy name match
  let protocol =
    protocols.find((p) => p.id === protocol_id) ||
    protocols.find(
      (p) => p.name.toLowerCase() === protocol_id.toLowerCase()
    ) ||
    protocols.find((p) =>
      p.name.toLowerCase().includes(protocol_id.toLowerCase())
    );

  if (!protocol) {
    return { error: `Protocol "${protocol_id}" not found in the database.` };
  }

  const scan = await storage.getSecurityScan(protocol.id);

  return {
    id: protocol.id,
    name: protocol.name,
    category: protocol.category,
    chains: protocol.chains,
    tvl: protocol.tvl,
    volume24h: protocol.volume24h,
    change24h: protocol.change24h,
    securityScore: protocol.securityScore,
    audited: protocol.audited,
    auditCount: protocol.auditCount,
    auditNote: protocol.auditNote,
    auditLinks: protocol.auditLinks,
    description: protocol.description,
    website: protocol.website,
    twitter: protocol.twitter,
    github: protocol.github,
    age: protocol.age,
    defiSecurityScore: protocol.defiSecurityScore,
    defiHasMultisig: protocol.defiHasMultisig,
    defiHasTimelock: protocol.defiHasTimelock,
    defiAuditReports: protocol.defiAuditReports,
    securityScan: scan
      ? {
          severity: scan.severity,
          score: scan.score,
          isBlacklisted: scan.isBlacklisted,
          threats: scan.threats,
          scannedAt: scan.scannedAt,
        }
      : null,
  };
}

async function listTopProtocols(args: {
  ranked_by: "security" | "tvl" | "volume";
  limit?: number;
  chain?: string;
  category?: string;
}) {
  const { ranked_by, limit = 10, chain, category } = args;

  const protocols = await storage.getProtocols({ chain, category });

  const sorted = [...protocols].sort((a, b) => {
    if (ranked_by === "security") return b.securityScore - a.securityScore;
    if (ranked_by === "tvl") return b.tvl - a.tvl;
    if (ranked_by === "volume")
      return (b.volume24h || 0) - (a.volume24h || 0);
    return 0;
  });

  return sorted.slice(0, Math.min(limit, 20)).map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.name,
    category: p.category,
    chains: p.chains,
    tvl: p.tvl,
    volume24h: p.volume24h,
    securityScore: p.securityScore,
    audited: p.audited,
    auditCount: p.auditCount,
  }));
}

async function listFlaggedProtocols(args: { limit?: number }) {
  const { limit = 10 } = args;
  const blacklist = await storage.getBlacklist();

  return blacklist.slice(0, Math.min(limit, 25)).map((entry) => ({
    id: entry.id,
    name: entry.dappName,
    severity: entry.severity,
    threats: entry.threats,
    reason: entry.reason,
    status: entry.status,
    website: entry.website,
    flaggedAt: entry.timestamp,
  }));
}

async function getSecurityStats() {
  const protocols = await storage.getProtocols();
  const blacklist = await storage.getBlacklist();

  const audited = protocols.filter(
    (p) => p.audited || (p.auditCount && p.auditCount > 0)
  ).length;
  const avgScore =
    protocols.reduce((s, p) => s + p.securityScore, 0) / protocols.length;
  const totalTvl = protocols.reduce((s, p) => s + p.tvl, 0);

  const byCategory: Record<string, number> = {};
  protocols.forEach((p) => {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  });

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([cat, count]) => ({ category: cat, count }));

  return {
    totalProtocols: protocols.length,
    auditedProtocols: audited,
    auditedPercentage: ((audited / protocols.length) * 100).toFixed(1),
    averageSecurityScore: avgScore.toFixed(1),
    flaggedProtocols: blacklist.length,
    totalTvlUsd: totalTvl,
    topCategories,
    dataSource: "DeFiJerusalem aggregated from DeFiLlama, CertiK, Immunefi",
  };
}

// ─── Tool dispatcher ─────────────────────────────────────────────────────────

async function dispatchTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    let result: unknown;
    switch (name) {
      case "search_protocols":
        result = await searchProtocols(args as Parameters<typeof searchProtocols>[0]);
        break;
      case "get_protocol_detail":
        result = await getProtocolDetail(args as Parameters<typeof getProtocolDetail>[0]);
        break;
      case "list_top_protocols":
        result = await listTopProtocols(args as Parameters<typeof listTopProtocols>[0]);
        break;
      case "list_flagged_protocols":
        result = await listFlaggedProtocols(args as Parameters<typeof listFlaggedProtocols>[0]);
        break;
      case "get_security_stats":
        result = await getSecurityStats();
        break;
      default:
        result = { error: `Unknown tool: ${name}` };
    }
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the DeFiJerusalem Security AI — an expert assistant specializing in DeFi protocol security analysis.

DeFiJerusalem is a security aggregation platform that tracks hundreds of DeFi protocols. You have access to live data including:
- Protocol TVL (Total Value Locked), trading volume, and price changes
- Security scores (0–100 scale, higher is safer)
- Audit history (which protocols have been audited, by whom, audit links)
- Bug bounty programs via Immunefi
- Flagged/blacklisted protocols (scams, exploits, rug pulls)
- CertiK security data where available
- On-chain security signals (multisig, timelocks)

Your role is to help users:
1. Assess the security of specific DeFi protocols
2. Compare protocols by safety metrics
3. Discover well-audited or high-security protocols
4. Identify risky or flagged protocols to avoid
5. Understand DeFi security concepts (audits, bug bounties, TVL, etc.)

Guidelines:
- Always use the available tools to pull live data before answering
- Be specific: cite security scores, audit counts, TVL figures
- Flag risks clearly — if a protocol has no audits, low score, or is blacklisted, say so plainly
- When comparing protocols, use concrete numbers
- Mention data sources (DeFiLlama for TVL, CertiK for security scores, Immunefi for bug bounties)
- Keep responses concise but complete — use bullet points for lists
- If data is missing or unavailable, say so rather than guessing
- You do NOT provide financial advice or investment recommendations`;

// ─── Main agent function ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function runChatAgent(
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const openai = getOpenAI(); // throws if key not set

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Agentic loop — up to 6 tool-call rounds
  for (let round = 0; round < 6; round++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1500,
      temperature: 0.3,
    });

    const choice = response.choices[0];
    const msg = choice.message;

    // Push assistant message (with any tool_calls) into the thread
    messages.push(msg as OpenAI.Chat.ChatCompletionMessageParam);

    if (choice.finish_reason === "stop" || !msg.tool_calls?.length) {
      return msg.content ?? "";
    }

    // Execute all requested tool calls in parallel
    const toolResults = await Promise.all(
      msg.tool_calls.map(async (tc) => {
        const fnCall = (tc as { id: string; function: { name: string; arguments: string } });
        const args = JSON.parse(fnCall.function.arguments || "{}");
        const result = await dispatchTool(fnCall.function.name, args);
        return {
          role: "tool" as const,
          tool_call_id: fnCall.id,
          content: result,
        };
      })
    );

    messages.push(...toolResults);
  }

  // Fallback: one final call without tools
  const fallback = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1500,
    temperature: 0.3,
  });

  return fallback.choices[0].message.content ?? "I was unable to generate a response.";
}
