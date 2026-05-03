import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { MemoryRouter } from 'react-router-dom';
import TimelinePage from '../features/timeline/TimelinePage';

describe('TimelinePage', () => {
  it('renders all 7 stages', () => {
    render(
      <MemoryRouter>
        <TimelinePage />
      </MemoryRouter>,
    );

    // Each stage appears twice (desktop + mobile views), so use getAllByText
    expect(screen.getAllByText('Election Announcement').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Nomination Filing').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Election Campaign').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Polling Day').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Vote Counting').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Results Declaration').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('New Government Formation').length).toBeGreaterThanOrEqual(1);
  });

  it('renders with accessible heading', () => {
    render(
      <MemoryRouter>
        <TimelinePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Election Timeline');
  });

  it('has list structure for stages', () => {
    render(
      <MemoryRouter>
        <TimelinePage />
      </MemoryRouter>,
    );

    const lists = screen.getAllByRole('list');
    expect(lists.length).toBeGreaterThan(0);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <TimelinePage />
      </MemoryRouter>,
    );
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
