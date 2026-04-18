'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        router.push('/?error=auth_failed');
        return;
      }

      if (session?.user) {
        // Member auto-created via trigger, just redirect
        router.push('/');
      } else {
        router.push('/?error=no_session');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ef]">
      <div className="brutal-card p-8 text-center">
        <h1 className="brutal-heading text-2xl mb-4">SIGNING IN...</h1>
        <p className="font-mono">Creating your household profile</p>
      </div>
    </div>
  );
}
