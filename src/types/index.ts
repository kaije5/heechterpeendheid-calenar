export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  color: 'member-1' | 'member-2' | 'member-3';
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_all_day: boolean;
  member_id: string;
  member?: HouseholdMember;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_all_day: boolean;
  member_id: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

export type ViewMode = 'month' | 'week' | 'day';
