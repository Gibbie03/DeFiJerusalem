/**
 * Unit tests for the AI response cache in server/lib/ai-chat-agent.ts
 *
 * Covered scenarios:
 *   1. Cache hit  — repeated question returns the stored response without
 *                   calling OpenAI a second time.
 *   2. Cache miss — a new question calls OpenAI and stores the result.
 *   3. TTL expiry — a cached response that has expired causes a fresh
 *                   OpenAI call instead of returning stale data.
 *   4. CHAT_CACHE_TTL_SECONDS — env var is read at write time and controls
 *                               when the entry expires.
 *
 * Strategy
 * ────────
 * The OpenAI client is mocked so these tests run without a real API key.
 * The storage layer is also mocked so no database connection is required.
 * Fake timers let us advance the clock to test TTL expiry without sleeping.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

// ── Mock DB (must come before any server module import) ───────────────────────

vi.mock('../server/db', () => ({
  db: {},
  pool: { on: vi.fn() },
}));

// ── Mock storage ──────────────────────────────────────────────────────────────

vi.mock('../server/storage', () => ({
  storage: {
    getProtocols: vi.fn().mockResolvedValue([]),
    getBlacklist: vi.fn().mockResolvedValue([]),
    getSecurityScan: vi.fn().mockResolvedValue(null),
  },
}));

// ── Mock the OpenAI SDK ───────────────────────────────────────────────────────

// vi.hoisted ensures mockCreate is defined before the vi.mock factory runs
// (vi.mock calls are hoisted to the top of the file by Vitest's transformer).
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('openai', () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  }
  return { default: MockOpenAI };
});

// ── Import the module under test AFTER all mocks are registered ───────────────

const { runChatAgent, invalidateAICache } = await import(
  '../server/lib/ai-chat-agent'
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal OpenAI response that makes runChatAgent return a plain text reply. */
function makeOpenAIResponse(content: string) {
  return {
    choices: [
      {
        finish_reason: 'stop',
        message: { role: 'assistant', content, tool_calls: null },
      },
    ],
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('AI response cache', () => {
  beforeEach(() => {
    // Ensure a fresh key for OPENAI_API_KEY so getOpenAI() doesn't throw.
    process.env.OPENAI_API_KEY = 'test-key';

    // Always start with an empty cache.
    invalidateAICache();

    // Reset the OpenAI mock call counter.
    mockCreate.mockReset();
  });

  afterEach(() => {
    // Restore real timers in case a test used fake timers.
    vi.useRealTimers();

    // Clean up env overrides.
    delete process.env.CHAT_CACHE_TTL_SECONDS;
  });

  // ── 1. Cache hit ─────────────────────────────────────────────────────────────

  it('returns the cached response without calling OpenAI a second time', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse('Aave is well-audited.'));

    const question = 'Is Aave safe?';
    const history: [] = [];

    // First call — cache miss; OpenAI must be invoked.
    const first = await runChatAgent(question, history);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(first).toBe('Aave is well-audited.');

    // Second call — identical question + history; should hit the cache.
    const second = await runChatAgent(question, history);
    expect(mockCreate).toHaveBeenCalledTimes(1); // still 1 — no new call
    expect(second).toBe('Aave is well-audited.');
  });

  // ── 2. Cache miss ────────────────────────────────────────────────────────────

  it('calls OpenAI and stores the result on a cache miss', async () => {
    mockCreate.mockResolvedValue(makeOpenAIResponse('Compound is audited.'));

    const result = await runChatAgent('Tell me about Compound.', []);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result).toBe('Compound is audited.');

    // A different question must also call OpenAI (separate key).
    mockCreate.mockResolvedValue(makeOpenAIResponse('Uniswap has high TVL.'));
    const result2 = await runChatAgent('Tell me about Uniswap.', []);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result2).toBe('Uniswap has high TVL.');
  });

  // ── 3. History is part of the cache key ──────────────────────────────────────

  it('treats different conversation histories as distinct cache entries', async () => {
    mockCreate
      .mockResolvedValueOnce(makeOpenAIResponse('Answer A'))
      .mockResolvedValueOnce(makeOpenAIResponse('Answer B'));

    const question = 'What is the risk?';
    const historyA = [{ role: 'user' as const, content: 'Context A' }];
    const historyB = [{ role: 'user' as const, content: 'Context B' }];

    const a = await runChatAgent(question, historyA);
    const b = await runChatAgent(question, historyB);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(a).toBe('Answer A');
    expect(b).toBe('Answer B');
  });

  // ── 4. TTL expiry triggers a fresh OpenAI call ────────────────────────────────

  it('makes a fresh OpenAI call after the TTL has elapsed', async () => {
    // Use a 10-second TTL for this test.
    process.env.CHAT_CACHE_TTL_SECONDS = '10';

    vi.useFakeTimers();

    mockCreate
      .mockResolvedValueOnce(makeOpenAIResponse('First response'))
      .mockResolvedValueOnce(makeOpenAIResponse('Fresh response'));

    const question = 'What protocols are safe?';

    // First call — populates the cache.
    const first = await runChatAgent(question, []);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(first).toBe('First response');

    // Advance clock past the TTL (10 s → 11 s forward).
    vi.advanceTimersByTime(11_000);

    // Second call — cache entry has expired; OpenAI must be called again.
    const second = await runChatAgent(question, []);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(second).toBe('Fresh response');
  });

  // ── 5. CHAT_CACHE_TTL_SECONDS env var is respected ───────────────────────────

  it('respects a long TTL set via CHAT_CACHE_TTL_SECONDS', async () => {
    // 60-second TTL.
    process.env.CHAT_CACHE_TTL_SECONDS = '60';

    vi.useFakeTimers();

    mockCreate.mockResolvedValue(makeOpenAIResponse('Cached answer'));

    const question = 'How safe is dYdX?';

    await runChatAgent(question, []);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // Advance 59 s — still within TTL.
    vi.advanceTimersByTime(59_000);

    await runChatAgent(question, []);
    // Still cached — no second call.
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // Advance 2 more seconds — now past the 60 s TTL.
    vi.advanceTimersByTime(2_000);

    mockCreate.mockResolvedValue(makeOpenAIResponse('Refreshed answer'));
    const fresh = await runChatAgent(question, []);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(fresh).toBe('Refreshed answer');
  });

  // ── 6. invalidateAICache clears stored entries ────────────────────────────────

  it('invalidateAICache causes the next call to hit OpenAI again', async () => {
    mockCreate
      .mockResolvedValueOnce(makeOpenAIResponse('Original answer'))
      .mockResolvedValueOnce(makeOpenAIResponse('Post-invalidation answer'));

    const question = 'What is Curve TVL?';

    await runChatAgent(question, []);
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // Explicitly invalidate all cached entries.
    invalidateAICache();

    const second = await runChatAgent(question, []);
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(second).toBe('Post-invalidation answer');
  });

  // ── 7. Entry cap is enforced — Map never exceeds MAX_CACHE_ENTRIES ───────────

  it('never exceeds the MAX_CACHE_ENTRIES cap under sustained load', async () => {
    // Set a very small cap so the test runs quickly.
    process.env.MAX_CACHE_ENTRIES = '5';

    // Each unique question produces a unique cache key, forcing new insertions.
    // Use a long TTL so entries never expire during this test.
    process.env.CHAT_CACHE_TTL_SECONDS = '3600';

    // Provide enough mock responses for all the unique questions.
    const TOTAL_QUESTIONS = 20;
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      mockCreate.mockResolvedValueOnce(makeOpenAIResponse(`Answer ${i}`));
    }

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      await runChatAgent(`Unique question number ${i}`, []);
    }

    // The Map must never have grown past the cap.
    // invalidateAICache reports the size at clear-time — instead, check via
    // repeated cache-hit behaviour: after 20 inserts with cap=5, only the
    // 5 most-recently inserted keys should still be present.
    // We verify indirectly: ask for the LAST 5 questions — they must be cached
    // (no new OpenAI call), and asking for an early question must miss.
    mockCreate.mockReset();

    // The last 5 questions (indices 15–19) should still be in cache.
    for (let i = TOTAL_QUESTIONS - 5; i < TOTAL_QUESTIONS; i++) {
      await runChatAgent(`Unique question number ${i}`, []);
    }
    // None of those triggered a new OpenAI call (all were cache hits).
    expect(mockCreate).toHaveBeenCalledTimes(0);

    // The very first question (index 0) must have been evicted.
    mockCreate.mockResolvedValueOnce(makeOpenAIResponse('Evicted answer'));
    await runChatAgent('Unique question number 0', []);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    // Clean up MAX_CACHE_ENTRIES between tests.
    delete process.env.MAX_CACHE_ENTRIES;
  });

  // ── 8. Multi-round: tool call followed by final answer ───────────────────────

  /**
   * Simulates the two-round agentic loop:
   *   Round 1 — OpenAI requests a tool call (finish_reason: 'tool_calls').
   *   Round 2 — OpenAI uses the tool result and returns the final answer.
   *
   * Verifies:
   *   a) The tool result message is included in the messages array sent on the
   *      second OpenAI call (i.e. the thread is threaded correctly).
   *   b) The final answer — not the intermediate tool-call assistant message —
   *      is what gets cached and returned to the caller.
   *   c) A subsequent identical call returns the cached final answer without
   *      calling OpenAI again.
   */
  it('threads tool results into the second call and caches the final answer', async () => {
    const TOOL_CALL_ID = 'call_abc123';
    const TOOL_NAME = 'get_security_stats';

    // Round 1 response: assistant requests a tool call
    const toolCallResponse = {
      choices: [
        {
          finish_reason: 'tool_calls',
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: TOOL_CALL_ID,
                type: 'function',
                function: {
                  name: TOOL_NAME,
                  arguments: '{}',
                },
              },
            ],
          },
        },
      ],
    };

    // Round 2 response: assistant provides the final answer
    const finalResponse = makeOpenAIResponse(
      'There are 42 protocols tracked; average security score is 78.'
    );

    mockCreate
      .mockResolvedValueOnce(toolCallResponse)
      .mockResolvedValueOnce(finalResponse);

    const question = 'Give me an overview of DeFi security stats.';
    const result = await runChatAgent(question, []);

    // (a) OpenAI must have been called exactly twice
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // (b) The second call's messages array must contain a tool-role message
    //     whose tool_call_id matches the one the agent requested
    const secondCallMessages: Array<{ role: string; tool_call_id?: string }> =
      mockCreate.mock.calls[1][0].messages;

    const toolResultMsg = secondCallMessages.find(
      (m) => m.role === 'tool' && m.tool_call_id === TOOL_CALL_ID
    );
    expect(toolResultMsg).toBeDefined();

    // (c) The return value must be the final answer, not the tool-call message
    expect(result).toBe(
      'There are 42 protocols tracked; average security score is 78.'
    );

    // (d) A repeated call must hit the cache (no third OpenAI call)
    const cached = await runChatAgent(question, []);
    expect(mockCreate).toHaveBeenCalledTimes(2); // still 2
    expect(cached).toBe(result);
  });

  // ── 9. Multi-round: tool result content is present in the second call ─────────

  /**
   * Verifies that the actual JSON content returned by the tool dispatcher
   * is included verbatim in the tool-role message threaded into round 2.
   *
   * The storage mock returns an empty protocols/blacklist list, so
   * getSecurityStats will produce a deterministic JSON payload we can
   * assert against.
   */
  it('includes the tool result content in the messages sent on the second round', async () => {
    const TOOL_CALL_ID = 'call_def456';

    const toolCallResponse = {
      choices: [
        {
          finish_reason: 'tool_calls',
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: TOOL_CALL_ID,
                type: 'function',
                function: {
                  name: 'get_security_stats',
                  arguments: '{}',
                },
              },
            ],
          },
        },
      ],
    };

    mockCreate
      .mockResolvedValueOnce(toolCallResponse)
      .mockResolvedValueOnce(makeOpenAIResponse('Stats delivered.'));

    await runChatAgent('Show security stats.', []);

    expect(mockCreate).toHaveBeenCalledTimes(2);

    const secondCallMessages: Array<{ role: string; content?: string; tool_call_id?: string }> =
      mockCreate.mock.calls[1][0].messages;

    const toolMsg = secondCallMessages.find(
      (m) => m.role === 'tool' && m.tool_call_id === TOOL_CALL_ID
    );

    // The content must be valid JSON (the serialised tool result)
    expect(toolMsg).toBeDefined();
    expect(() => JSON.parse(toolMsg!.content!)).not.toThrow();

    // The parsed payload must have the shape returned by getSecurityStats
    const parsed = JSON.parse(toolMsg!.content!);
    expect(parsed).toHaveProperty('totalProtocols');
    expect(parsed).toHaveProperty('flaggedProtocols');
  });
});
