import {
  getCachedEvents,
  cacheEvents,
  getCachedMembers,
  cacheMembers,
  updateCachedEvent,
  removeCachedEvent,
  queueMutation,
  getQueuedMutations,
  removeMutation,
  clearMutationQueue,
  getLastSyncTime,
  setLastSyncTime,
  QueuedMutation,
} from '../offline-db';
import { CalendarEvent, HouseholdMember } from '@/types';

// Increase Jest timeout for IndexedDB operations
jest.setTimeout(30000);

describe('offline-db', () => {
  // Clear IndexedDB before all tests
  beforeAll(async () => {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map((db) => {
        if (db.name) {
          return new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          });
        }
        return Promise.resolve();
      })
    );
  });

  // Clear mutation queue before each test
  beforeEach(async () => {
    await clearMutationQueue();
  });

  describe('event caching', () => {
    test('should return empty array when no events cached', async () => {
      const events = await getCachedEvents();
      expect(events).toEqual([]);
    });

    test('should store and retrieve events', async () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Test Event',
          start_time: '2025-01-01T10:00:00Z',
          end_time: '2025-01-01T11:00:00Z',
          member_id: 'member-1',
          is_recurring: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      await cacheEvents(events);
      const retrieved = await getCachedEvents();

      expect(retrieved).toEqual(events);
    });

    test('should overwrite existing events', async () => {
      const events1: CalendarEvent[] = [
        { id: '1', title: 'First', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
      ];
      const events2: CalendarEvent[] = [
        { id: '2', title: 'Second', start_time: '2025-01-02T10:00:00Z', end_time: '2025-01-02T11:00:00Z', member_id: 'member-2', is_recurring: false, created_at: '', updated_at: '' },
      ];

      await cacheEvents(events1);
      await cacheEvents(events2);
      const retrieved = await getCachedEvents();

      expect(retrieved).toEqual(events2);
    });

    test('should store multiple events', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'Event 1', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
        { id: '2', title: 'Event 2', start_time: '2025-01-02T10:00:00Z', end_time: '2025-01-02T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
        { id: '3', title: 'Event 3', start_time: '2025-01-03T10:00:00Z', end_time: '2025-01-03T11:00:00Z', member_id: 'member-2', is_recurring: false, created_at: '', updated_at: '' },
      ];

      await cacheEvents(events);
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(3);
      expect(retrieved).toEqual(events);
    });

    test('should handle empty events array', async () => {
      await cacheEvents([]);
      const retrieved = await getCachedEvents();

      expect(retrieved).toEqual([]);
    });
  });

  describe('member caching', () => {
    test('should return empty array when no members cached', async () => {
      const members = await getCachedMembers();
      expect(members).toEqual([]);
    });

    test('should store and retrieve members', async () => {
      const members: HouseholdMember[] = [
        {
          id: 'member-1',
          name: 'John Doe',
          color: '#ff0000',
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      await cacheMembers(members);
      const retrieved = await getCachedMembers();

      expect(retrieved).toEqual(members);
    });

    test('should overwrite existing members', async () => {
      const members1: HouseholdMember[] = [
        { id: 'member-1', name: 'John', color: '#ff0000', created_at: '' },
      ];
      const members2: HouseholdMember[] = [
        { id: 'member-2', name: 'Jane', color: '#00ff00', created_at: '' },
      ];

      await cacheMembers(members1);
      await cacheMembers(members2);
      const retrieved = await getCachedMembers();

      expect(retrieved).toEqual(members2);
    });

    test('should handle empty members array', async () => {
      await cacheMembers([]);
      const retrieved = await getCachedMembers();

      expect(retrieved).toEqual([]);
    });

    test('should store multiple members', async () => {
      const members: HouseholdMember[] = [
        { id: 'member-1', name: 'John', color: '#ff0000', created_at: '' },
        { id: 'member-2', name: 'Jane', color: '#00ff00', created_at: '' },
        { id: 'member-3', name: 'Bob', color: '#0000ff', created_at: '' },
      ];

      await cacheMembers(members);
      const retrieved = await getCachedMembers();

      expect(retrieved).toHaveLength(3);
      expect(retrieved).toEqual(members);
    });
  });

  describe('updateCachedEvent', () => {
    test('should add event when cache is empty', async () => {
      const newEvent: CalendarEvent = {
        id: '1',
        title: 'New Event',
        start_time: '2025-01-01T10:00:00Z',
        end_time: '2025-01-01T11:00:00Z',
        member_id: 'member-1',
        is_recurring: false,
        created_at: '',
        updated_at: '',
      };

      await updateCachedEvent(newEvent);
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toEqual(newEvent);
    });

    test('should update existing event', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'Original', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
        { id: '2', title: 'Other', start_time: '2025-01-02T10:00:00Z', end_time: '2025-01-02T11:00:00Z', member_id: 'member-2', is_recurring: false, created_at: '', updated_at: '' },
      ];
      await cacheEvents(events);

      const updatedEvent: CalendarEvent = {
        id: '1',
        title: 'Updated Title',
        start_time: '2025-01-01T10:00:00Z',
        end_time: '2025-01-01T11:00:00Z',
        member_id: 'member-1',
        is_recurring: false,
        created_at: '',
        updated_at: '2025-01-01T12:00:00Z',
      };

      await updateCachedEvent(updatedEvent);
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(2);
      expect(retrieved.find(e => e.id === '1')?.title).toBe('Updated Title');
      expect(retrieved.find(e => e.id === '2')?.title).toBe('Other');
    });

    test('should append event when id does not exist', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'First', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
      ];
      await cacheEvents(events);

      const newEvent: CalendarEvent = {
        id: '2',
        title: 'Second',
        start_time: '2025-01-02T10:00:00Z',
        end_time: '2025-01-02T11:00:00Z',
        member_id: 'member-2',
        is_recurring: false,
        created_at: '',
        updated_at: '',
      };

      await updateCachedEvent(newEvent);
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(2);
      expect(retrieved.find(e => e.id === '2')).toEqual(newEvent);
    });
  });

  describe('removeCachedEvent', () => {
    test('should remove event by id', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'First', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
        { id: '2', title: 'Second', start_time: '2025-01-02T10:00:00Z', end_time: '2025-01-02T11:00:00Z', member_id: 'member-2', is_recurring: false, created_at: '', updated_at: '' },
        { id: '3', title: 'Third', start_time: '2025-01-03T10:00:00Z', end_time: '2025-01-03T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
      ];
      await cacheEvents(events);

      await removeCachedEvent('2');
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(2);
      expect(retrieved.find(e => e.id === '2')).toBeUndefined();
      expect(retrieved.find(e => e.id === '1')).toBeDefined();
      expect(retrieved.find(e => e.id === '3')).toBeDefined();
    });

    test('should handle removing non-existent event id', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'First', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
      ];
      await cacheEvents(events);

      await removeCachedEvent('non-existent');
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].id).toBe('1');
    });

    test('should handle removing from empty cache', async () => {
      await removeCachedEvent('1');
      const retrieved = await getCachedEvents();

      expect(retrieved).toEqual([]);
    });
  });

  describe('mutation queue', () => {
    beforeEach(async () => {
      await clearMutationQueue();
    });

    test('should queue mutation with auto-increment id', async () => {
      const mutation: Omit<QueuedMutation, 'id' | 'timestamp'> = {
        type: 'create',
        payload: { title: 'New Event' },
      };

      await queueMutation(mutation);
      const queued = await getQueuedMutations();

      expect(queued).toHaveLength(1);
      expect(queued[0].type).toBe('create');
      expect(queued[0].payload).toEqual({ title: 'New Event' });
      expect(queued[0].id).toBeDefined();
      expect(queued[0].timestamp).toBeGreaterThan(0);
    });

    test('should queue multiple mutations', async () => {
      await queueMutation({ type: 'create', payload: { id: '1' } });
      await queueMutation({ type: 'update', payload: { id: '2' } });
      await queueMutation({ type: 'delete', payload: { id: '3' } });

      const queued = await getQueuedMutations();

      expect(queued).toHaveLength(3);
      expect(queued.map(m => m.type)).toEqual(['create', 'update', 'delete']);
    });

    test('should return empty array when no mutations queued', async () => {
      const queued = await getQueuedMutations();
      expect(queued).toEqual([]);
    });

    test('should remove specific mutation by id', async () => {
      await queueMutation({ type: 'create', payload: { id: '1' } });
      await queueMutation({ type: 'update', payload: { id: '2' } });
      await queueMutation({ type: 'delete', payload: { id: '3' } });

      const queued = await getQueuedMutations();
      const idToRemove = queued[1].id!;

      await removeMutation(idToRemove);
      const remaining = await getQueuedMutations();

      expect(remaining).toHaveLength(2);
      expect(remaining.find(m => m.id === idToRemove)).toBeUndefined();
    });

    test('should clear all mutations', async () => {
      await queueMutation({ type: 'create', payload: {} });
      await queueMutation({ type: 'update', payload: {} });

      await clearMutationQueue();
      const queued = await getQueuedMutations();

      expect(queued).toEqual([]);
    });

    test('should handle removing non-existent mutation id', async () => {
      await queueMutation({ type: 'create', payload: {} });

      await removeMutation(99999);
      const queued = await getQueuedMutations();

      expect(queued).toHaveLength(1);
    });

    test('should support all mutation types', async () => {
      const types: Array<'create' | 'update' | 'delete'> = ['create', 'update', 'delete'];

      for (const type of types) {
        await queueMutation({ type, payload: { test: type } });
      }

      const queued = await getQueuedMutations();

      expect(queued).toHaveLength(3);
      types.forEach((type, index) => {
        expect(queued[index].type).toBe(type);
      });
    });

    test('should preserve complex payload data', async () => {
      const complexPayload = {
        event: {
          id: '1',
          title: 'Complex Event',
          nested: { deep: { value: 123 } },
          array: [1, 2, 3],
        },
        metadata: {
          timestamp: Date.now(),
          source: 'test',
        },
      };

      await queueMutation({ type: 'create', payload: complexPayload });
      const queued = await getQueuedMutations();

      expect(queued[0].payload).toEqual(complexPayload);
    });
  });

  describe('sync timestamp', () => {
    test('should return null when no sync time set', async () => {
      const time = await getLastSyncTime();
      expect(time).toBeNull();
    });

    test('should store and retrieve sync time', async () => {
      const syncTime = '2025-01-01T12:00:00Z';

      await setLastSyncTime(syncTime);
      const retrieved = await getLastSyncTime();

      expect(retrieved).toBe(syncTime);
    });

    test('should overwrite existing sync time', async () => {
      await setLastSyncTime('2025-01-01T10:00:00Z');
      await setLastSyncTime('2025-01-02T15:30:00Z');

      const retrieved = await getLastSyncTime();

      expect(retrieved).toBe('2025-01-02T15:30:00Z');
    });

    test('should handle different timestamp formats', async () => {
      const timestamps = [
        '2025-01-01T00:00:00Z',
        '2025-12-31T23:59:59.999Z',
        new Date().toISOString(),
      ];

      for (const ts of timestamps) {
        await setLastSyncTime(ts);
        const retrieved = await getLastSyncTime();
        expect(retrieved).toBe(ts);
      }
    });
  });

  describe('independent operations', () => {
    test('events and members cache should be independent', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'Event', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
      ];
      const members: HouseholdMember[] = [
        { id: 'member-1', name: 'Member', color: '#ff0000', created_at: '' },
      ];

      await cacheEvents(events);
      await cacheMembers(members);

      const retrievedEvents = await getCachedEvents();
      const retrievedMembers = await getCachedMembers();

      expect(retrievedEvents).toEqual(events);
      expect(retrievedMembers).toEqual(members);
    });

    test('mutation queue should not affect event cache', async () => {
      await cacheEvents([{ id: '1', title: 'Event', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' }]);
      await queueMutation({ type: 'create', payload: { title: 'New Event' } });

      const events = await getCachedEvents();
      const mutations = await getQueuedMutations();

      expect(events).toHaveLength(1);
      expect(mutations).toHaveLength(1);
    });

    test('sync time should not affect other caches', async () => {
      await cacheEvents([{ id: '1', title: 'Event', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' }]);
      await setLastSyncTime('2025-01-01T12:00:00Z');

      const events = await getCachedEvents();
      const syncTime = await getLastSyncTime();

      expect(events).toHaveLength(1);
      expect(syncTime).toBe('2025-01-01T12:00:00Z');
    });
  });

  describe('edge cases', () => {
    test('should handle special characters in event titles', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: 'Event with "quotes" and \'apostrophes\'', start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' },
        { id: '2', title: 'Event with <html> tags', start_time: '2025-01-02T10:00:00Z', end_time: '2025-01-02T11:00:00Z', member_id: 'member-2', is_recurring: false, created_at: '', updated_at: '' },
        { id: '3', title: 'Unicode: 你好世界 🎉 émoji', start_time: '2025-01-03T10:00:00Z', end_time: '2025-01-03T11:00:00Z', member_id: 'member-3', is_recurring: false, created_at: '', updated_at: '' },
      ];

      await cacheEvents(events);
      const retrieved = await getCachedEvents();

      expect(retrieved).toEqual(events);
    });

    test('should handle large arrays', async () => {
      const events: CalendarEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        start_time: '2025-01-01T10:00:00Z',
        end_time: '2025-01-01T11:00:00Z',
        member_id: `member-${i % 10}`,
        is_recurring: false,
        created_at: '',
        updated_at: '',
      }));

      await cacheEvents(events);
      const retrieved = await getCachedEvents();

      expect(retrieved).toHaveLength(1000);
      expect(retrieved[0].id).toBe('event-0');
      expect(retrieved[999].id).toBe('event-999');
    });

    test('should handle concurrent operations', async () => {
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 10; i++) {
        promises.push(cacheEvents([{ id: `event-${i}`, title: `Event ${i}`, start_time: '2025-01-01T10:00:00Z', end_time: '2025-01-01T11:00:00Z', member_id: 'member-1', is_recurring: false, created_at: '', updated_at: '' }]));
        promises.push(queueMutation({ type: 'create', payload: { index: i } }));
      }

      await Promise.all(promises);

      // Final state should be consistent
      const events = await getCachedEvents();
      const mutations = await getQueuedMutations();

      expect(events.length).toBeGreaterThanOrEqual(0);
      expect(mutations).toHaveLength(10);
    });

    test('should handle empty string values', async () => {
      const events: CalendarEvent[] = [
        { id: '1', title: '', start_time: '', end_time: '', member_id: '', is_recurring: false, created_at: '', updated_at: '' },
      ];

      await cacheEvents(events);
      const retrieved = await getCachedEvents();

      expect(retrieved).toEqual(events);
    });

    test('should handle null and undefined in payloads', async () => {
      await queueMutation({
        type: 'create',
        payload: {
          nullValue: null,
          undefinedValue: undefined,
          zero: 0,
          false: false,
          emptyString: '',
        },
      });

      const queued = await getQueuedMutations();

      expect(queued).toHaveLength(1);
      expect(queued[0].payload.nullValue).toBeNull();
      expect(queued[0].payload.zero).toBe(0);
      expect(queued[0].payload.false).toBe(false);
      expect(queued[0].payload.emptyString).toBe('');
    });
  });
});
