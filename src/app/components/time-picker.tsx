import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Convert "HH:mm" (24h) → { hour12, minute, period } */
function parse24(value: string): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  if (!value) return { hour12: 12, minute: 0, period: 'AM' };
  const [h, m] = value.split(':').map(Number);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: m, period };
}

/** Convert { hour12, minute, period } → "HH:mm" (24h) */
function to24(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (period === 'PM') h += 12;
  return `${pad(h)}:${pad(minute)}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const { hour12, minute, period } = parse24(value);
  return `${hour12}:${pad(minute)} ${period}`;
}

/* ── Scroll Column ── */

function ScrollColumn({
  items,
  value,
  onChange,
  formatItem,
}: {
  items: number[] | string[];
  value: number | string;
  onChange: (v: any) => void;
  formatItem?: (v: any) => string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = items.indexOf(value as never);
    if (idx >= 0 && containerRef.current) {
      const el = containerRef.current.children[idx] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [value, items]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto scrollbar-hide px-1 py-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {items.map((item) => {
        const isActive = item === value;
        return (
          <button
            key={String(item)}
            type="button"
            onClick={() => onChange(item)}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#9CAFA0] text-white font-bold shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {formatItem ? formatItem(item) : String(item)}
          </button>
        );
      })}
    </div>
  );
}

/* ── Quick Time Presets ── */
const PRESETS = [
  { label: 'Morning', time: '09:00', emoji: '🌅' },
  { label: 'Noon', time: '12:00', emoji: '☀️' },
  { label: 'Afternoon', time: '14:00', emoji: '🌤' },
  { label: 'Evening', time: '18:00', emoji: '🌆' },
  { label: 'Night', time: '20:00', emoji: '🌙' },
];

/* ── Main Component ── */

interface TimePickerProps {
  value: string; // "HH:mm" 24h format
  onChange: (v: string) => void;
  placeholder?: string;
}

export function TimePicker({ value, onChange, placeholder = 'Select a time' }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { hour12, minute, period } = parse24(value);

  // Snap minute to nearest 5 for display in picker
  const snappedMinute = Math.round(minute / 5) * 5 === 60 ? 55 : Math.round(minute / 5) * 5;

  const setHour = useCallback(
    (h: number) => onChange(to24(h, minute, period)),
    [minute, period, onChange]
  );
  const setMinute = useCallback(
    (m: number) => onChange(to24(hour12, m, period)),
    [hour12, period, onChange]
  );
  const setPeriod = useCallback(
    (p: 'AM' | 'PM') => onChange(to24(hour12, minute, p)),
    [hour12, minute, onChange]
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!value) {
            // Default to 9:00 AM when opening with no value
            onChange('09:00');
          }
          setOpen(!open);
        }}
        className={`w-full bg-gray-50 border rounded-xl pl-11 pr-4 py-3.5 text-sm text-left outline-none transition-all duration-200 hover:border-gray-200 ${
          open ? 'border-[#9CAFA0] ring-2 ring-[#9CAFA0]/15' : 'border-gray-100'
        } ${value ? 'text-gray-800' : 'text-gray-400'}`}
      >
        {value ? formatDisplay(value) : placeholder}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute z-50 top-full left-0 mt-2 w-[300px] bg-white rounded-2xl border border-gray-100 p-4"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {/* Quick presets */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {PRESETS.map((p) => {
                const isActive = value === p.time;
                return (
                  <button
                    key={p.time}
                    type="button"
                    onClick={() => {
                      onChange(p.time);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 border ${
                      isActive
                        ? 'border-[#9CAFA0] bg-[#9CAFA0]/10 text-[#5A6E60]'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Three-column picker */}
            <div className="flex gap-1 border border-gray-100 rounded-xl bg-gray-50/50 p-1.5">
              {/* Hours */}
              <div className="flex-1">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1 py-1">
                  Hour
                </div>
                <ScrollColumn
                  items={HOURS_12}
                  value={hour12}
                  onChange={setHour}
                />
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200 my-2" />

              {/* Minutes */}
              <div className="flex-1">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1 py-1">
                  Min
                </div>
                <ScrollColumn
                  items={MINUTES}
                  value={snappedMinute}
                  onChange={setMinute}
                  formatItem={(m: number) => pad(m)}
                />
              </div>

              {/* Divider */}
              <div className="w-px bg-gray-200 my-2" />

              {/* AM/PM */}
              <div className="w-16">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1 py-1">
                  &nbsp;
                </div>
                <div className="flex flex-col gap-1 px-1 py-1">
                  {(['AM', 'PM'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`w-full px-3 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                        period === p
                          ? 'bg-[#9CAFA0] text-white shadow-sm'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                Selected: <span className="font-semibold text-gray-700">{formatDisplay(value)}</span>
              </div>
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className="text-xs font-medium text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
