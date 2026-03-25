import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface CalendarDatePickerProps {
  value: string;           // "YYYY-MM-DD"
  onChange: (v: string) => void;
  placeholder?: string;
  minDate?: string;        // "YYYY-MM-DD"
}

export function CalendarDatePicker({ value, onChange, placeholder = 'Select a date', minDate }: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine initial view month/year from current value or today
  const today = new Date();
  const initialDate = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

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

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  const isDisabled = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    return false;
  };

  const selectDate = (day: number) => {
    const dateStr = toDateString(viewYear, viewMonth, day);
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
    setOpen(false);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const dateStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate());
    if (!isDisabled(dateStr)) {
      onChange(dateStr);
      setOpen(false);
    }
  };

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-gray-50 border rounded-xl pl-11 pr-4 py-3.5 text-sm text-left outline-none transition-all duration-200 hover:border-gray-200 ${
          open
            ? 'border-[#9CAFA0] ring-2 ring-[#9CAFA0]/15'
            : 'border-gray-100'
        } ${value ? 'text-gray-800' : 'text-gray-400'}`}
      >
        {value ? formatDisplayDate(value) : placeholder}
      </button>

      {/* Dropdown calendar */}
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
            {/* Month/Year header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-sm font-bold text-gray-800">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`e-${i}`} className="h-9" />;
                }
                const dateStr = toDateString(viewYear, viewMonth, day);
                const isSelected = dateStr === value;
                const isToday = dateStr === todayStr;
                const disabled = isDisabled(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDate(day)}
                    className={`h-9 w-full rounded-lg text-xs font-medium transition-all duration-150 relative ${
                      disabled
                        ? 'text-gray-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#9CAFA0] text-white font-bold shadow-sm'
                        : isToday
                        ? 'bg-[#FF9B51]/10 text-[#E88A3E] font-bold hover:bg-[#FF9B51]/20'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF9B51]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs font-semibold text-[#9CAFA0] hover:text-[#7A9484] transition-colors"
              >
                Today
              </button>
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
