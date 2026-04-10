import React, { useMemo, useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import { AvailabilityEntry } from '../types';
import { formatDate } from '../utils';

interface AvailabilityEditorProps {
  value: AvailabilityEntry[];
  onChange: (value: AvailabilityEntry[]) => void;
}

export const AvailabilityEditor: React.FC<AvailabilityEditorProps> = ({ value, onChange }) => {
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'available' | 'unavailable'>('available');
  const [note, setNote] = useState('');

  const sortedEntries = useMemo(
    () => [...value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [value],
  );

  const upsertEntry = () => {
    if (!date) return;

    const nextEntry: AvailabilityEntry = {
      date,
      isAvailable: status === 'available',
      note: note.trim(),
    };

    const others = value.filter((entry) => entry.date.split('T')[0] !== date);
    onChange([...others, nextEntry]);
    setDate('');
    setStatus('available');
    setNote('');
  };

  return (
    <div className="space-y-5 border-t border-noir-border pt-6">
      <div>
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Availability calendar</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">
          Mark specific dates as available or unavailable. Users cannot book unavailable dates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(event) => setDate(event.target.value)}
          className="border border-noir-border bg-noir-bg px-4 py-3 text-sm uppercase tracking-wide text-noir-ink focus:border-noir-accent focus:outline-none"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'available' | 'unavailable')}
          className="border border-noir-border bg-noir-bg px-4 py-3 text-sm uppercase tracking-wide text-noir-ink focus:border-noir-accent focus:outline-none"
        >
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
          className="border border-noir-border bg-noir-bg px-4 py-3 text-sm uppercase tracking-wide text-noir-ink focus:border-noir-accent focus:outline-none"
        />
        <button type="button" onClick={upsertEntry} className="btn-outline-noir !rounded-none !px-4 !py-3">
          <CalendarPlus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {sortedEntries.length > 0 ? sortedEntries.map((entry) => (
          <div key={`${entry.date}-${entry.isAvailable}`} className="flex items-center justify-between gap-4 border border-noir-border bg-noir-bg px-4 py-4">
            <div>
              <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">{formatDate(entry.date)}</p>
              <p className={`mt-1 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] ${entry.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                {entry.isAvailable ? 'Available' : 'Unavailable'}
              </p>
              {entry.note && (
                <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{entry.note}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item.date !== entry.date))}
              className="text-rose-500 transition-colors hover:text-rose-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )) : (
          <div className="border border-dashed border-noir-border px-4 py-6 text-center text-xs font-mono font-semibold uppercase tracking-[0.25em] text-noir-muted">
            No availability overrides yet.
          </div>
        )}
      </div>
    </div>
  );
};
