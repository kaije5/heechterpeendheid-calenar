'use client';

import { useState, useEffect } from 'react';
import { Apple } from 'lucide-react';
import { getCurrentUser, signInWithApple, signOut } from '@/lib/supabase';

interface AuthButtonProps {
  onAuthChange?: () => void;
}

export default function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  async function handleSignIn() {
    setLoading(true);
    try {
      await signInWithApple();
      // OAuth redirects, so this won't execute immediately
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Make sure Supabase is configured.');
    } finally {
      setLoading(false);
    }
  }

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
        {loading ? '...' : 'Sign Out'}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="brutal-button flex items-center gap-2 bg-ink text-white"
    >
      <Apple className="w-4 h-4" />
      {loading ? '...' : 'Sign in with Apple'}
    </button>
  );
}
