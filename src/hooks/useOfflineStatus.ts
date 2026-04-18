'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, syncPendingMutations, SyncStatus } from '@/lib/sync-manager';

export interface OfflineStatus extends SyncStatus {
  isSyncing: boolean;
  lastError: string | null;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingMutations: 0,
    lastSync: null,
    isSyncing: false,
    lastError: null,
  });

  const refreshStatus = useCallback(async () => {
    const syncStatus = await getSyncStatus();
    setStatus((prev) => ({ ...prev, ...syncStatus }));
  }, []);

  const triggerSync = useCallback(async () => {
    if (status.isSyncing || !status.isOnline) return;

    setStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      const result = await syncPendingMutations();
      if (result.failed > 0) {
        setStatus((prev) => ({
          ...prev,
          isSyncing: false,
          lastError: `Failed to sync ${result.failed} item(s)`,
        }));
      } else {
        setStatus((prev) => ({ ...prev, isSyncing: false }));
        await refreshStatus();
      }
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  }, [status.isSyncing, status.isOnline, refreshStatus]);

  useEffect(() => {
    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (status.isOnline && status.pendingMutations > 0 && !status.isSyncing) {
      triggerSync();
    }
  }, [status.isOnline, status.pendingMutations, status.isSyncing, triggerSync]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_EVENTS') {
          refreshStatus();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [refreshStatus]);

  return {
    ...status,
    refreshStatus,
    triggerSync,
  };
}
