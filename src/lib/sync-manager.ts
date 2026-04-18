'use client';

import { createEvent, updateEvent as updateEventDb, deleteEvent } from './supabase';
import {
  getQueuedMutations,
  removeMutation,
  updateCachedEvent,
  removeCachedEvent,
  setLastSyncTime,
} from './offline-db';
import { CalendarEvent, CreateEventInput, UpdateEventInput } from '@/types';

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

function getOnlineStatus(): boolean {
  return isOnline;
}

function setupOnlineListener(onStatusChange: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    isOnline = true;
    onStatusChange(true);
  };

  const handleOffline = () => {
    isOnline = false;
    onStatusChange(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

async function applyMutation(mutation: {
  type: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
}): Promise<boolean> {
  try {
    switch (mutation.type) {
      case 'create':
        await createEvent(mutation.payload as unknown as CreateEventInput);
        break;

      case 'update': {
        const { eventId, ...updateData } = mutation.payload as unknown as {
          eventId: string;
        } & UpdateEventInput;
        await updateEventDb(eventId, updateData);
        break;
      }

      case 'delete':
        await deleteEvent(mutation.payload.eventId as string);
        break;

      default:
        return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function syncPendingMutations(): Promise<{ synced: number; failed: number }> {
  if (!getOnlineStatus()) {
    return { synced: 0, failed: 0 };
  }

  const mutations = await getQueuedMutations();
  let synced = 0;
  let failed = 0;

  for (const mutation of mutations) {
    const success = await applyMutation(mutation);
    if (success) {
      if (mutation.id !== undefined) {
        await removeMutation(mutation.id);
      }
      synced++;
    } else {
      failed++;
    }
  }

  if (failed === 0 && mutations.length > 0) {
    await setLastSyncTime(new Date().toISOString());
  }

  return { synced, failed };
}

export async function optimisticUpdate(
  eventId: string,
  event: CalendarEvent
): Promise<void> {
  await updateCachedEvent(event);
}

export async function optimisticDelete(eventId: string): Promise<void> {
  await removeCachedEvent(eventId);
}

export interface SyncStatus {
  isOnline: boolean;
  pendingMutations: number;
  lastSync: string | null;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const mutations = await getQueuedMutations();
  const lastSync = await import('./offline-db').then(m => m.getLastSyncTime());

  return {
    isOnline: getOnlineStatus(),
    pendingMutations: mutations.length,
    lastSync,
  };
}

export function useSyncStatus() {
  return {
    isOnline: getOnlineStatus(),
    syncPendingMutations,
    getSyncStatus,
    setupOnlineListener,
  };
}
