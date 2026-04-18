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
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, members, currentMember?.id, isOpen]);

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
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleMemberChange = (id: string) => {
    setMemberId(id);
  };

  const handleAllDayChange = (checked: boolean) => {
    setIsAllDay(checked);
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
      setError('Failed to save event. Please try again.');
      console.error('Event save error:', err);
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
      setError('Failed to delete event. Please try again.');
      console.error('Event delete error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === modalRef.current) {
          onClose();
        }
      }}
    >
      <div className="brutal-card bg-white w-full max-w-md animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-4 border-red-600 text-red-800 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold mb-2">
              <CalendarDays className="w-4 h-4" />
              Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow"
              placeholder="Enter event title"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold mb-2">
              <AlignLeft className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow resize-none"
              placeholder="Add details..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold mb-2">
              <User className="w-4 h-4" />
              Assigned to
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] transition-shadow"
              disabled={loading}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAllDay"
              checked={isAllDay}
              onChange={(e) => handleAllDayChange(e.target.checked)}
              className="w-5 h-5 border-4 border-ink"
              disabled={loading}
            />
            <label htmlFor="isAllDay" className="flex items-center gap-2 text-sm font-bold cursor-pointer">
              <Clock className="w-4 h-4" />
              All day event
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="brutal-button flex-1 bg-ink text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Event'
              )}
            </button>

            {event && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="brutal-button bg-red-500 text-white"
                aria-label="Delete event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Press ESC to close
        </p>
      </div>
    </div>
  );
}
