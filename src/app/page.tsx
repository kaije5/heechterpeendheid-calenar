import Calendar from '@/components/Calendar';
import { getMembers } from '@/lib/supabase';

export default async function Home() {
  const members = await getMembers().catch(() => []);

  return (
    <main className="min-h-screen py-8 px-4">
      <header className="max-w-6xl mx-auto mb-12">
        <div className="torn-edge pb-8">
          <h1 className="brutal-heading text-5xl sm:text-7xl tracking-tighter">
            HOUSEHOLD
            <br />
            CALENDAR
          </h1>
          <p className="text-lg font-bold mt-4 max-w-md">
            Keep track of what everyone is doing. Click any day to add an event.
          </p>
        </div>
      </header>

      <Calendar members={members} currentMember={null} />

      <footer className="max-w-6xl mx-auto mt-16 pt-8 border-t-4 border-ink">
        <p className="text-sm font-bold text-center">
          HEECHTERPEENDHEID CALENAR • BUILT WITH NEXT.JS + SUPABASE
        </p>
      </footer>
    </main>
  );
}
