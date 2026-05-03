/** Shared TypeScript types for VoteWise frontend. */

// ── API Response Types ──────────────────────────────────────────────

export interface QAResponse {
  answer: string;
  related_terms: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export type Verdict = 'TRUE' | 'FALSE' | 'PARTIALLY TRUE' | 'UNVERIFIABLE';

export interface MythCheckResponse {
  verdict: Verdict;
  explanation: string;
  confidence: number;
  source_hint: string;
}

export interface TranslateResponse {
  translated_text: string;
  detected_source: string;
}

// ── Static Data Types ───────────────────────────────────────────────

export interface TimelineStage {
  id: string;
  stage: string;
  description: string;
  key_body: string;
  typical_duration: string;
  citizen_action: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface Institution {
  id: string;
  name: string;
  abbreviation: string | null;
  constitutional_basis: string;
  composition: string;
  key_powers: string[];
  current_head: string;
  website: string;
}

export interface RegistrationStep {
  step: number;
  title: string;
  description: string;
  requirements: string[];
  action_items: string[];
  helpful_links: string[];
}

export interface PartyInfo {
  name: string;
  abbreviation: string;
  founded: number;
  symbol_description: string;
  alliance: string;
  key_policy_areas: string[];
  headquarters: string;
  website: string;
  states_strong_in: string[];
}

// ── API Error ───────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
