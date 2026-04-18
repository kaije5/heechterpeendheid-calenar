'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Loader2 } from 'lucide-react';
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
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

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
      setMessageType('success');
      setMessage('Check your email for the magic link!');
      setEmail('');
    } catch (error) {
      console.error('Sign in error:', error);
      setMessageType('error');
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
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing out...
          </>
        ) : (
          'Sign Out'
        )}
      </button>
    );
  }

  if (showInput) {
    return (
      <form onSubmit={handleSignIn} className="flex flex-col gap-2 animate-in slide-in-from-top-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="border-4 border-ink p-2 bg-white font-mono text-sm w-48 focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="brutal-button flex items-center gap-2 bg-ink text-white text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {loading ? 'Sending...' : 'Send'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false);
              setMessage('');
            }}
            disabled={loading}
            className="brutal-button text-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {message && (
          <div className={`text-xs font-bold px-3 py-2 border-4 ${
            messageType === 'success'
              ? 'bg-green-100 border-green-600 text-green-800'
              : 'bg-red-100 border-red-600 text-red-800'
          }`}>
            {message}
          </div>
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
