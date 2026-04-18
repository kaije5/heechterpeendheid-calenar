'use client';

import { useState, useEffect } from 'react';
import { Lock, LogOut } from 'lucide-react';
import { signOut, getCurrentUser } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface AuthButtonProps {
  onAuthChange?: () => void;
}

export default function AuthButton({ onAuthChange }: AuthButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((currentUser) => {
      if (!cancelled) setUser(currentUser);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      onAuthChange?.();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="brutal-button flex items-center gap-2 text-sm"
      >
        {loading ? (
          <span className="animate-spin">...</span>
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            Sign Out
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/login')}
      className="brutal-button flex items-center gap-2 bg-ink text-white"
    >
      <Lock className="w-4 h-4" />
      Sign In
    </button>
  );
}
