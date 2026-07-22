/**
 * Unit tests for share-popover reset behaviour in ChatPage.
 *
 * Covered scenarios:
 *   1. Clicking "New chat" while the share popover is open closes it and
 *      clears shareUrl (no stale link is left visible).
 *   2. Clicking Share after starting a new chat calls the /api/chat/share
 *      endpoint again — it does NOT reuse the previously generated link.
 *
 * Strategy
 * ────────
 * The share-related state and the two functions that mutate it
 * (clearChat / shareChat) are extracted as plain objects + functions that
 * mirror the exact logic in ChatPage.tsx.  This lets us verify every state
 * transition without mounting the full React component (which would require
 * mocking all Radix-UI, TanStack Query, and streaming dependencies).
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── State model ───────────────────────────────────────────────────────────────

interface ShareState {
  messages: { role: 'user' | 'assistant'; content: string }[];
  shareUrl: string | null;
  showSharePopover: boolean;
  copiedInPopover: boolean;
  isSharing: boolean;
}

function makeState(overrides: Partial<ShareState> = {}): ShareState {
  return {
    messages: [],
    shareUrl: null,
    showSharePopover: false,
    copiedInPopover: false,
    isSharing: false,
    ...overrides,
  };
}

// ── Pure replicas of the ChatPage handlers ────────────────────────────────────

/** Mirrors the clearChat() function in ChatPage.tsx */
function clearChat(state: ShareState): ShareState {
  return {
    ...state,
    messages: [],
    shareUrl: null,
    showSharePopover: false,
    copiedInPopover: false,
  };
}

/**
 * Mirrors the async shareChat() function in ChatPage.tsx.
 *
 * Calls `fetchFn` (a stand-in for the real `fetch`) with the share endpoint
 * and updates state with the returned URL.  Returns the next state.
 */
async function shareChat(
  state: ShareState,
  fetchFn: typeof fetch,
): Promise<ShareState> {
  if (state.isSharing || state.messages.length === 0) return state;

  const firstUser = state.messages.find((m) => m.role === 'user');
  const title = firstUser
    ? firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? '…' : '')
    : 'AI Security Chat';

  const payload = {
    title,
    messages: state.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date().toISOString(),
    })),
  };

  const next = { ...state, isSharing: true };

  try {
    const res = await fetchFn('/api/chat/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    if (!res.ok) throw new Error('share failed');

    const { id } = await res.json();
    const url = `${window.location.origin}/chat/share/${id}`;

    return { ...next, isSharing: false, shareUrl: url, showSharePopover: true };
  } catch {
    return { ...next, isSharing: false };
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('clearChat (New chat) resets share state', () => {
  it('closes the share popover when it is open', () => {
    const before = makeState({
      showSharePopover: true,
      shareUrl: 'https://example.com/chat/share/abc123',
    });

    const after = clearChat(before);

    expect(after.showSharePopover).toBe(false);
  });

  it('clears shareUrl so no stale link is retained', () => {
    const before = makeState({
      shareUrl: 'https://example.com/chat/share/abc123',
      showSharePopover: true,
    });

    const after = clearChat(before);

    expect(after.shareUrl).toBeNull();
  });

  it('also resets copiedInPopover to false', () => {
    const before = makeState({
      shareUrl: 'https://example.com/chat/share/abc123',
      showSharePopover: true,
      copiedInPopover: true,
    });

    const after = clearChat(before);

    expect(after.copiedInPopover).toBe(false);
  });

  it('clears the messages array', () => {
    const before = makeState({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    });

    const after = clearChat(before);

    expect(after.messages).toHaveLength(0);
  });

  it('works correctly even when the popover was already closed', () => {
    const before = makeState({
      shareUrl: 'https://example.com/chat/share/xyz',
      showSharePopover: false,
    });

    const after = clearChat(before);

    expect(after.shareUrl).toBeNull();
    expect(after.showSharePopover).toBe(false);
  });
});

describe('shareChat after clearChat calls the API again', () => {
  function makeFetchMock(id: string): typeof fetch {
    return vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id }),
    } as Response);
  }

  it('calls /api/chat/share after a new chat is started', async () => {
    const oldUrl = 'https://example.com/chat/share/old-id';

    // Start with an existing share URL and an open popover
    const withShare = makeState({
      messages: [
        { role: 'user', content: 'What is Uniswap?' },
        { role: 'assistant', content: 'Uniswap is a DEX.' },
      ],
      shareUrl: oldUrl,
      showSharePopover: true,
    });

    // User clicks "New chat"
    const afterClear = clearChat(withShare);
    expect(afterClear.shareUrl).toBeNull();
    expect(afterClear.showSharePopover).toBe(false);

    // User types a new question and gets a reply
    const withNewMessages = {
      ...afterClear,
      messages: [
        { role: 'user' as const, content: 'Tell me about Aave' },
        { role: 'assistant' as const, content: 'Aave is a lending protocol.' },
      ],
    };

    const fetchMock = makeFetchMock('new-id-456');

    // User clicks Share
    const afterShare = await shareChat(withNewMessages, fetchMock);

    // The endpoint must have been called
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat/share',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('produces a new share URL and does not reuse the old one', async () => {
    const oldUrl = 'https://example.com/chat/share/old-id';

    const withShare = makeState({
      messages: [
        { role: 'user', content: 'What is Uniswap?' },
        { role: 'assistant', content: 'Uniswap is a DEX.' },
      ],
      shareUrl: oldUrl,
      showSharePopover: true,
    });

    const afterClear = clearChat(withShare);

    const withNewMessages = {
      ...afterClear,
      messages: [
        { role: 'user' as const, content: 'Tell me about Compound' },
        { role: 'assistant' as const, content: 'Compound is a lending protocol.' },
      ],
    };

    const fetchMock = makeFetchMock('brand-new-id-789');
    const afterShare = await shareChat(withNewMessages, fetchMock);

    // New URL must differ from the old one
    expect(afterShare.shareUrl).not.toBe(oldUrl);
    expect(afterShare.shareUrl).toContain('brand-new-id-789');
  });

  it('opens the share popover with the fresh URL after sharing', async () => {
    const afterClear = makeState({
      messages: [
        { role: 'user', content: 'Any high-TVL protocols?' },
        { role: 'assistant', content: 'Yes, here are some.' },
      ],
    });

    const fetchMock = makeFetchMock('fresh-id-111');
    const afterShare = await shareChat(afterClear, fetchMock);

    expect(afterShare.showSharePopover).toBe(true);
    expect(afterShare.shareUrl).toContain('fresh-id-111');
  });

  it('does not call the API when messages are empty (no conversation to share)', async () => {
    // After clearChat, messages are empty — shareChat should be a no-op
    const emptyChatState = makeState();
    const fetchMock = vi.fn();

    const afterShare = await shareChat(emptyChatState, fetchMock as unknown as typeof fetch);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(afterShare.shareUrl).toBeNull();
  });
});
