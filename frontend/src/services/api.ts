/**
 * Typed API client for VoteWise backend.
 * All fetch calls go through this module.
 */

import type {
  QAResponse,
  QuizQuestion,
  MythCheckResponse,
  TranslateResponse,
} from '../types';
import { ApiError } from '../types';

import { auth } from '../lib/firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 30_000;

async function getAuthHeader(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  // forceRefresh=false: use cached token if still valid (Firebase refreshes automatically
  // before expiry). On a 401 response we retry with forceRefresh=true — see request().
  return user.getIdToken(false);
}

async function request<T>(path: string, options?: RequestInit, _retry = true): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = await getAuthHeader();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options?.headers },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // On 401: the cached token may have been revoked. Force-refresh once and retry.
  if (response.status === 401 && _retry && auth.currentUser) {
    await auth.currentUser.getIdToken(true);
    return request<T>(path, options, false);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(response.status, errorText);
  }

  return response.json() as Promise<T>;
}

export const api = {
  /** Ask a question about Indian elections. */
  qa: async (question: string, context?: string): Promise<QAResponse> => {
    return request<QAResponse>('/api/qa', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    });
  },

  /** Generate a multiple-choice quiz on a given topic. */
  quiz: async (topic: string, count = 4): Promise<QuizQuestion[]> => {
    return request<QuizQuestion[]>('/api/quiz', {
      method: 'POST',
      body: JSON.stringify({ topic, count }),
    });
  },

  /** Fact-check a claim about Indian elections. */
  mythCheck: async (claim: string): Promise<MythCheckResponse> => {
    return request<MythCheckResponse>('/api/mythcheck', {
      method: 'POST',
      body: JSON.stringify({ claim }),
    });
  },

  /** Translate text between English and Hindi. */
  translate: async (
    text: string,
    targetLang: 'hi' | 'en',
  ): Promise<TranslateResponse> => {
    return request<TranslateResponse>('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_lang: targetLang }),
    });
  },

  /** Send a chat message with history, returns assistant reply. */
  chat: async (messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> => {
    const res = await request<{ reply: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
    return res.reply;
  },

  /** Convert text to speech, returns base64 MP3 audio. */
  tts: async (text: string, languageCode: 'en-IN' | 'hi-IN' = 'en-IN'): Promise<string> => {
    const res = await request<{ audio_base64: string; language_code: string }>('/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text, language_code: languageCode }),
    });
    return res.audio_base64;
  },
};
