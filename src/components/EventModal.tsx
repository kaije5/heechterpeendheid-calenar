'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Trash2, Loader2, CalendarDays, Clock, User, AlignLeft } from 'lucide-react';
import { CalendarEvent, HouseholdMember } from '@/types';
import { createEvent, updateEvent, deleteEvent } from '@/lib/supabase';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  event: CalendarEvent | null;
  members: HouseholdMember[];
  currentMember: HouseholdMember | null;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function EventModal({
  isOpen,
  onClose,
  selectedDate,
  event,
  members,
  currentMember,
  onToast,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memberId, setMemberId] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setMemberId(event.member_id);
      setIsAllDay(event.is_all_day);
    } else {
      setTitle('');
      setDescription('');
      setMemberId(currentMember?.id || members[0]?.id || '');
      setIsAllDay(true);
    }
    setIsDirty(false);
    setError('');
  }, [event, members, currentMember, isOpen]);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
  }, [onClose, loading]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    setIsDirty(true);
  };

  const handleMemberChange = (id: string) => {
    setMemberId(id);
    setIsDirty(true);
  };

  const handleAllDayChange = (checked: boolean) => {
    setIsAllDay(checked);
    setIsDirty(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;

    setLoading(true);
    setError('');

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: format(selectedDate, 'yyyy-MM-dd'),
        is_all_day: isAllDay,
        member_id: memberId,
      };

      if (event) {
        await updateEvent(event.id, eventData);
        onToast?.('Event updated successfully', 'success');
      } else {
        await createEvent(eventData);
        onToast?.('Event created successfully', 'success');
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save event';
      setError(message);
      onToast?.(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!event) return;

    setLoading(true);
    try {
      await deleteEvent(event.id);
      onToast?.('Event deleted successfully', 'success');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      setError(message);
      onToast?.(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !selectedDate) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
    >
      <div className="brutal-card w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 brutal-button !p-2 disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="brutal-heading text-2xl mb-2">
          {event ? 'Edit Event' : 'New Event'}
        </h2>

        <div className="flex items-center gap-2 text-sm font-bold mb-6 uppercase text-ink-gray">
          <CalendarDays className="w-4 h-4" />
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>

        {error && (
          <div className="bg-red-100 border-4 border-red-600 text-red-800 p-3 mb-4 font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <span className="text-lg">⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold uppercase mb-2">
              <CalendarDays className="w-4 h-4" />
              Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-base focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow"
              placeholder="Event title"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold uppercase mb-2">
              <AlignLeft className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-base focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] resize-none transition-shadow"
              rows={3}
              placeholder="Add details..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold uppercase mb-3">
              <User className="w-4 h-4" />
              Who *
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleMemberChange(member.id)}
                  disabled={loading}
                  className={`brutal-button text-sm transition-all ${
                    memberId === member.id
                      ? 'bg-primary-yellow shadow-[4px_4px_0_#0a0a0a]'
                      : 'bg-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <span
                    className={`inline-block w-3 h-3 mr-2 border-2 border-ink ${
                      member.color === 'member-1'
                        ? 'bg-member-1'
                        : member.color === 'member-2'
                        ? 'bg-member-2'
                        : 'bg-member-3'
                    }`}
                  />
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border-4 border-ink bg-paper-gray">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => handleAllDayChange(e.target.checked)}
              disabled={loading}
              className="w-5 h-5 border-4 border-ink accent-primary-yellow cursor-pointer"
            />
            <label htmlFor="allDay" className="font-bold uppercase text-sm cursor-pointer flex items-center gap-2">
              <Clock className="w-4 h-4" />
              All day event
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="brutal-button flex-1 bg-primary-blue text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>

            {event && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="brutal-button bg-primary-red text-white flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span className="hidden sm:inline">Delete</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs text-ink-gray text-center pt-2">
            Press ESC to close
          </p>
        </form>
      </div>
    </div>
  );
}
