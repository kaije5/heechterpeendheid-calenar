'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getCurrentUser } from '@/lib/supabase';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        router.push(redirect);
      }
    };
    checkAuth();
  }, [redirect]);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f3ef]">
      <div className="brutal-card p-8 max-w-md w-full animate-in slide-in duration-300">
        <h1 className="brutal-heading text-3xl mb-6 text-center">LOGIN</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-bold mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="border-4 border-ink p-3 bg-white font-mono text-sm w-full focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] focus:border-ink transition-all"
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
              className="border-4 border-ink p-3 bg-white font-mono text-sm w-full focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] focus:border-ink transition-all"
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
            className="brutal-button bg-ink text-white py-3 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t-4 border-ink">
          <p className="font-mono text-sm mb-4 text-center">
            Use your email + password to login
          </p>
          <button
            type="button"
            onClick={() => router.push(redirect)}
            disabled={loading}
            className="text-sm font-mono underline text-ink-light hover:text-ink transition-colors w-full text-center"
          >
            Back to calendar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
