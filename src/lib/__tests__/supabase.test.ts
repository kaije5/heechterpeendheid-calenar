/**
 * Supabase module tests
 * Tests the Supabase client operations with mocked responses
 */

// Mock crypto.randomUUID for consistent test IDs
const mockUUID = 'test-uuid-1234';
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: jest.fn().mockReturnValue(mockUUID),
  },
  writable: true,
});

// Mock Supabase client
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockAuthSignIn = jest.fn();
const mockAuthSignUp = jest.fn();
const mockAuthSignOut = jest.fn();
const mockAuthGetUser = jest.fn();

const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    signInWithPassword: mockAuthSignIn,
    signUp: mockAuthSignUp,
    signOut: mockAuthSignOut,
    getUser: mockAuthGetUser,
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockImplementation(() => mockSupabaseClient),
}));

import type { CalendarEvent, HouseholdMember, CreateEventInput, UpdateEventInput } from '@/types';

// Mock data for tests
const mockSupabaseEvent: CalendarEvent = {
  id: 'event-1',
  title: 'Supabase Event',
  start_date: '2024-01-15',
  is_all_day: true,
  member_id: 'member-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  member: {
    id: 'member-1',
    name: 'Test Member',
    email: 'test@example.com',
    color: 'member-1',
    created_at: '2024-01-01T00:00:00Z',
  },
};

const mockSupabaseMember: HouseholdMember = {
  id: 'member-1',
  name: 'Test Member',
  email: 'test@example.com',
  color: 'member-1',
  created_at: '2024-01-01T00:00:00Z',
};

function resetMockChain() {
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({
    gte: mockGte,
    order: mockOrder,
    eq: mockEq,
    single: mockSingle,
  });

  mockGte.mockReturnValue({
    lte: mockLte,
    order: mockOrder,
    eq: mockEq,
  });

  mockLte.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
  });

  mockOrder.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
    single: mockSingle,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    order: mockOrder,
    eq: mockEq,
    select: mockSelect,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
  });
}

