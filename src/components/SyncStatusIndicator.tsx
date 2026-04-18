'use client';

import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, RefreshCw, AlertTriangle, Check } from 'lucide-react';

export function SyncStatusIndicator() {
  const {
    isOnline,
    pendingMutations,
    isSyncing,
    lastError,
    triggerSync,
  } = useOfflineStatus();

  if (isSyncing) {
    return (
      <div className="offline-banner syncing">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Syncing {pendingMutations} pending change(s)...
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="offline-banner error" role="alert">
        <AlertTriangle className="w-4 h-4" />
        {lastError}
        <button onClick={triggerSync} className="underline ml-2">Retry</button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="offline-banner" role="alert">
        <WifiOff className="w-4 h-4" />
        Offline — {pendingMutations > 0
          ? `${pendingMutations} change(s) pending`
          : 'Changes will sync when online'}
      </div>
    );
  }

  if (pendingMutations > 0) {
    return (
      <div className="offline-banner syncing">
        <button
          onClick={triggerSync}
          className="flex items-center gap-2 bg-transparent border-none text-white cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {pendingMutations} pending — click to sync
        </button>
      </div>
    );
  }

  return null;
}

export function SyncBadge() {
  const { isOnline, pendingMutations, isSyncing } = useOfflineStatus();

  if (isSyncing) {
    return (
      <div className="sync-indicator syncing">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Syncing
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="sync-indicator offline">
        <WifiOff className="w-3 h-3" />
        Offline
      </div>
    );
  }

  if (pendingMutations > 0) {
    return (
      <div className="sync-indicator pending">
        <span className="sync-dot" />
        {pendingMutations} pending
      </div>
    );
  }

  return (
    <div className="sync-indicator">
      <Check className="w-3 h-3" />
      Synced
    </div>
  );
}
