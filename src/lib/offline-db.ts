import { CalendarEvent, HouseholdMember } from '@/types';

const DB_NAME = 'calenar-offline';
const DB_VERSION = 1;

const STORES = {
  cache: 'cache',
  syncQueue: 'sync-queue',
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.cache)) {
        db.createObjectStore(STORES.cache, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export async function getCachedEvents(): Promise<CalendarEvent[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readonly');
    const store = tx.objectStore(STORES.cache);
    const request = store.getAll('events');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function cacheEvents(events: CalendarEvent[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readwrite');
    const store = tx.objectStore(STORES.cache);

    store.put({ id: 'events', ...events });
    resolve();
  });
}

export async function getCachedMembers(): Promise<HouseholdMember[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readonly');
    const store = tx.objectStore(STORES.cache);
    const request = store.get('members');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.members : []);
    };
  });
}

export async function cacheMembers(members: HouseholdMember[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readwrite');
    const store = tx.objectStore(STORES.cache);
    store.put({ id: 'members', members });
    resolve();
  });
}

export async function updateCachedEvent(event: CalendarEvent): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readwrite');
    const store = tx.objectStore(STORES.cache);
    const getRequest = store.getAll('events');

    getRequest.onsuccess = () => {
      const events = getRequest.result as CalendarEvent[];
      const index = events.findIndex((e) => e.id === event.id);

      if (index >= 0) {
        events[index] = event;
      } else {
        events.push(event);
      }

      const putTx = db.transaction(STORES.cache, 'readwrite');
      const putStore = putTx.objectStore(STORES.cache);
      putStore.put({ id: 'events', ...events });
      resolve();
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function removeCachedEvent(eventId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readwrite');
    const store = tx.objectStore(STORES.cache);
    const getRequest = store.getAll('events');

    getRequest.onsuccess = () => {
      const events = getRequest.result as CalendarEvent[];
      const filtered = events.filter((e) => e.id !== eventId);

      const putTx = db.transaction(STORES.cache, 'readwrite');
      const putStore = putTx.objectStore(STORES.cache);
      putStore.put({ id: 'events', ...filtered });
      resolve();
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

export interface QueuedMutation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  timestamp: number;
}

export async function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.syncQueue, 'readwrite');
    const store = tx.objectStore(STORES.syncQueue);
    store.add({
      ...mutation,
      timestamp: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.syncQueue, 'readonly');
    const store = tx.objectStore(STORES.syncQueue);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function clearMutationQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.syncQueue, 'readwrite');
    const store = tx.objectStore(STORES.syncQueue);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeMutation(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.syncQueue, 'readwrite');
    const store = tx.objectStore(STORES.syncQueue);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLastSyncTime(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readonly');
    const store = tx.objectStore(STORES.cache);
    const request = store.get('lastSync');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.lastSync || null);
    };
  });
}

export async function setLastSyncTime(time: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.cache, 'readwrite');
    const store = tx.objectStore(STORES.cache);
    store.put({ id: 'lastSync', lastSync: time });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
