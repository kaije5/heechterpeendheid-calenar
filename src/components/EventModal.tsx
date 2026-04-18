'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';
import { CalendarEvent, HouseholdMember } from '@/types';
import { createEvent, updateEvent, deleteEvent } from '@/lib/supabase';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  event: CalendarEvent | null;
  members: HouseholdMember[];
}

export default function EventModal({
  isOpen,
  onClose,
  selectedDate,
  event,
  members,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memberId, setMemberId] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setMemberId(event.member_id);
      setIsAllDay(event.is_all_day);
    } else {
      setTitle('');
      setDescription('');
      setMemberId(members[0]?.id || '');
      setIsAllDay(true);
    }
  }, [event, members]);

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
      } else {
        await createEvent(eventData);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!event) return;

    setLoading(true);
    try {
      await deleteEvent(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !selectedDate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="brutal-card w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 brutal-button !p-2"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="brutal-heading text-2xl mb-6">
          {event ? 'Edit Event' : 'New Event'}
        </h2>

        <div className="text-sm font-bold mb-4 uppercase">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>

        {error && (
          <div className="bg-primary-red text-white p-3 mb-4 border-2 border-ink font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-base focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a]"
              placeholder="Event title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-4 border-ink p-3 bg-white font-mono text-base focus:outline-none focus:shadow-[4px_4px_0_#0a0a0a] resize-none"
              rows={3}
              placeholder="Add details..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">
              Who *
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setMemberId(member.id)}
                  className={`brutal-button text-sm ${
                    memberId === member.id
                      ? 'bg-primary-yellow'
                      : 'bg-white'
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

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="w-5 h-5 border-4 border-ink accent-primary-yellow"
            />
            <label htmlFor="allDay" className="font-bold uppercase text-sm">
              All day event
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="brutal-button flex-1 bg-primary-blue text-white disabled:opacity-50"
            >
              {loading ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>

            {event && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="brutal-button bg-primary-red text-white"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
