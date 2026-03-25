import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type View = 'days' | 'months' | 'years';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('days');
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((parsed?.getFullYear() ?? today.getFullYear()) / 12) * 12);

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Position the dropdown relative to the trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 10,
        left: rect.left + rect.width / 2 - 160,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [open, updatePosition]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setView('days');
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setView('days');
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Sync view to value
  useEffect(() => {
    if (parsed) {
      setViewMonth(parsed.getMonth());
      setViewYear(parsed.getFullYear());
    }
  }, [value]);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const selectDate = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
    setView('days');
  };

  const selectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    setView('days');
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setView('months');
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const prevDaysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const trailingDays = (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7;

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isSelected = (day: number) =>
    parsed !== null && day === parsed.getDate() && viewMonth === parsed.getMonth() && viewYear === parsed.getFullYear();

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (view === 'days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
      else setViewMonth((m) => m - 1);
    } else if (view === 'years') {
      setYearRangeStart((s) => s - 12);
    } else {
      setViewYear((y) => y - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (view === 'days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
      else setViewMonth((m) => m + 1);
    } else if (view === 'years') {
      setYearRangeStart((s) => s + 12);
    } else {
      setViewYear((y) => y + 1);
    }
  };

  const headerLabel =
    view === 'days'
      ? `${MONTHS[viewMonth]} ${viewYear}`
      : view === 'months'
        ? `${viewYear}`
        : `${yearRangeStart} – ${yearRangeStart + 11}`;

  const calendarDropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-[320px] bg-white rounded-2xl border border-gray-100/80 select-none"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 99999,
            boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-[#9CAFA0]/[0.06] rounded-t-2xl">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#9CAFA0] hover:bg-[#9CAFA0]/10 transition-all duration-200"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (view === 'days') setView('months');
                else if (view === 'months') { setYearRangeStart(Math.floor(viewYear / 12) * 12); setView('years'); }
                else setView('days');
              }}
              className="text-sm font-semibold text-gray-800 hover:text-[#9CAFA0] transition-colors duration-200 px-3 py-1.5 rounded-xl hover:bg-[#9CAFA0]/10"
            >
              {headerLabel}
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#9CAFA0] hover:bg-[#9CAFA0]/10 transition-all duration-200"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5">
            {/* Days view */}
            {view === 'days' && (
              <>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-[#9CAFA0]/70 uppercase tracking-wider py-1.5">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-0.5">
                  {Array.from({ length: firstDayOfWeek }, (_, i) => (
                    <div key={`prev-${i}`} className="text-center py-0.5">
                      <span className="inline-flex items-center justify-center w-9 h-9 text-sm text-gray-200">
                        {prevDaysInMonth - firstDayOfWeek + 1 + i}
                      </span>
                    </div>
                  ))}

                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const sel = isSelected(day);
                    const td = isToday(day);
                    return (
                      <div key={day} className="text-center py-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); selectDate(day); }}
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm transition-all duration-200 cursor-pointer
                            ${sel
                              ? 'bg-[#FF9B51] text-white font-semibold shadow-lg shadow-orange-500/25'
                              : td
                                ? 'bg-[#9CAFA0]/15 text-[#7A8E80] font-semibold ring-1 ring-[#9CAFA0]/30'
                                : 'text-gray-700 hover:bg-[#9CAFA0]/10 hover:text-gray-900'
                            }`}
                        >
                          {day}
                        </button>
                      </div>
                    );
                  })}

                  {Array.from({ length: trailingDays }, (_, i) => (
                    <div key={`next-${i}`} className="text-center py-0.5">
                      <span className="inline-flex items-center justify-center w-9 h-9 text-sm text-gray-200">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100/80 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewMonth(today.getMonth());
                      setViewYear(today.getFullYear());
                      selectDate(today.getDate());
                    }}
                    className="text-xs font-semibold text-[#9CAFA0] hover:text-[#7A8E80] transition-all duration-200 px-4 py-2 rounded-xl hover:bg-[#9CAFA0]/8 inline-flex items-center gap-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9CAFA0]" />
                    Today
                  </button>
                </div>
              </>
            )}

            {/* Months view */}
            {view === 'months' && (
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((m, i) => {
                  const isCurrent = i === viewMonth && parsed !== null && viewYear === parsed.getFullYear() && parsed.getMonth() === i;
                  const isCurrentMonth = i === today.getMonth() && viewYear === today.getFullYear();
                  return (
                    <button
                      type="button"
                      key={m}
                      onClick={(e) => { e.stopPropagation(); selectMonth(i); }}
                      className={`py-3.5 rounded-xl text-sm transition-all duration-200 cursor-pointer
                        ${isCurrent
                          ? 'bg-[#FF9B51] text-white font-semibold shadow-lg shadow-orange-500/25'
                          : isCurrentMonth
                            ? 'bg-[#9CAFA0]/15 text-[#7A8E80] font-semibold ring-1 ring-[#9CAFA0]/20'
                            : 'text-gray-700 hover:bg-[#9CAFA0]/10 hover:text-gray-900'
                        }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Years view */}
            {view === 'years' && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const yr = yearRangeStart + i;
                  const isCurrent = parsed !== null && yr === parsed.getFullYear();
                  const isCurrentYear = yr === today.getFullYear();
                  return (
                    <button
                      type="button"
                      key={yr}
                      onClick={(e) => { e.stopPropagation(); selectYear(yr); }}
                      className={`py-3.5 rounded-xl text-sm transition-all duration-200 cursor-pointer
                        ${isCurrent
                          ? 'bg-[#FF9B51] text-white font-semibold shadow-lg shadow-orange-500/25'
                          : isCurrentYear
                            ? 'bg-[#9CAFA0]/15 text-[#7A8E80] font-semibold ring-1 ring-[#9CAFA0]/20'
                            : 'text-gray-700 hover:bg-[#9CAFA0]/10 hover:text-gray-900'
                        }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative flex-1" ref={triggerRef}>
      {/* Clickable trigger — entire area */}
      <div
        className="w-full h-full px-4 py-3 flex items-center gap-3 cursor-pointer group transition-colors duration-200 hover:bg-[#9CAFA0]/[0.04] rounded-xl"
        onClick={() => setOpen((prev) => { if (!prev) setView('days'); return !prev; })}
        role="button"
        tabIndex={0}
        aria-label="Pick a date"
        aria-expanded={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((prev) => { if (!prev) setView('days'); return !prev; }); }}}
      >
        <Calendar className={`w-4 h-4 shrink-0 transition-colors duration-200 ${open ? 'text-[#9CAFA0]' : value ? 'text-[#9CAFA0]' : 'text-gray-400 group-hover:text-[#9CAFA0]/60'}`} />
        <div className="min-h-[1.25rem] text-center">
          {value ? (
            <span className="text-sm text-gray-800">{formatDisplay(value)}</span>
          ) : (
            <span className="text-sm text-gray-400 group-hover:text-gray-500 transition-colors duration-200">Pick a date</span>
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="text-gray-300 hover:text-gray-500 transition-colors duration-200 shrink-0 z-10 w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-100"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {calendarDropdown}
    </div>
  );
}