describe('supabase module', () => {
  let supabaseModule: typeof import('@/lib/supabase');

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    resetMockChain();
    supabaseModule = await import('@/lib/supabase');
  });

  describe('Events', () => {
    describe('getEvents', () => {
      test('queries database with date filters', async () => {
        const mockData = [mockSupabaseEvent];
        mockLte.mockReturnValue({
          order: mockOrder,
        });
        mockOrder.mockResolvedValue({ data: mockData, error: null });

        const events = await supabaseModule.getEvents('2024-01-01', '2024-01-31');

        expect(mockFrom).toHaveBeenCalledWith('events');
        expect(mockSelect).toHaveBeenCalledWith('*, member:members(*)');
        expect(mockGte).toHaveBeenCalledWith('start_date', '2024-01-01');
        expect(mockLte).toHaveBeenCalledWith('start_date', '2024-01-31');
        expect(mockOrder).toHaveBeenCalledWith('start_date', { ascending: true });
        expect(events).toEqual(mockData);
      });

      test('returns empty array when no data', async () => {
        mockLte.mockReturnValue({
          order: mockOrder,
        });
        mockOrder.mockResolvedValue({ data: null, error: null });

        const events = await supabaseModule.getEvents('2024-01-01', '2024-01-31');

        expect(events).toEqual([]);
      });

      test('throws error when query fails', async () => {
        mockLte.mockReturnValue({
          order: mockOrder,
        });
        mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

        await expect(
          supabaseModule.getEvents('2024-01-01', '2024-01-31')
        ).rejects.toThrow('DB error');
      });
    });

    describe('getEventById', () => {
      test('queries database with id filter', async () => {
        mockSingle.mockResolvedValue({ data: mockSupabaseEvent, error: null });

        const event = await supabaseModule.getEventById('event-1');

        expect(mockFrom).toHaveBeenCalledWith('events');
        expect(mockSelect).toHaveBeenCalledWith('*, member:members(*)');
        expect(mockEq).toHaveBeenCalledWith('id', 'event-1');
        expect(event).toEqual(mockSupabaseEvent);
      });

      test('returns null when event not found', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        });

        const event = await supabaseModule.getEventById('non-existent');

        expect(event).toBeNull();
      });

      test('returns null on error', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: new Error('Connection failed'),
        });

        const event = await supabaseModule.getEventById('event-1');

        expect(event).toBeNull();
      });
    });

    describe('createEvent', () => {
      test('inserts event and returns created data', async () => {
        const input: CreateEventInput = {
          title: 'New Event',
          start_date: '2024-01-15',
          is_all_day: true,
          member_id: '1',
        };

        mockSingle.mockResolvedValue({ data: mockSupabaseEvent, error: null });

        const event = await supabaseModule.createEvent(input);

        expect(mockFrom).toHaveBeenCalledWith('events');
        expect(mockInsert).toHaveBeenCalledWith(input);
        expect(event).toEqual(mockSupabaseEvent);
      });

      test('throws error when insert fails', async () => {
        const input: CreateEventInput = {
          title: 'New Event',
          start_date: '2024-01-15',
          is_all_day: true,
          member_id: '1',
        };

        mockSingle.mockResolvedValue({
          data: null,
          error: new Error('Insert failed'),
        });

        await expect(supabaseModule.createEvent(input)).rejects.toThrow('Insert failed');
      });
    });

    describe('updateEvent', () => {
      test('updates event and returns updated data', async () => {
        const update: UpdateEventInput = { title: 'Updated Title' };

        mockSingle.mockResolvedValue({ data: mockSupabaseEvent, error: null });

        const event = await supabaseModule.updateEvent('event-1', update);

        expect(mockFrom).toHaveBeenCalledWith('events');
        expect(mockUpdate).toHaveBeenCalledWith(update);
        expect(event).toEqual(mockSupabaseEvent);
      });

      test('throws error when update fails', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: new Error('Update failed'),
        });

        await expect(
          supabaseModule.updateEvent('event-1', { title: 'New' })
        ).rejects.toThrow('Update failed');
      });
    });

    describe('deleteEvent', () => {
      test('deletes event from database', async () => {
        const mockDeleteChain = {
          eq: jest.fn().mockResolvedValue({ error: null }),
        };
        mockDelete.mockReturnValue(mockDeleteChain);

        await supabaseModule.deleteEvent('event-1');

        expect(mockFrom).toHaveBeenCalledWith('events');
        expect(mockDelete).toHaveBeenCalled();
      });

      test('throws error when delete fails', async () => {
        const mockDeleteChain = {
          eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        };
        mockDelete.mockReturnValue(mockDeleteChain);

        await expect(supabaseModule.deleteEvent('event-1')).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Members', () => {
    describe('getMembers', () => {
      test('queries members table', async () => {
        mockOrder.mockResolvedValue({
          data: [mockSupabaseMember],
          error: null,
        });

        const members = await supabaseModule.getMembers();

        expect(mockFrom).toHaveBeenCalledWith('members');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockOrder).toHaveBeenCalledWith('created_at');
        expect(members).toEqual([mockSupabaseMember]);
      });

      test('returns empty array when no data', async () => {
        mockOrder.mockResolvedValue({ data: null, error: null });

        const members = await supabaseModule.getMembers();

        expect(members).toEqual([]);
      });

      test('throws error when query fails', async () => {
        mockOrder.mockResolvedValue({ data: null, error: new Error('DB error') });

        await expect(supabaseModule.getMembers()).rejects.toThrow('DB error');
      });
    });

    describe('getMemberById', () => {
      test('queries member by id', async () => {
        mockSingle.mockResolvedValue({ data: mockSupabaseMember, error: null });

        const member = await supabaseModule.getMemberById('member-1');

        expect(mockFrom).toHaveBeenCalledWith('members');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockEq).toHaveBeenCalledWith('id', 'member-1');
        expect(member).toEqual(mockSupabaseMember);
      });

      test('returns null when member not found', async () => {
        mockSingle.mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        });

        const member = await supabaseModule.getMemberById('non-existent');

        expect(member).toBeNull();
      });
    });
  });

  describe('Auth', () => {
    describe('signIn', () => {
      test('calls signInWithPassword with trimmed email', async () => {
        const mockData = { user: { id: 'user-1', email: 'test@example.com' }, session: {} };
        mockAuthSignIn.mockResolvedValue({ data: mockData, error: null });

        const result = await supabaseModule.signIn('  test@example.com  ', 'password123');

        expect(mockAuthSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result).toEqual(mockData);
      });

      test('throws error when sign in fails', async () => {
        mockAuthSignIn.mockResolvedValue({
          data: null,
          error: new Error('Invalid credentials'),
        });

        await expect(
          supabaseModule.signIn('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid credentials');
      });
    });

    describe('signUp', () => {
      test('calls signUp with trimmed email', async () => {
        const mockData = { user: { id: 'user-1', email: 'new@example.com' }, session: {} };
        mockAuthSignUp.mockResolvedValue({ data: mockData, error: null });

        const result = await supabaseModule.signUp('  new@example.com  ', 'password123');

        expect(mockAuthSignUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
        });
        expect(result).toEqual(mockData);
      });

      test('throws error when sign up fails', async () => {
        mockAuthSignUp.mockResolvedValue({
          data: null,
          error: new Error('Email already registered'),
        });

        await expect(
          supabaseModule.signUp('existing@example.com', 'password123')
        ).rejects.toThrow('Email already registered');
      });
    });

    describe('signOut', () => {
      test('calls auth.signOut', async () => {
        mockAuthSignOut.mockResolvedValue({ error: null });

        await supabaseModule.signOut();

        expect(mockAuthSignOut).toHaveBeenCalled();
      });

      test('throws error when sign out fails', async () => {
        mockAuthSignOut.mockResolvedValue({ error: new Error('Sign out failed') });

        await expect(supabaseModule.signOut()).rejects.toThrow('Sign out failed');
      });
    });

    describe('getCurrentUser', () => {
      test('returns user when authenticated', async () => {
        const mockUser = { id: 'user-1', email: 'test@example.com' };
        mockAuthGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

        const user = await supabaseModule.getCurrentUser();

        expect(mockAuthGetUser).toHaveBeenCalled();
        expect(user).toEqual(mockUser);
      });

      test('returns null when not authenticated', async () => {
        mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const user = await supabaseModule.getCurrentUser();

        expect(user).toBeNull();
      });

      test('returns null on error', async () => {
        mockAuthGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Session expired'),
        });

        const user = await supabaseModule.getCurrentUser();

        expect(user).toBeNull();
      });
    });

    describe('getCurrentMember', () => {
      test('returns member when user is authenticated', async () => {
        const mockUser = { id: 'user-1', email: 'test@example.com' };
        mockAuthGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
        mockSingle.mockResolvedValue({ data: mockSupabaseMember, error: null });

        const member = await supabaseModule.getCurrentMember();

        expect(mockFrom).toHaveBeenCalledWith('members');
        expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
        expect(member).toEqual(mockSupabaseMember);
      });

      test('returns null when no user is logged in', async () => {
        mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const member = await supabaseModule.getCurrentMember();

        expect(member).toBeNull();
      });

      test('returns null when member not found', async () => {
        const mockUser = { id: 'user-1', email: 'test@example.com' };
        mockAuthGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
        mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

        const member = await supabaseModule.getCurrentMember();

        expect(member).toBeNull();
      });
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles empty string dates in getEvents', async () => {
      mockLte.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: [], error: null });

      await supabaseModule.getEvents('', '');

      expect(mockGte).toHaveBeenCalledWith('start_date', '');
      expect(mockLte).toHaveBeenCalledWith('start_date', '');
    });

    test('handles special characters in event title', async () => {
      const input: CreateEventInput = {
        title: 'Event with <script>alert("XSS")</script>',
        start_date: '2024-01-15',
        is_all_day: true,
        member_id: '1',
      };

      mockSingle.mockResolvedValue({
        data: { ...mockSupabaseEvent, title: input.title },
        error: null,
      });

      const event = await supabaseModule.createEvent(input);

      expect(event.title).toBe('Event with <script>alert("XSS")</script>');
    });

    test('handles unicode in event descriptions', async () => {
      const input: CreateEventInput = {
        title: 'Unicode Test',
        description: 'Event with emojis 🎉 and ñoño characters',
        start_date: '2024-01-15',
        is_all_day: true,
        member_id: '1',
      };

      mockSingle.mockResolvedValue({
        data: { ...mockSupabaseEvent, description: input.description },
        error: null,
      });

      const event = await supabaseModule.createEvent(input);

      expect(event.description).toBe('Event with emojis 🎉 and ñoño characters');
    });

    test('handles very long event titles', async () => {
      const longTitle = 'A'.repeat(1000);
      const input: CreateEventInput = {
        title: longTitle,
        start_date: '2024-01-15',
        is_all_day: true,
        member_id: '1',
      };

      mockSingle.mockResolvedValue({
        data: { ...mockSupabaseEvent, title: longTitle },
        error: null,
      });

      const event = await supabaseModule.createEvent(input);

      expect(event.title).toHaveLength(1000);
    });

    test('handles concurrent event operations', async () => {
      const inputs: CreateEventInput[] = [
        { title: 'Event 1', start_date: '2024-01-01', is_all_day: true, member_id: '1' },
        { title: 'Event 2', start_date: '2024-01-02', is_all_day: true, member_id: '1' },
        { title: 'Event 3', start_date: '2024-01-03', is_all_day: true, member_id: '1' },
      ];

      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: { ...mockSupabaseEvent, id: `event-${callCount}`, title: `Event ${callCount}` },
          error: null,
        });
      });

      const results = await Promise.all(inputs.map((input) => supabaseModule.createEvent(input)));

      expect(results).toHaveLength(3);
      expect(callCount).toBe(3);
    });
  });
});
