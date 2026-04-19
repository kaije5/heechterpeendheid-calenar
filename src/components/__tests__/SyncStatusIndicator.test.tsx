import { render, screen, fireEvent } from '@testing-library/react';
import { SyncStatusIndicator, SyncBadge } from '../SyncStatusIndicator';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

jest.mock('@/hooks/useOfflineStatus');

const mockUseOfflineStatus = useOfflineStatus as jest.MockedFunction<typeof useOfflineStatus>;

describe('SyncStatusIndicator', () => {
  const mockTriggerSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerSync.mockClear();
  });

  describe('Syncing State', () => {
    it('should show syncing indicator when isSyncing is true', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText(/Syncing/)).toBeInTheDocument();
      expect(screen.getByText(/3 pending change/)).toBeInTheDocument();
    });

    it('should show single change when pending mutations is 1', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 1,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText(/Syncing 1 pending change/)).toBeInTheDocument();
    });

    it('should show multiple changes when pending mutations is greater than 1', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText(/Syncing 5 pending change/)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message with retry button when lastError exists', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: false,
        lastError: 'Failed to sync 3 item(s)',
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to sync 3 item(s)')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call triggerSync when retry button is clicked', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: false,
        lastError: 'Network error',
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should handle different error messages', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: null,
        isSyncing: false,
        lastError: 'Connection timeout',
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    });
  });

  describe('Offline State', () => {
    it('should show offline banner when isOnline is false', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 0,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Offline/)).toBeInTheDocument();
      expect(screen.getByText(/Changes will sync when online/)).toBeInTheDocument();
    });

    it('should show pending count when offline with mutations', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText(/Offline/)).toBeInTheDocument();
      expect(screen.getByText(/3 change\(s\) pending/)).toBeInTheDocument();
    });

    it('should show single pending when offline with 1 mutation', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 1,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText(/1 change\(s\) pending/)).toBeInTheDocument();
    });
  });

  describe('Online with Pending Mutations', () => {
    it('should show sync button when online with pending mutations', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText(/3 pending/)).toBeInTheDocument();
      expect(screen.getByText(/click to sync/)).toBeInTheDocument();
    });

    it('should call triggerSync when sync button is clicked', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockTriggerSync).toHaveBeenCalledTimes(1);
    });

    it('should show single pending when online with 1 mutation', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 1,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      expect(screen.getByText(/1 pending/)).toBeInTheDocument();
    });
  });

  describe('Synced State', () => {
    it('should return null when fully synced and online', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: '2024-01-01T00:00:00Z',
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      const { container } = render(<SyncStatusIndicator />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when no action needed', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      const { container } = render(<SyncStatusIndicator />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Priority States', () => {
    it('should prioritize syncing over offline state', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false, // Should not matter when syncing
        pendingMutations: 3,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      // Should show syncing state, not offline
      expect(screen.getByText(/Syncing/)).toBeInTheDocument();
    });

    it('should prioritize error over offline state', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: false,
        lastError: 'Sync failed',
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      // Should show error state
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Sync failed')).toBeInTheDocument();
    });

    it('should prioritize syncing over error state', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: true,
        lastError: 'Previous error',
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncStatusIndicator />);

      // Should show syncing state (highest priority)
      expect(screen.getByText(/Syncing/)).toBeInTheDocument();
      expect(screen.queryByText('Previous error')).not.toBeInTheDocument();
    });
  });
});

describe('SyncBadge', () => {
  const mockTriggerSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerSync.mockClear();
  });

  describe('Syncing State', () => {
    it('should show syncing badge when isSyncing is true', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('Syncing')).toBeInTheDocument();
    });
  });

  describe('Offline State', () => {
    it('should show offline badge when isOnline is false', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 0,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('should show offline badge with pending mutations', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 5,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Pending State', () => {
    it('should show pending badge with count when online with pending mutations', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('3 pending')).toBeInTheDocument();
    });

    it('should show single pending', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 1,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('1 pending')).toBeInTheDocument();
    });
  });

  describe('Synced State', () => {
    it('should show synced badge when fully synced', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: '2024-01-01T00:00:00Z',
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('Synced')).toBeInTheDocument();
    });

    it('should show synced badge when online with no pending and no lastSync', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('Synced')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should prioritize syncing over offline', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: false,
        pendingMutations: 3,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      // Should show syncing, not offline
      expect(screen.getByText('Syncing')).toBeInTheDocument();
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });

    it('should prioritize syncing over pending', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: null,
        isSyncing: true,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      // Should show syncing, not pending count
      expect(screen.getByText('Syncing')).toBeInTheDocument();
      expect(screen.queryByText(/pending/)).not.toBeInTheDocument();
    });

    it('should handle large pending mutation counts', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 999,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      expect(screen.getByText('999 pending')).toBeInTheDocument();
    });

    it('should handle zero pending mutations correctly', () => {
      mockUseOfflineStatus.mockReturnValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: null,
        isSyncing: false,
        lastError: null,
        refreshStatus: jest.fn(),
        triggerSync: mockTriggerSync,
      });

      render(<SyncBadge />);

      // Should show synced, not "0 pending"
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });
  });
});

// Integration tests - testing both components together
describe('SyncStatus Components Integration', () => {
  const mockTriggerSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerSync.mockClear();
  });

  it('should show consistent state across both components', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      pendingMutations: 5,
      lastSync: null,
      isSyncing: false,
      lastError: null,
      refreshStatus: jest.fn(),
      triggerSync: mockTriggerSync,
    });

    const { container: indicatorContainer } = render(<SyncStatusIndicator />);
    const { container: badgeContainer } = render(<SyncBadge />);

    // Both should show offline state
    expect(indicatorContainer.textContent).toContain('Offline');
    expect(badgeContainer.textContent).toContain('Offline');
  });

  it('should show syncing state consistently', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: true,
      pendingMutations: 3,
      lastSync: null,
      isSyncing: true,
      lastError: null,
      refreshStatus: jest.fn(),
      triggerSync: mockTriggerSync,
    });

    const { container: indicatorContainer } = render(<SyncStatusIndicator />);
    const { container: badgeContainer } = render(<SyncBadge />);

    // Both should show syncing
    expect(indicatorContainer.textContent).toContain('Syncing');
    expect(badgeContainer.textContent).toContain('Syncing');
  });
});
