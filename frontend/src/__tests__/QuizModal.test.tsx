import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import QuizModal from '../components/QuizModal/QuizModal';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    quiz: vi.fn().mockResolvedValue([
      {
        question: 'What does EVM stand for?',
        options: [
          'Electronic Voting Machine',
          'Electoral Vote Monitor',
          'Election Verification Method',
          'Electronic Vote Meter',
        ],
        correct_index: 0,
        explanation: 'EVM stands for Electronic Voting Machine.',
      },
      {
        question: 'When was VVPAT made mandatory?',
        options: ['2015', '2017', '2019', '2021'],
        correct_index: 2,
        explanation: 'VVPAT was made mandatory in all elections from 2019.',
      },
    ]),
  },
}));

describe('QuizModal', () => {
  it('renders when isOpen is true', async () => {
    const onClose = vi.fn();
    render(<QuizModal topic="ECI" isOpen={true} onClose={onClose} />);

    // Should show the quiz dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Quiz: ECI/)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const onClose = vi.fn();
    render(<QuizModal topic="ECI" isOpen={false} onClose={onClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QuizModal topic="ECI" isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText(/close quiz/i);
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QuizModal topic="ECI" isOpen={true} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows first question after loading', async () => {
    render(<QuizModal topic="ECI" isOpen={true} onClose={vi.fn()} />);

    // Wait for the question to appear
    expect(await screen.findByText('What does EVM stand for?')).toBeInTheDocument();
  });

  it('allows selecting an answer option', async () => {
    const user = userEvent.setup();
    render(<QuizModal topic="ECI" isOpen={true} onClose={vi.fn()} />);

    await screen.findByText('What does EVM stand for?');

    const options = screen.getAllByRole('button', { name: /Electronic/i });
    await user.click(options[0]);

    // Confirm button should appear
    expect(screen.getByRole('button', { name: /confirm answer/i })).toBeInTheDocument();
  });

  it('shows correct/incorrect feedback after confirming', async () => {
    const user = userEvent.setup();
    render(<QuizModal topic="ECI" isOpen={true} onClose={vi.fn()} />);

    await screen.findByText('What does EVM stand for?');

    // Select the correct answer (index 0 = "Electronic Voting Machine")
    const firstOption = screen.getAllByRole('button')[0];
    await user.click(firstOption);

    const confirmBtn = screen.getByRole('button', { name: /confirm answer/i });
    await user.click(confirmBtn);

    // Explanation should appear
    expect(screen.getByText(/EVM stands for Electronic Voting Machine/i)).toBeInTheDocument();
  });
});
