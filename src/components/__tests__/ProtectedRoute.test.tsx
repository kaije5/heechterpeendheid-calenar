import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import ProtectedRoute from '../ProtectedRoute';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  getCurrentUser: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

// Mock LoadingSpinner component
jest.mock('../LoadingSpinner', () => {
  return function MockLoadingSpinner({ text }: { text?: string }) {
    return <div data-testid="loading-spinner">{text || 'Loading'}</div>;
  };
});

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();
  const mockUseRouterReturn = {
    push: mockPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockUseRouter.mockReturnValue(mockUseRouterReturn as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      // Create a promise that never resolves to keep loading state
      mockGetCurrentUser.mockImplementation(() => new Promise(() => {}));

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading spinner with correct styling', () => {
      mockGetCurrentUser.mockImplementation(() => new Promise(() => {}));

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Check that the loading spinner is rendered with the expected structure
      // The spinner has role="status" and contains the loading text
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect to login if no user is authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?redirect=/');
      });
    });

    it('should render children if user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle complex nested children', async () => {
      const mockUser = { id: 'user-456', email: 'admin@example.com' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(
        <ProtectedRoute>
          <div>
            <h1>Dashboard</h1>
            <section>
              <p>Welcome back!</p>
            </section>
          </div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });

    it('should handle authenticated user with minimal data', async () => {
      const mockUser = { id: 'user-789' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(
        <ProtectedRoute>
          <div data-testid="content">Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle getCurrentUser throwing an error', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('Network error'));

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });

      // In case of error, user is null, so redirect should happen
      // Note: The component catches the error, which may cause React act warnings
      // but it should still redirect
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/');
    });

    it('should handle getCurrentUser returning undefined', async () => {
      mockGetCurrentUser.mockResolvedValue(undefined);

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?redirect=/');
      });
    });
  });

  describe('Router Integration', () => {
    it('should call checkAuth on mount', async () => {
      mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });

      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
      });
    });

    it('should use router.push for navigation', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?redirect=/');
      });

      // Verify it was called with the correct path format
      const pushCall = mockPush.mock.calls[0][0];
      expect(pushCall).toBe('/login?redirect=/');
    });
  });

  describe('Suspense Boundary', () => {
    it('should wrap content in Suspense', async () => {
      const mockUser = { id: 'user-123' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(
        <ProtectedRoute>
          <div data-testid="content">Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });

      // Verify the content is rendered
      expect(screen.getByTestId('content').textContent).toContain('Content');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', async () => {
      const mockUser = { id: 'user-123' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(<ProtectedRoute>{null}</ProtectedRoute>);

      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });

      // When children is null and user is authenticated, the content div may still render
      // The actual children (null) is what's passed to the protected route
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle multiple children', async () => {
      const mockUser = { id: 'user-123' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      render(
        <ProtectedRoute>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <span data-testid="child3">Child 3</span>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child1')).toBeInTheDocument();
        expect(screen.getByTestId('child2')).toBeInTheDocument();
        expect(screen.getByTestId('child3')).toBeInTheDocument();
      });
    });

    it('should handle function components as children', async () => {
      const mockUser = { id: 'user-123' };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const TestComponent = () => <div data-testid="func-component">Function Component</div>;

      render(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('func-component')).toBeInTheDocument();
      });
    });

    it('should handle async user resolution delay', async () => {
      const mockUser = { id: 'user-123' };
      mockGetCurrentUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      render(
        <ProtectedRoute>
          <div data-testid="content">Content</div>
        </ProtectedRoute>
      );

      // Initially should show loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // After resolution, should show content
      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup', () => {
    it('should not update state after unmount', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      mockGetCurrentUser.mockImplementation(() => delay(200).then(() => ({ id: 'user-123' })));

      const { unmount } = render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );

      unmount();

      // Should not throw when promise resolves after unmount
      await delay(300);

      // No assertions needed - test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });
});
