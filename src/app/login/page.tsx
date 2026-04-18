'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ef]">
      <div className="brutal-card p-8 max-w-md w-full">
        <h1 className="brutal-heading text-3xl mb-6 text-center">LOGIN</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="border-4 border-ink p-3 bg-white font-mono text-sm w-full focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="border-4 border-ink p-3 bg-white font-mono text-sm w-full focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-100 border-4 border-red-600 text-red-800 px-4 py-2 font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brutal-button bg-ink text-white py-3 text-lg font-bold disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="font-mono text-sm mb-2">Use your email + password to login</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            disabled={loading}
            className="text-sm font-mono underline text-ink/70 hover:text-ink"
          >
            Back to calendar
          </button>
        </div>
      </div>
    </div>
  );
}
