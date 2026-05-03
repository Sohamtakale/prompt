import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MythCheckPage from '../features/mythcheck/MythCheckPage';

describe('MythCheckPage', () => {
  it('renders the myth check form', () => {
    render(
      <MemoryRouter>
        <MythCheckPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Myth Check');
    expect(screen.getByLabelText(/enter a claim/i)).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(
      <MemoryRouter>
        <MythCheckPage />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole('button', { name: /verify claim/i });
    expect(submitButton).toBeDisabled();
  });

  it('character counter updates on input', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MythCheckPage />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/enter a claim/i);
    await user.type(textarea, 'Hello');

    expect(screen.getByText('5 / 500')).toBeInTheDocument();
  });

  it('submit button enables when input has enough characters', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MythCheckPage />
      </MemoryRouter>,
    );

    const textarea = screen.getByLabelText(/enter a claim/i);
    await user.type(textarea, 'EVMs are used in elections');

    const submitButton = screen.getByRole('button', { name: /verify claim/i });
    expect(submitButton).not.toBeDisabled();
  });
});
