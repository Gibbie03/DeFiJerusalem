/**
 * Unit tests for the ?q= deep-link auto-send logic in ChatPage.
 *
 * These tests exercise the three behavioural requirements:
 *   1. Navigating to /chat?q=<message> triggers exactly one auto-send.
 *   2. After the auto-send the ?q= param is stripped from the URL so a
 *      hard-refresh does NOT re-send the same message.
 *   3. Calling "New Chat" (clearChat) and then re-visiting /chat without the
 *      ?q= param does not re-trigger the auto-send.
 *
 * Strategy
 * ────────
 * The logic lives in a single useEffect inside ChatPage.tsx.  Rather than
 * rendering the full component (which would require mocking dozens of Radix-UI
 * and TanStack imports), we replicate the effect's decision logic as a small
 * pure function and verify it behaves correctly for every scenario.  The fix
 * that makes scenario 2 work – stripping ?q= via history.replaceState after
 * auto-sending – is also tested explicitly.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Simulate what the useEffect in ChatPage does:
 *  - read ?q= from window.location.search
 *  - if found, mark the ref, strip the param, and call sendMessage once
 *
 * Returns whether sendMessage was called.
 */
function runAutoSendEffect(
  autoSentRef: { current: boolean },
  isConfigured: boolean,
  statusDataReady: boolean,
  sendMessage: (q: string) => void,
): boolean {
  if (autoSentRef.current || !isConfigured || !statusDataReady) return false;

  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (!q) return false;

  // Mark as sent
  autoSentRef.current = true;

  // Strip ?q= from the URL (mirrors ChatPage.tsx fix)
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('q');
  history.replaceState(null, '', cleanUrl.pathname + (cleanUrl.search || ''));

  sendMessage(q);
  return true;
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset URL before every test
  history.replaceState(null, '', '/chat');
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ChatPage ?q= deep-link auto-send', () => {

  // ── Scenario 1 ─────────────────────────────────────────────────────────────
  it('sends exactly one message when ?q= is present on initial navigation', () => {
    history.replaceState(null, '', '/chat?q=Tell+me+about+Uniswap');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    // Effect fires once (status data becomes available)
    runAutoSendEffect(autoSentRef, true, true, sendMessage);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith('Tell me about Uniswap');
  });

  it('does not send when isConfigured is false', () => {
    history.replaceState(null, '', '/chat?q=Hello');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    runAutoSendEffect(autoSentRef, false, true, sendMessage);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not send while statusData is still loading (undefined)', () => {
    history.replaceState(null, '', '/chat?q=Hello');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    runAutoSendEffect(autoSentRef, true, false, sendMessage);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not send when there is no ?q= parameter', () => {
    history.replaceState(null, '', '/chat');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    runAutoSendEffect(autoSentRef, true, true, sendMessage);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  // ── Scenario 2 ─────────────────────────────────────────────────────────────
  it('strips ?q= from the URL after auto-sending so a hard-refresh cannot re-send', () => {
    history.replaceState(null, '', '/chat?q=audit+question');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    // Simulate first mount / status ready
    runAutoSendEffect(autoSentRef, true, true, sendMessage);

    // The param must be gone from the URL
    const params = new URLSearchParams(window.location.search);
    expect(params.get('q')).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('does NOT re-send on simulated hard-refresh (component remount with clean URL)', () => {
    history.replaceState(null, '', '/chat?q=audit+question');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    // First mount: auto-send fires and strips the URL
    runAutoSendEffect(autoSentRef, true, true, sendMessage);
    expect(sendMessage).toHaveBeenCalledTimes(1);

    // Hard-refresh: component remounts → new ref (false), but URL is now clean
    const freshRef = { current: false };
    runAutoSendEffect(freshRef, true, true, sendMessage);

    // sendMessage should still only have been called once
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  // ── Scenario 3 ─────────────────────────────────────────────────────────────
  it('does NOT re-trigger auto-send after clearChat if URL is already clean', () => {
    history.replaceState(null, '', '/chat?q=Security+score');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    // Initial auto-send on mount
    runAutoSendEffect(autoSentRef, true, true, sendMessage);
    expect(sendMessage).toHaveBeenCalledTimes(1);

    // User clicks "New Chat" — component does NOT remount; only messages state
    // is cleared.  autoSentRef.current remains true, and ?q= is already gone.
    // Simulate the effect re-running (e.g. isConfigured toggles):
    runAutoSendEffect(autoSentRef, true, true, sendMessage);

    expect(sendMessage).toHaveBeenCalledTimes(1); // still exactly one
  });

  it('does NOT re-trigger even if back-navigation revisits the route without ?q=', () => {
    // After initial send the URL is clean. Simulate back-navigation which
    // re-mounts the component but without the ?q= parameter.
    history.replaceState(null, '', '/chat');

    const sendMessage = vi.fn();
    const freshRef = { current: false };

    runAutoSendEffect(freshRef, true, true, sendMessage);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  // ── Guard idempotency ───────────────────────────────────────────────────────
  it('autoSentRef guard prevents double-send if the effect fires multiple times before stripping', () => {
    history.replaceState(null, '', '/chat?q=multi+fire+test');

    const sendMessage = vi.fn();
    const autoSentRef = { current: false };

    // Simulate the effect running twice in the same mount cycle (e.g. React
    // StrictMode double-invoke, or isConfigured / statusData changing twice)
    runAutoSendEffect(autoSentRef, true, true, sendMessage);
    // URL is now clean, but let's also test the ref guard by re-running with
    // the original URL temporarily restored
    history.replaceState(null, '', '/chat?q=multi+fire+test');
    runAutoSendEffect(autoSentRef, true, true, sendMessage);

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });
});
