import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../Toast';

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success toast', () => {
    render(<Toast message="Success!" type="success" onClose={mockOnClose} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders error toast', () => {
    render(<Toast message="Error!" type="error" onClose={mockOnClose} />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('renders info toast', () => {
    render(<Toast message="Info!" type="info" onClose={mockOnClose} />);
    expect(screen.getByText('Info!')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    render(<Toast message="Test" type="info" onClose={mockOnClose} />);
    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after duration', async () => {
    jest.useFakeTimers();
    render(<Toast message="Test" type="info" onClose={mockOnClose} duration={100} />);

    jest.advanceTimersByTime(6000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });
});
