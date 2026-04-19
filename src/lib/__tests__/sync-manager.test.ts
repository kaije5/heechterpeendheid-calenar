import {
  syncPendingMutations,
  getSyncStatus,
  useSyncStatus,
  optimisticUpdate,
  optimisticDelete,
  setupOnlineListener,
  _resetOnlineStatus,
} from '../sync-manager';
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from '../supabase';
import {
  getQueuedMutations,
  removeMutation,
  updateCachedEvent,
  removeCachedEvent,
  setLastSyncTime,
  getLastSyncTime,
} from '../offline-db';

// Mock dependencies
jest.mock('../supabase', () => ({
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
}));

jest.mock('../offline-db', () => ({
  getQueuedMutations: jest.fn(),
  removeMutation: jest.fn(),
  updateCachedEvent: jest.fn(),
  removeCachedEvent: jest.fn(),
  setLastSyncTime: jest.fn(),
  getLastSyncTime: jest.fn(),
}));

describe('sync-manager', () => {
  // Store event listener references for cleanup
  let onlineHandler: EventListener | null = null;
  let offlineHandler: EventListener | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset module-level online state
    _resetOnlineStatus(true);

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    // Capture event listeners for later simulation
    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'online' && typeof handler === 'function') {
        onlineHandler = handler as EventListener;
      }
      if (event === 'offline' && typeof handler === 'function') {
        offlineHandler = handler as EventListener;
      }
    });

    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {
      // No-op for cleanup
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    onlineHandler = null;
    offlineHandler = null;
  });

  describe('syncPendingMutations', () => {
    test('should process queued mutations when online', async () => {
      const mockMutations = [
        { id: 1, type: 'create' as const, payload: { title: 'Test Event' } },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (removeMutation as jest.Mock).mockResolvedValue(undefined);
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result).toEqual({ synced: 1, failed: 0 });
      expect(createEvent).toHaveBeenCalledWith({ title: 'Test Event' });
      expect(removeMutation).toHaveBeenCalledWith(1);
      expect(setLastSyncTime).toHaveBeenCalled();
    });

    test('should return zero counts when offline', async () => {
      // Set offline state
      _resetOnlineStatus(false);
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const result = await syncPendingMutations();

      expect(result).toEqual({ synced: 0, failed: 0 });
      expect(getQueuedMutations).not.toHaveBeenCalled();
      expect(createEvent).not.toHaveBeenCalled();
    });

    test('should handle create mutations successfully', async () => {
      const mockMutations = [
        {
          id: 1,
          type: 'create' as const,
          payload: {
            title: 'New Event',
            start_date: '2024-01-01',
            is_all_day: true,
            member_id: 'member-1',
          },
        },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock).mockResolvedValue({ id: 'new-event-1' });
      (removeMutation as jest.Mock).mockResolvedValue(undefined);
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(createEvent).toHaveBeenCalledWith(mockMutations[0].payload);
      expect(removeMutation).toHaveBeenCalledWith(1);
    });

    test('should handle update mutations successfully', async () => {
      const mockMutations = [
        {
          id: 2,
          type: 'update' as const,
          payload: {
            eventId: 'event-123',
            title: 'Updated Title',
          },
        },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (updateEvent as jest.Mock).mockResolvedValue({ id: 'event-123' });
      (removeMutation as jest.Mock).mockResolvedValue(undefined);
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(updateEvent).toHaveBeenCalledWith('event-123', { title: 'Updated Title' });
      expect(removeMutation).toHaveBeenCalledWith(2);
    });

    test('should handle delete mutations successfully', async () => {
      const mockMutations = [
        {
          id: 3,
          type: 'delete' as const,
          payload: { eventId: 'event-456' },
        },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (deleteEvent as jest.Mock).mockResolvedValue(undefined);
      (removeMutation as jest.Mock).mockResolvedValue(undefined);
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(deleteEvent).toHaveBeenCalledWith('event-456');
      expect(removeMutation).toHaveBeenCalledWith(3);
    });

    test('should count failed mutations but not remove them', async () => {
      const mockMutations = [
        { id: 1, type: 'create' as const, payload: { title: 'Event 1' } },
        { id: 2, type: 'create' as const, payload: { title: 'Event 2' } },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock)
        .mockResolvedValueOnce({ id: 'event-1' })
        .mockRejectedValueOnce(new Error('Network error'));
      (removeMutation as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(removeMutation).toHaveBeenCalledTimes(1);
      expect(removeMutation).toHaveBeenCalledWith(1);
      expect(setLastSyncTime).not.toHaveBeenCalled();
    });

    test('should not set last sync time when some mutations failed', async () => {
      const mockMutations = [
        { id: 1, type: 'create' as const, payload: { title: 'Event 1' } },
        { id: 2, type: 'create' as const, payload: { title: 'Event 2' } },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock)
        .mockResolvedValueOnce({ id: 'event-1' })
        .mockRejectedValueOnce(new Error('Network error'));
      (removeMutation as jest.Mock).mockResolvedValue(undefined);

      await syncPendingMutations();

      expect(setLastSyncTime).not.toHaveBeenCalled();
    });

    test('should set last sync time when all mutations succeed', async () => {
      const mockMutations = [
        { id: 1, type: 'create' as const, payload: { title: 'Event 1' } },
        { id: 2, type: 'create' as const, payload: { title: 'Event 2' } },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock)
        .mockResolvedValueOnce({ id: 'event-1' })
        .mockResolvedValueOnce({ id: 'event-2' });
      (removeMutation as jest.Mock).mockResolvedValue(undefined);
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      await syncPendingMutations();

      expect(setLastSyncTime).toHaveBeenCalledWith(expect.any(String));
    });

    test('should handle mutation without id gracefully', async () => {
      const mockMutations = [
        { type: 'create' as const, payload: { title: 'Event Without ID' } },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(1);
      expect(removeMutation).not.toHaveBeenCalled();
    });

    test('should handle unknown mutation type as failure', async () => {
      const mockMutations = [
        { id: 1, type: 'unknown' as unknown as 'create', payload: {} },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
    });

    test('should handle update mutation with invalid eventId', async () => {
      const mockMutations = [
        {
          id: 1,
          type: 'update' as const,
          payload: { eventId: 123, title: 'Test' },
        },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(updateEvent).not.toHaveBeenCalled();
    });

    test('should handle empty mutation queue', async () => {
      (getQueuedMutations as jest.Mock).mockResolvedValue([]);

      const result = await syncPendingMutations();

      expect(result).toEqual({ synced: 0, failed: 0 });
      expect(setLastSyncTime).not.toHaveBeenCalled();
    });

    test('should process multiple mutations of different types', async () => {
      const mockMutations = [
        { id: 1, type: 'create' as const, payload: { title: 'New Event' } },
        { id: 2, type: 'update' as const, payload: { eventId: 'event-1', title: 'Updated' } },
        { id: 3, type: 'delete' as const, payload: { eventId: 'event-2' } },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (createEvent as jest.Mock).mockResolvedValue({ id: 'created-event' });
      (updateEvent as jest.Mock).mockResolvedValue({ id: 'event-1' });
      (deleteEvent as jest.Mock).mockResolvedValue(undefined);
      (removeMutation as jest.Mock).mockResolvedValue(undefined);
      (setLastSyncTime as jest.Mock).mockResolvedValue(undefined);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(3);
      expect(result.failed).toBe(0);
      expect(createEvent).toHaveBeenCalled();
      expect(updateEvent).toHaveBeenCalled();
      expect(deleteEvent).toHaveBeenCalled();
    });
  });

  describe('getSyncStatus', () => {
    test('should return current sync status when online', async () => {
      _resetOnlineStatus(true);

      const mockMutations = [
        { id: 1, type: 'create' as const, payload: {}, timestamp: Date.now() },
        { id: 2, type: 'update' as const, payload: {}, timestamp: Date.now() },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (getLastSyncTime as jest.Mock).mockResolvedValue('2024-01-01T00:00:00Z');

      const status = await getSyncStatus();

      expect(status.isOnline).toBe(true);
      expect(status.pendingMutations).toBe(2);
      expect(status.lastSync).toBe('2024-01-01T00:00:00Z');
    });

    test('should return current sync status when offline', async () => {
      _resetOnlineStatus(false);
      Object.defineProperty(global.navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const mockMutations = [{ id: 1, type: 'create' as const, payload: {}, timestamp: Date.now() }];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (getLastSyncTime as jest.Mock).mockResolvedValue(null);

      const status = await getSyncStatus();

      expect(status.isOnline).toBe(false);
      expect(status.pendingMutations).toBe(1);
      expect(status.lastSync).toBeNull();
    });

    test('should handle empty mutation queue', async () => {
      _resetOnlineStatus(true);

      (getQueuedMutations as jest.Mock).mockResolvedValue([]);
      (getLastSyncTime as jest.Mock).mockResolvedValue(null);

      const status = await getSyncStatus();

      expect(status.pendingMutations).toBe(0);
      expect(status.lastSync).toBeNull();
    });
  });

  describe('useSyncStatus', () => {
    test('should return sync status interface', () => {
      _resetOnlineStatus(true);

      const status = useSyncStatus();

      expect(status.isOnline).toBe(true);
      expect(typeof status.syncPendingMutations).toBe('function');
      expect(typeof status.getSyncStatus).toBe('function');
      expect(typeof status.setupOnlineListener).toBe('function');
    });

    test('should reflect offline status', () => {
      _resetOnlineStatus(false);

      const status = useSyncStatus();

      expect(status.isOnline).toBe(false);
    });
  });

  describe('optimisticUpdate', () => {
    test('should update cached event', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Updated Title',
        start_date: '2024-01-01',
        is_all_day: true,
        member_id: 'member-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      (updateCachedEvent as jest.Mock).mockResolvedValue(undefined);

      await optimisticUpdate('event-1', mockEvent);

      expect(updateCachedEvent).toHaveBeenCalledWith(mockEvent);
    });

    test('should handle update with different event data', async () => {
      const mockEvent = {
        id: 'event-2',
        title: 'Different Event',
        description: 'With description',
        start_date: '2024-06-15',
        end_date: '2024-06-16',
        is_all_day: false,
        member_id: 'member-2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-06-15T10:00:00Z',
      };
      (updateCachedEvent as jest.Mock).mockResolvedValue(undefined);

      await optimisticUpdate('event-2', mockEvent);

      expect(updateCachedEvent).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('optimisticDelete', () => {
    test('should remove cached event', async () => {
      (removeCachedEvent as jest.Mock).mockResolvedValue(undefined);

      await optimisticDelete('event-1');

      expect(removeCachedEvent).toHaveBeenCalledWith('event-1');
    });

    test('should handle different event IDs', async () => {
      (removeCachedEvent as jest.Mock).mockResolvedValue(undefined);

      await optimisticDelete('event-abc-123');

      expect(removeCachedEvent).toHaveBeenCalledWith('event-abc-123');
    });
  });

  describe('setupOnlineListener', () => {
    test('should set up online/offline event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const mockCallback = jest.fn();
      const cleanup = setupOnlineListener(mockCallback);

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      // Simulate online event using the captured handler
      if (onlineHandler) {
        onlineHandler(new Event('online'));
      }
      expect(mockCallback).toHaveBeenCalledWith(true);

      // Simulate offline event using the captured handler
      if (offlineHandler) {
        offlineHandler(new Event('offline'));
      }
      expect(mockCallback).toHaveBeenCalledWith(false);

      // Cleanup should remove listeners
      cleanup();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    test('should return no-op function when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error Testing undefined window
      global.window = undefined;

      const cleanup = setupOnlineListener(jest.fn());

      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();

      global.window = originalWindow;
    });

    test('should call callback with correct status on multiple transitions', () => {
      const mockCallback = jest.fn();
      setupOnlineListener(mockCallback);

      // Simulate multiple transitions
      if (onlineHandler) {
        onlineHandler(new Event('online'));
      }
      if (offlineHandler) {
        offlineHandler(new Event('offline'));
      }
      if (onlineHandler) {
        onlineHandler(new Event('online'));
      }
      if (offlineHandler) {
        offlineHandler(new Event('offline'));
      }

      expect(mockCallback).toHaveBeenCalledTimes(4);
      expect(mockCallback.mock.calls).toEqual([[true], [false], [true], [false]]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle update mutation with missing eventId', async () => {
      const mockMutations = [
        {
          id: 1,
          type: 'update' as const,
          payload: { title: 'No EventId' },
        },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);

      const result = await syncPendingMutations();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(updateEvent).not.toHaveBeenCalled();
    });

    test('should handle delete mutation with missing eventId', async () => {
      const mockMutations = [
        {
          id: 1,
          type: 'delete' as const,
          payload: {},
        },
      ];
      (getQueuedMutations as jest.Mock).mockResolvedValue(mockMutations);
      (deleteEvent as jest.Mock).mockRejectedValue(new Error('Missing eventId'));

      const result = await syncPendingMutations();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
    });

    test('should handle getQueuedMutations throwing error', async () => {
      (getQueuedMutations as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(syncPendingMutations()).rejects.toThrow('Database error');
    });

    test('should handle getSyncStatus with getLastSyncTime error', async () => {
      (getQueuedMutations as jest.Mock).mockResolvedValue([]);
      (getLastSyncTime as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(getSyncStatus()).rejects.toThrow('Storage error');
    });
  });
});
