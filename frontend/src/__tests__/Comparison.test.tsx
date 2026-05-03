import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import ComparisonPage from '../features/comparison/ComparisonPage';

describe('ComparisonPage', () => {
  it('renders the heading', () => {
    render(<MemoryRouter><ComparisonPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Political Parties');
  });

  it('renders party cards', () => {
    render(<MemoryRouter><ComparisonPage /></MemoryRouter>);
    const articles = screen.getAllByRole('article');
    expect(articles.length).toBeGreaterThan(0);
  });

  it('renders state filter dropdown', () => {
    render(<MemoryRouter><ComparisonPage /></MemoryRouter>);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('filters parties when state is selected', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ComparisonPage /></MemoryRouter>);

    const initialCount = screen.getAllByRole('article').length;
    const select = screen.getByRole('combobox');

    // Get first non-empty option
    const options = screen.getAllByRole('option');
    const firstState = options.find((o) => (o as HTMLOptionElement).value !== '');
    if (firstState) {
      await user.selectOptions(select, (firstState as HTMLOptionElement).value);
      const filteredCount = screen.queryAllByRole('article').length;
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  it('shows either party cards or empty state — never a blank page', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ComparisonPage /></MemoryRouter>);

    const select = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');
    const lastState = options[options.length - 1] as HTMLOptionElement;

    await user.selectOptions(select, lastState.value);

    const articles = screen.queryAllByRole('article');
    const emptyState = screen.queryByRole('status');
    // After filtering, the page must show cards OR an explicit empty state — not nothing
    expect(articles.length > 0 || emptyState !== null).toBe(true);
  });

  it('renders political neutrality disclaimer', () => {
    render(<MemoryRouter><ComparisonPage /></MemoryRouter>);
    expect(screen.getByText(/politically neutral/i)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MemoryRouter><ComparisonPage /></MemoryRouter>);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
