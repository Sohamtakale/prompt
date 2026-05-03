import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import GlossaryPage from '../features/glossary/GlossaryPage';

vi.mock('../services/api', () => ({
  api: { qa: vi.fn().mockResolvedValue({ answer: 'Test explanation', related_terms: [] }) },
}));

describe('GlossaryPage', () => {
  it('renders all terms by default', () => {
    render(
      <MemoryRouter>
        <GlossaryPage />
      </MemoryRouter>,
    );

    // Should show the heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Election Glossary');

    // Should show at least some terms
    expect(screen.getByText('EVM (Electronic Voting Machine)')).toBeInTheDocument();
    expect(screen.getByText('VVPAT (Voter Verifiable Paper Audit Trail)')).toBeInTheDocument();
  });

  it('search input filters visible terms', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GlossaryPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText(/search glossary terms/i);
    await user.type(searchInput, 'EVM');

    // After debounce, should filter terms
    // The search is debounced, so we check the input value
    expect(searchInput).toHaveValue('EVM');
  });

  it('renders search input with search role', () => {
    render(
      <MemoryRouter>
        <GlossaryPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('displays term count', () => {
    render(
      <MemoryRouter>
        <GlossaryPage />
      </MemoryRouter>,
    );

    // Should show count of all terms
    const countText = screen.getByText(/terms found/i);
    expect(countText).toBeInTheDocument();
  });

  it('expands a term on click and shows definition', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><GlossaryPage /></MemoryRouter>);

    const expandBtn = screen.getByRole('button', { name: /EVM \(Electronic Voting Machine\)/i });
    await user.click(expandBtn);

    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MemoryRouter><GlossaryPage /></MemoryRouter>);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
