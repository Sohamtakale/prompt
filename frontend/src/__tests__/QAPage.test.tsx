import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import QAPage from '../features/qa/QAPage';

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', translate: (t: string) => Promise.resolve(t), isTranslating: false }),
}));

vi.mock('../services/api', () => ({
  api: {
    tts: vi.fn().mockResolvedValue(''),
    qa: vi.fn().mockResolvedValue({
      answer: 'The Election Commission of India is a constitutional body that supervises elections.',
      related_terms: ['ECI', 'Election Commission'],
      grounding_sources: ['https://eci.gov.in'],
    }),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <QAPage />
    </MemoryRouter>,
  );
}

describe('QAPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ask VoteWise');
  });

  it('renders the question textarea with label', () => {
    renderPage();
    expect(screen.getByLabelText(/ask your election question/i)).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /get answer/i })).toBeDisabled();
  });

  it('submit button disabled when fewer than 3 chars', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/ask your election question/i), 'ab');
    expect(screen.getByRole('button', { name: /get answer/i })).toBeDisabled();
  });

  it('submit button enables with valid input', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/ask your election question/i), 'What is ECI?');
    expect(screen.getByRole('button', { name: /get answer/i })).not.toBeDisabled();
  });

  it('character counter updates on input', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/ask your election question/i), 'Hello');
    expect(screen.getByText('5 / 500')).toBeInTheDocument();
  });

  it('shows answer and related terms after submission', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/ask your election question/i), 'What is ECI?');
    await user.click(screen.getByRole('button', { name: /get answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Election Commission of India is a constitutional body/i)).toBeInTheDocument();
    });

    expect(screen.getByText('ECI')).toBeInTheDocument();
    expect(screen.getByText('Election Commission')).toBeInTheDocument();
  });

  it('shows grounding sources after successful answer', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/ask your election question/i), 'What is ECI?');
    await user.click(screen.getByRole('button', { name: /get answer/i }));

    await waitFor(() => {
      expect(screen.getByText('https://eci.gov.in')).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    const { api } = await import('../services/api');
    vi.mocked(api.qa).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/ask your election question/i), 'What is ECI?');
    await user.click(screen.getByRole('button', { name: /get answer/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    });
  });

  it('adds question to history after successful answer', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/ask your election question/i), 'What is ECI?');
    await user.click(screen.getByRole('button', { name: /get answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Recent Questions/i)).toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderPage();
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
