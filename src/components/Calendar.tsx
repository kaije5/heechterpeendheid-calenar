'use client';

import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarEvent, HouseholdMember, ViewMode } from '@/types';
import { getEvents } from '@/lib/supabase';
import EventModal from './EventModal';

interface CalendarProps {
  members: HouseholdMember[];
}

export default function Calendar({ members }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  async function loadEvents() {
    setLoading(true);
    try {
      const start = format(calendarStart, 'yyyy-MM-dd');
      const end = format(calendarEnd, 'yyyy-MM-dd');
      const data = await getEvents(start, end);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter((event) => isSameDay(new Date(event.start_date), day));
  }

  function handlePrevMonth() {
    setCurrentDate(subMonths(currentDate, 1));
  }

  function handleNextMonth() {
    setCurrentDate(addMonths(currentDate, 1));
  }

  function handleDayClick(day: Date) {
    setSelectedDate(day);
    setSelectedEvent(null);
    setIsModalOpen(true);
  }

  function handleEventClick(event: CalendarEvent, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(new Date(event.start_date));
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    loadEvents();
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="tape">
          <h1 className="brutal-heading text-4xl sm:text-6xl tracking-tighter">
            {format(currentDate, 'MMMM')}
          </h1>
          <p className="text-xl font-bold mt-1">{format(currentDate, 'yyyy')}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center border-4 border-ink">
            <button
              onClick={handlePrevMonth}
              className="brutal-button !shadow-none !border-0 border-r-4 border-ink"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextMonth}
              className="brutal-button !shadow-none !border-0"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="brutal-button flex items-center gap-2 bg-primary-yellow"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      {/* Member Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 border-2 border-ink ${
                member.color === 'member-1'
                  ? 'bg-member-1'
                  : member.color === 'member-2'
                  ? 'bg-member-2'
                  : 'bg-member-3'
              }`}
            />
            <span className="text-sm font-bold uppercase">{member.name}</span>
          </div>
        ))}
      </div>

      {/* Week Days Header */}
      <div className="calendar-grid mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="bg-ink text-white p-2 text-center font-bold text-sm uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`calendar-day cursor-pointer ${isToday ? 'today' : ''} ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
            >
              <span
                className={`inline-block w-7 h-7 text-center leading-7 font-bold text-sm ${
                  isToday ? 'bg-ink text-white' : ''
                }`}
              >
                {format(day, 'd')}
              </span>

              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`event-chip ${event.member?.color || 'member-1'}`}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs font-bold text-ink-gray">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-8 font-bold">Loading...</div>
      )}

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          event={selectedEvent}
          members={members}
        />
      )}
    </div>
  );
}
