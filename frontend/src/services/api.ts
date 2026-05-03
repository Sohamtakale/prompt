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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Add Firebase ID token if user is logged in
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

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
};
