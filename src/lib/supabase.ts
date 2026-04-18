import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CalendarEvent, HouseholdMember, CreateEventInput, UpdateEventInput } from '@/types';

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

// Export singleton instance for direct access
export const supabase = getSupabase();

// Mock data for development without Supabase
const mockMembers: HouseholdMember[] = [
  { id: '1', name: 'Member 1', email: 'm1@household.local', color: 'member-1', created_at: new Date().toISOString() },
  { id: '2', name: 'Member 2', email: 'm2@household.local', color: 'member-2', created_at: new Date().toISOString() },
  { id: '3', name: 'Member 3', email: 'm3@household.local', color: 'member-3', created_at: new Date().toISOString() },
];

const mockEvents: CalendarEvent[] = [];

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Events
export async function getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  if (!isSupabaseConfigured()) {
    return mockEvents.filter(e => e.start_date >= startDate && e.start_date <= endDate);
  }

  const { data, error } = await getSupabase()
    .from('events')
    .select('*, member:members(*)')
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  if (!isSupabaseConfigured()) {
    return mockEvents.find(e => e.id === id) || null;
  }

  const { data, error } = await getSupabase()
    .from('events')
    .select('*, member:members(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to get event:', error);
    return null;
  }
  return data;
}

export async function createEvent(event: CreateEventInput): Promise<CalendarEvent> {
  if (!isSupabaseConfigured()) {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      ...event,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member: mockMembers.find(m => m.id === event.member_id),
    };
    // Immutable update
    mockEvents.push(newEvent);
    return newEvent;
  }

  const { data, error } = await getSupabase()
    .from('events')
    .insert(event)
    .select('*, member:members(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, event: UpdateEventInput): Promise<CalendarEvent> {
  if (!isSupabaseConfigured()) {
    const index = mockEvents.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Event not found');
    mockEvents[index] = { ...mockEvents[index], ...event, updated_at: new Date().toISOString() };
    return mockEvents[index];
  }

  const { data, error } = await getSupabase()
    .from('events')
    .update(event)
    .eq('id', id)
    .select('*, member:members(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const index = mockEvents.findIndex(e => e.id === id);
    if (index !== -1) mockEvents.splice(index, 1);
    return;
  }

  const { error } = await getSupabase().from('events').delete().eq('id', id);
  if (error) throw error;
}

// Members
export async function getMembers(): Promise<HouseholdMember[]> {
  if (!isSupabaseConfigured()) {
    return mockMembers;
  }

  const { data, error } = await getSupabase().from('members').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function getMemberById(id: string): Promise<HouseholdMember | null> {
  if (!isSupabaseConfigured()) {
    return mockMembers.find(m => m.id === id) || null;
  }

  const { data, error } = await getSupabase().from('members').select('*').eq('id', id).single();
  if (error) {
    console.error('Failed to get member:', error);
    return null;
  }
  return data;
}

// Auth
export async function signInWithApple() {
  if (!isSupabaseConfigured()) {
    throw new Error('Auth requires Supabase configuration');
  }
  // Guard for SSR - window only available in browser
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured()) return;
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const { data: { user }, error } = await getSupabase().auth.getUser();
  if (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
  return user;
}

export async function getCurrentMember(): Promise<HouseholdMember | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await getSupabase()
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Failed to get current member:', error);
    return null;
  }
  return data;
}
