'use client';

import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { getCurrentUser, signInWithEmail, signOut } from '@/lib/supabase';

interface AuthButtonProps {
  onAuthChange?: () => void;
}

export default function AuthButton({ onAuthChange }: AuthButtonProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      await signInWithEmail(email.trim());
      setMessage('Check your email for the magic link!');
      setEmail('');
      setShowInput(false);
    } catch (error) {
      console.error('Sign in error:', error);
      setMessage('Failed to send magic link. Make sure Supabase is configured.');
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

  if (showInput) {
    return (
      <form onSubmit={handleSignIn} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="border-4 border-ink p-2 bg-white font-mono text-sm w-48"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="brutal-button flex items-center gap-2 bg-ink text-white text-sm"
          >
            <Mail className="w-4 h-4" />
            {loading ? '...' : 'Send'}
          </button>
          <button
            type="button"
            onClick={() => setShowInput(false)}
            className="brutal-button text-sm"
          >
            Cancel
          </button>
        </div>
        {message && (
          <p className="text-xs font-bold text-ink">{message}</p>
        )}
      </form>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="brutal-button flex items-center gap-2 bg-ink text-white"
    >
      <Mail className="w-4 h-4" />
      Sign in
    </button>
  );
}
