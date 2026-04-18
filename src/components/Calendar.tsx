'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Users, AlertCircle } from 'lucide-react';
import { CalendarEvent, HouseholdMember, ViewMode } from '@/types';
import { getEvents } from '@/lib/supabase';
import EventModal from './EventModal';
import LoadingSpinner from './LoadingSpinner';
import Toast, { ToastType } from './Toast';
import { SyncStatusIndicator, SyncBadge } from './SyncStatusIndicator';

interface CalendarProps {
  members: HouseholdMember[];
  currentMember: HouseholdMember | null;
}

export default function Calendar({ members, currentMember }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return { start: weekStart, end: weekEnd };
      case 'day':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      default: // month
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return {
          start: startOfWeek(monthStart, { weekStartsOn: 1 }),
          end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
        };
    }
  };

  const dateRange = getDateRange();
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(dateRange.start, 'yyyy-MM-dd');
      const end = format(dateRange.end, 'yyyy-MM-dd');
      const data = await getEvents(start, end);
      setEvents(data);
    } catch {
      setToast({ message: 'Failed to load events. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter((event) => isSameDay(new Date(event.start_date), day));
  }

  function handlePrev() {
    switch (viewMode) {
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      default:
        setCurrentDate(subMonths(currentDate, 1));
    }
  }

  function handleNext() {
    switch (viewMode) {
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      default:
        setCurrentDate(addMonths(currentDate, 1));
    }
  }

  function handleToday() {
    setCurrentDate(new Date());
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

  function getHeaderTitle() {
    switch (viewMode) {
      case 'week':
        return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  }

  function renderMonthView() {
    return (
      <>
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
            const today = isToday(day);
            const currentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`calendar-day cursor-pointer ${today ? 'today' : ''} ${
                  !currentMonth ? 'opacity-40' : ''
                }`}
              >
                <span
                  className={`inline-block w-7 h-7 text-center leading-7 font-bold text-sm ${
                    today ? 'bg-ink text-white' : ''
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
      </>
    );
  }

  function renderWeekView() {
    const weekDaysFull = days.slice(0, 7);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDaysFull.map((day) => (
              <div
                key={day.toISOString()}
                className={`text-center p-3 font-bold ${
                  isToday(day) ? 'bg-ink text-white' : 'bg-gray-100'
                }`}
              >
                <div className="text-sm uppercase">{format(day, 'EEE')}</div>
                <div className="text-2xl">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-1">
            {weekDaysFull.map((day) => {
              const dayEvents = getEventsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className="min-h-[200px] border-2 border-ink p-2 cursor-pointer hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`event-chip w-full text-left ${event.member?.color || 'member-1'}`}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderDayView() {
    const dayEvents = getEventsForDay(currentDate);

    return (
      <div className="max-w-2xl mx-auto">
        <div className={`text-center p-4 mb-4 ${isToday(currentDate) ? 'bg-ink text-white' : 'bg-gray-100'}`}>
          <h2 className="text-2xl font-bold">{format(currentDate, 'EEEE')}</h2>
          <p className="text-xl">{format(currentDate, 'MMMM d, yyyy')}</p>
        </div>

        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="font-mono">No events scheduled</p>
              <p className="text-sm mt-2">Click to add an event</p>
            </div>
          ) : (
            dayEvents.map((event) => (
              <button
                key={event.id}
                onClick={(e) => handleEventClick(event, e)}
                className={`w-full text-left p-4 border-4 border-ink brutal-card hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${
                  event.member?.color === 'member-1' ? 'bg-amber-200' :
                  event.member?.color === 'member-2' ? 'bg-blue-200' :
                  'bg-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{event.title}</span>
                  <span className="text-sm font-mono opacity-70">
                    {event.member?.name}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm mt-2 opacity-80">{event.description}</p>
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={() => handleDayClick(currentDate)}
          className="w-full mt-4 py-4 border-4 border-dashed border-ink text-ink font-bold hover:bg-ink hover:text-white transition-colors"
        >
          + Add Event
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <SyncStatusIndicator />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="tape transition-transform hover:scale-[1.02] duration-200">
          <h1 className="brutal-heading text-2xl sm:text-4xl lg:text-5xl tracking-tighter">
            {getHeaderTitle()}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center border-4 border-ink bg-white">
            {(['month', 'week', 'day'] as ViewMode[]).map((mode, index) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`brutal-button !shadow-none !border-0 capitalize text-sm transition-all ${
                  viewMode === mode
                    ? 'bg-ink text-white translate-x-[2px] translate-y-[2px]'
                    : 'bg-white hover:bg-paper-gray'
                } ${index < 2 ? 'border-r-4 border-ink' : ''}`}
              >
                <span className="flex items-center gap-1">
                  {mode === 'month' && <CalendarDays className="w-4 h-4" />}
                  {mode}
                </span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center border-4 border-ink">
            <button
              onClick={handlePrev}
              className="brutal-button !shadow-none !border-0 border-r-4 border-ink"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="brutal-button !shadow-none !border-0 border-r-4 border-ink text-sm px-3"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="brutal-button !shadow-none !border-0"
            >
              <ChevronRight className="w-5 h-5" />
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
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Member Legend */}
      {members.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 border-4 border-ink bg-paper-cream">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ink-gray">
              <Users className="w-4 h-4" />
              <span className="uppercase">Household:</span>
            </div>
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 border-2 border-ink shadow-[1px_1px_0_#0a0a0a] ${
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
          <SyncBadge />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 mb-6 border-4 border-amber-500 bg-amber-50 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">No household members found. Ask your admin to add members.</p>
        </div>
      )}

      {/* Calendar Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 border-4 border-ink bg-paper-cream min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading events..." />
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      )}

      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedDate={selectedDate}
          event={selectedEvent}
          members={members}
          currentMember={currentMember}
          onToast={(message, type) => setToast({ message, type })}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
