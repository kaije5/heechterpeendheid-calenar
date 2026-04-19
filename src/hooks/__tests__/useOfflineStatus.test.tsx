import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineStatus } from '../useOfflineStatus';
import { getSyncStatus, syncPendingMutations } from '@/lib/sync-manager';

jest.mock('@/lib/sync-manager', () => ({
  getSyncStatus: jest.fn(),
  syncPendingMutations: jest.fn(),
}));

const mockGetSyncStatus = getSyncStatus as jest.MockedFunction<typeof getSyncStatus>;
const mockSyncPendingMutations = syncPendingMutations as jest.MockedFunction<typeof syncPendingMutations>;

describe('useOfflineStatus', () => {
  // Make these accessible for tests via globalThis to avoid closure issues
  const getOnlineListeners = () => (globalThis as Record<string, unknown>).__onlineListeners as Map<string, EventListener> | undefined;
  const getServiceWorkerListeners = () => (globalThis as Record<string, unknown>).__serviceWorkerListeners as Map<string, EventListener> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize listener maps on globalThis so tests can access them
    (globalThis as Record<string, unknown>).__onlineListeners = new Map<string, EventListener>();
    (globalThis as Record<string, unknown>).__serviceWorkerListeners = new Map<string, EventListener>();

    // Save original navigator.onLine value
    const originalNavigatorOnLine = navigator.onLine;

    // Mock window.addEventListener for online/offline events
    jest.spyOn(window, 'addEventListener').mockImplementation((type: string, listener: EventListener) => {
      const map = getOnlineListeners();
      if (map) map.set(type, listener);
    });
    jest.spyOn(window, 'removeEventListener').mockImplementation((type: string, _listener: EventListener) => {
      const map = getOnlineListeners();
      if (map) map.delete(type);
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => true,
    });

    // Mock serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: jest.fn((type: string, listener: EventListener) => {
          const map = getServiceWorkerListeners();
          if (map) map.set(type, listener);
        }),
        removeEventListener: jest.fn((type: string, _listener: EventListener) => {
          const map = getServiceWorkerListeners();
          if (map) map.delete(type);
        }),
      },
    });

    // Reset auto-sync mocking to prevent it interfering with other tests
    mockGetSyncStatus.mockResolvedValue({
      isOnline: true,
      pendingMutations: 0,
      lastSync: null,
    });

    mockSyncPendingMutations.mockResolvedValue({ synced: 1, failed: 0 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial status with navigator.onLine', () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => true,
      });

      const { result } = renderHook(() => useOfflineStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.pendingMutations).toBe(0);
      expect(result.current.lastSync).toBeNull();
      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastError).toBeNull();
    });

    it('should default to online when navigator is undefined', async () => {
      // Temporarily remove navigator.onLine
      Object.defineProperty(global, 'navigator', {
        configurable: true,
        value: {},
      });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for useEffect to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isOnline).toBe(true);

      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        configurable: true,
        value: { onLine: true, serviceWorker: undefined },
      });
    });
  });

  describe('Status Refresh', () => {
    it('should refresh status on mount', async () => {
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: '2024-01-01T00:00:00Z',
      });

      const { result } = renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(mockGetSyncStatus).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.pendingMutations).toBe(5);
      });
    });

    it('should allow manual refresh via refreshStatus', async () => {
      // First call returns initial state
      mockGetSyncStatus.mockResolvedValueOnce({ isOnline: true, pendingMutations: 0, lastSync: null });

      const { result } = renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(result.current.pendingMutations).toBe(0);
      });

      // Change mock to return different values for manual refresh
      mockGetSyncStatus.mockResolvedValueOnce({ isOnline: true, pendingMutations: 3, lastSync: '2024-01-01T00:00:00Z' });

      await act(async () => {
        await result.current.refreshStatus();
      });

      expect(mockGetSyncStatus.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(result.current.pendingMutations).toBe(3);
    });
    });
  });

  describe('Online/Offline Events', () => {
    it('should update isOnline when offline event fires', async () => {
      const { result } = renderHook(() => useOfflineStatus());

      // Wait for hook to register listeners
      await act(async () => {
        await Promise.resolve();
      });

      const offlineHandler = getOnlineListeners()?.get('offline');
      expect(offlineHandler).toBeDefined();

      act(() => {
        offlineHandler?.(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should update isOnline when online event fires', async () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => false,
      });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for initial render
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isOnline).toBe(false);

      const onlineHandler = getOnlineListeners()?.get('online');
      expect(onlineHandler).toBeDefined();

      act(() => {
        onlineHandler?.(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should cleanup event listeners on unmount', async () => {
      const { unmount } = renderHook(() => useOfflineStatus());

      // Wait for listeners to be registered
      await act(async () => {
        await Promise.resolve();
      });

      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Auto-Sync on Online', () => {
    it('should trigger sync when coming online with pending mutations', async () => {
      mockGetSyncStatus.mockResolvedValue({
        isOnline: false,
        pendingMutations: 3,
        lastSync: null,
      });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for initial status
      await waitFor(() => {
        expect(result.current.pendingMutations).toBe(3);
      });

      expect(result.current.isOnline).toBe(false);

      // Simulate coming online
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: '2024-01-01T00:00:00Z',
      });

      const onlineHandler = getOnlineListeners()?.get('online');

      act(() => {
        onlineHandler?.(new Event('online'));
      });

      await waitFor(() => {
        expect(mockSyncPendingMutations).toHaveBeenCalled();
      });
    });

    it('should not trigger sync when coming online with no pending mutations', async () => {
      mockGetSyncStatus.mockResolvedValue({
        isOnline: false,
        pendingMutations: 0,
        lastSync: null,
      });

      const { result } = renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      const onlineHandler = getOnlineListeners()?.get('online');

      act(() => {
        onlineHandler?.(new Event('online'));
      });

      // Wait a tick to ensure no sync triggered
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSyncPendingMutations).not.toHaveBeenCalled();
    });

    it('should not trigger sync if already syncing', async () => {
      let syncStarted = false;
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
      });

      // Create a pending promise that never resolves
      mockSyncPendingMutations.mockImplementation(() => {
        syncStarted = true;
        return new Promise(() => {});
      });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for auto-sync to start
      await waitFor(() => {
        expect(syncStarted).toBe(true);
      });

      // Try to trigger sync again while already syncing
      await act(async () => {
        await result.current.triggerSync();
      });

      // Should only be called once from the auto-sync
      expect(mockSyncPendingMutations).toHaveBeenCalledTimes(1);
    });

    it('should not trigger sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        get: () => false,
      });

      mockGetSyncStatus.mockResolvedValue({
        isOnline: false,
        pendingMutations: 3,
        lastSync: null,
      });

      const { result } = renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockSyncPendingMutations).not.toHaveBeenCalled();
    });
  });

  describe('Sync Error Handling', () => {
    it('should set lastError when sync fails', async () => {
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
      });

      mockSyncPendingMutations.mockResolvedValue({ synced: 0, failed: 3 });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for sync to complete with error
      await waitFor(() => {
        expect(result.current.lastError).toBe('Failed to sync 3 item(s)');
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle sync exception', async () => {
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
      });

      mockSyncPendingMutations.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for sync to complete with error
      await waitFor(() => {
        expect(result.current.lastError).toBe('Network failure');
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('should handle sync exception with non-Error object', async () => {
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 3,
        lastSync: null,
      });

      mockSyncPendingMutations.mockRejectedValue('String error');

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for auto-sync to trigger and complete
      await waitFor(() => {
        expect(result.current.lastError).toBe('Sync failed');
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('should clear lastError when starting new sync', async () => {
      mockGetSyncStatus
        .mockResolvedValueOnce({ isOnline: true, pendingMutations: 3, lastSync: null })
        .mockResolvedValueOnce({ isOnline: true, pendingMutations: 3, lastSync: null });

      mockSyncPendingMutations.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(result.current.lastError).toBe('First error');
      });

      // Clear error on new sync attempt
      mockSyncPendingMutations.mockResolvedValueOnce({ synced: 3, failed: 0 });

      await act(async () => {
        await result.current.triggerSync();
      });

      expect(result.current.lastError).toBeNull();
    });
  });

  describe('Service Worker Messages', () => {
    it('should refresh status on SYNC_EVENTS message', async () => {
      // Set pendingMutations to 0 to prevent auto-sync from interfering
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 0,
        lastSync: null,
      });

      renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      const messageHandler = getServiceWorkerListeners()?.get('message');
      expect(messageHandler).toBeDefined();

      // Simulate SYNC_EVENTS message
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: '2024-01-01T00:00:00Z',
      });

      act(() => {
        messageHandler?.({ data: { type: 'SYNC_EVENTS' } } as MessageEvent);
      });

      await waitFor(() => {
        expect(mockGetSyncStatus).toHaveBeenCalledTimes(2);
      });
    });

    it('should ignore non-SYNC_EVENTS messages', async () => {
      renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      const messageHandler = getServiceWorkerListeners()?.get('message');

      act(() => {
        messageHandler?.({ data: { type: 'OTHER_EVENT' } } as MessageEvent);
      });

      // Wait a tick
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should only be called once on mount
      expect(mockGetSyncStatus).toHaveBeenCalledTimes(1);
    });

    it('should ignore messages without data', async () => {
      const { result } = renderHook(() => useOfflineStatus());

      await waitFor(() => {
        expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });

      const messageHandler = getServiceWorkerListeners()?.get('message');

      act(() => {
        messageHandler?.({} as MessageEvent);
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockGetSyncStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle environments without serviceWorker', () => {
      // Need to delete the property entirely, not just set to undefined
      // because 'serviceWorker' in navigator checks for existence
      const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).serviceWorker;

      // Should render without throwing
      const { unmount } = renderHook(() => useOfflineStatus());

      // Should complete without error
      unmount();
      expect(true).toBe(true);

      // Restore the property if it existed
      if (originalDescriptor) {
        Object.defineProperty(navigator, 'serviceWorker', originalDescriptor);
      }
    });
  });

  describe('Manual Sync', () => {
    it('should allow manual triggerSync when online', async () => {
      // Start with pending mutations and online
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: null,
      });

      mockSyncPendingMutations.mockResolvedValue({ synced: 5, failed: 0 });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for any auto-sync to complete
      await waitFor(() => {
        expect(result.current.pendingMutations).toBe(5);
      });

      // Reset mock to track manual call
      mockSyncPendingMutations.mockClear();

      // Trigger manual sync
      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockSyncPendingMutations).toHaveBeenCalled();
    });

    it('should not allow manual triggerSync when offline', async () => {
      // Ensure default mocks won't trigger auto-sync
      mockGetSyncStatus.mockResolvedValue({
        isOnline: false,
        pendingMutations: 5,
        lastSync: null,
      });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for initial state
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Now triggerSync should not call syncPendingMutations
      await act(async () => {
        await result.current.triggerSync();
      });

      expect(mockSyncPendingMutations).not.toHaveBeenCalled();
    });

    it('should not allow manual triggerSync when already syncing', async () => {
      let syncStarted = false;
      mockGetSyncStatus.mockResolvedValue({
        isOnline: true,
        pendingMutations: 5,
        lastSync: null,
      });

      let resolveSync: (value: { synced: number; failed: number }) => void = () => {};
      mockSyncPendingMutations.mockImplementation(() => {
        syncStarted = true;
        return new Promise((resolve) => {
          resolveSync = resolve;
        });
      });

      const { result } = renderHook(() => useOfflineStatus());

      // Wait for auto-sync to start
      await waitFor(() => {
        expect(syncStarted).toBe(true);
      });

      expect(result.current.isSyncing).toBe(true);

      mockSyncPendingMutations.mockClear();

      // Try to trigger another sync while already syncing
      await act(async () => {
        await result.current.triggerSync();
      });

      // Should not call sync again
      expect(mockSyncPendingMutations).not.toHaveBeenCalled();

      // Clean up
      resolveSync({ synced: 5, failed: 0 });
    });
  });
