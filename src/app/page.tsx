'use client';

import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';
import AuthButton from '@/components/AuthButton';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getMembers, getCurrentMember } from '@/lib/supabase';
import { HouseholdMember } from '@/types';

export default function Home() {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [currentMember, setCurrentMember] = useState<HouseholdMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allMembers, member] = await Promise.all([
        getMembers(),
        getCurrentMember(),
      ]);
      setMembers(allMembers);
      setCurrentMember(member);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen py-8 px-4">
        <header className="max-w-6xl mx-auto mb-12">
          <div className="torn-edge pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="brutal-heading text-5xl sm:text-7xl tracking-tighter">
                  HEECHTERPEENDHEID
                  <br />
                  CALENAR
                </h1>
                <p className="text-lg font-bold mt-4 max-w-md">
                  Keep track of what everyone is doing. Click any day to add an event.
                </p>
              </div>
              <AuthButton onAuthChange={loadData} />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="max-w-6xl mx-auto text-center py-12">
            <p className="font-mono text-lg">Loading...</p>
          </div>
        ) : (
          <Calendar members={members} currentMember={currentMember} />
        )}

        <footer className="max-w-6xl mx-auto mt-16 pt-8 border-t-4 border-ink">
          <p className="text-sm font-bold text-center">
            HEECHTERPEENDHEID CALENAR • BUILT WITH NEXT.JS + SUPABASE
          </p>
        </footer>
      </main>
    </ProtectedRoute>
  );
}
