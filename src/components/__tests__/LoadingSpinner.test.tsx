import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = document.querySelector('.w-4');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with medium size', () => {
    render(<LoadingSpinner size="md" />);
    const spinner = document.querySelector('.w-8');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = document.querySelector('.w-12');
    expect(spinner).toBeInTheDocument();
  });

  it('displays loading text when provided', () => {
    render(<LoadingSpinner text="Loading events..." />);
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
  });

  it('does not display text when not provided', () => {
    render(<LoadingSpinner />);
    const textElements = screen.queryAllByText(/.+/);
    expect(textElements).toHaveLength(0);
  });
});
