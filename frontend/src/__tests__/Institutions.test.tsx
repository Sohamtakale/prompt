import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import InstitutionsPage from '../features/institutions/InstitutionsPage';

describe('InstitutionsPage', () => {
  it('renders the heading', () => {
    render(<MemoryRouter><InstitutionsPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Electoral Institutions');
  });

  it('renders institution cards as articles', () => {
    render(<MemoryRouter><InstitutionsPage /></MemoryRouter>);
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThanOrEqual(1);
  });

  it('expand button shows key powers on click', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><InstitutionsPage /></MemoryRouter>);

    const expandButtons = screen.getAllByRole('button', { name: /show key powers/i });
    await user.click(expandButtons[0]);

    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('quiz button calls onQuiz with institution name', async () => {
    const user = userEvent.setup();
    const onQuiz = vi.fn();
    render(<MemoryRouter><InstitutionsPage onQuiz={onQuiz} /></MemoryRouter>);

    const quizButtons = screen.getAllByRole('button', { name: /quiz me on/i });
    await user.click(quizButtons[0]);

    expect(onQuiz).toHaveBeenCalledTimes(1);
    expect(typeof onQuiz.mock.calls[0][0]).toBe('string');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MemoryRouter><InstitutionsPage /></MemoryRouter>);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
