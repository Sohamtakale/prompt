/**
 * Tests for the 401 token-refresh retry logic in services/api.ts.
 *
 * The `request()` function should:
 *  1. Send the cached Firebase token on the first attempt.
 *  2. On a 401 response, force-refresh the token once and retry.
 *  3. NOT retry a second time (infinite-loop guard via _retry=false).
 *  4. On a non-401 error, throw ApiError without retrying.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Firebase mock ────────────────────────────────────────────────────────────
// Must be declared before importing api.ts so the module resolver picks it up.

const mockGetIdToken = vi.fn();
const mockCurrentUser = { getIdToken: mockGetIdToken };

vi.mock('../lib/firebase', () => ({
  auth: {
    get currentUser() {
      return mockCurrentUser;
    },
  },
}));

// ── fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── helpers ──────────────────────────────────────────────────────────────────

function makeResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('api request() — 401 retry logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: cached token available
    mockGetIdToken.mockResolvedValue('cached-token-abc');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the cached token on the first request', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { answer: 'ok', related_terms: [], grounding_sources: [] }));

    const { api } = await import('../services/api');
    await api.qa('What is ECI?');

    const [, options] = mockFetch.mock.calls[0];
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer cached-token-abc',
    });
    // getIdToken called with false (use cache)
    expect(mockGetIdToken).toHaveBeenCalledWith(false);
  });

  it('force-refreshes token and retries once on 401', async () => {
    // First call → 401, second call → 200
    mockFetch
      .mockResolvedValueOnce(makeResponse(401))
      .mockResolvedValueOnce(makeResponse(200, { answer: 'ok', related_terms: [], grounding_sources: [] }));

    // Force-refresh returns a new token
    mockGetIdToken
      .mockResolvedValueOnce('cached-token-abc')   // initial call (false)
      .mockResolvedValueOnce('refreshed-token-xyz') // force-refresh (true)
      .mockResolvedValueOnce('refreshed-token-xyz'); // retry call (false)

    const { api } = await import('../services/api');
    const result = await api.qa('What is ECI?');

    expect(result.answer).toBe('ok');
    // fetch called exactly twice (original + retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // getIdToken(true) was called for the force-refresh
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
  });

  it('does NOT retry a second time after the retry already failed with 401', async () => {
    // Both attempts return 401 — should throw, not loop forever
    mockFetch.mockResolvedValue(makeResponse(401));
    mockGetIdToken.mockResolvedValue('some-token');

    const { api } = await import('../services/api');

    await expect(api.qa('What is ECI?')).rejects.toBeDefined();

    // Exactly 2 fetch calls: original + one retry
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws ApiError with correct status on non-401 HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, 'Internal Server Error'));
    mockGetIdToken.mockResolvedValue('cached-token');

    const { api } = await import('../services/api');
    const { ApiError } = await import('../types');

    await expect(api.qa('What is ECI?')).rejects.toBeInstanceOf(ApiError);

    // No retry on 500
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('omits Authorization header when getIdToken returns null', async () => {
    // Simulate a user object whose token resolves to null (logged-out edge case)
    mockGetIdToken.mockResolvedValueOnce(null as unknown as string);

    mockFetch.mockResolvedValueOnce(makeResponse(200, { answer: 'ok', related_terms: [], grounding_sources: [] }));

    const { api } = await import('../services/api');
    await api.qa('What is ECI?');

    const [, options] = mockFetch.mock.calls[0];
    const headers = (options as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });
});
