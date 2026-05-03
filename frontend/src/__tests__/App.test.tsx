import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the app with skip link', () => {
    render(<App />);

    // Skip link is in the DOM
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('skip-to-content link is an anchor pointing to main-content', () => {
    render(<App />);

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink.tagName).toBe('A');
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders main content area', () => {
    render(<App />);

    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<App />);

    expect(screen.getAllByText('Timeline').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Register').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Glossary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Myth Check').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Institutions').length).toBeGreaterThanOrEqual(1);
  });
});
