import { useState, useRef, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addDays,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  parse,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * Neo-Skeuomorphism DatePicker
 * - Calendar grid: day cells feel like physical keys
 * - Raised default, pressed active, selected glow
 * - Frosted glass calendar panel
 * - Month nav buttons: tactile raised surface
 */

interface DatePickerProps {
  label?: string;
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  minDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  error,
  required,
  placeholder = 'Select date',
  minDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      try {
        return parse(value, 'yyyy-MM-dd', new Date());
      } catch {
        return new Date();
      }
    }
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  const [focusedDay, setFocusedDay] = useState<Date | null>(null);

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const goToPrevMonth = useCallback(() => {
    setDirection(-1);
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setDirection(0);
    setCurrentMonth(now);
    onChange(format(now, 'yyyy-MM-dd'));
    setIsOpen(false);
  }, [onChange]);

  const selectDate = useCallback(
    (date: Date) => {
      onChange(format(date, 'yyyy-MM-dd'));
      setIsOpen(false);
    },
    [onChange]
  );

  // Keyboard navigation within the calendar grid
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const base = focusedDay || selectedDate || new Date();
      let next: Date | null = null;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          next = addDays(base, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          next = addDays(base, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          next = addDays(base, 7);
          break;
        case 'ArrowUp':
          e.preventDefault();
          next = addDays(base, -7);
          break;
        case 'Home':
          e.preventDefault();
          next = startOfMonth(base);
          break;
        case 'End':
          e.preventDefault();
          next = endOfMonth(base);
          break;
        case 'PageDown':
          e.preventDefault();
          goToNextMonth();
          return;
        case 'PageUp':
          e.preventDefault();
          goToPrevMonth();
          return;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (base && !(minDate && isBefore(base, minDate))) {
            selectDate(base);
          }
          return;
        default:
          return;
      }

      if (next) {
        setFocusedDay(next);
        if (!isSameMonth(next, currentMonth)) {
          setDirection(isBefore(next, currentMonth) ? -1 : 1);
          setCurrentMonth(next);
        }
      }
    },
    [focusedDay, selectedDate, currentMonth, minDate, goToNextMonth, goToPrevMonth, selectDate]
  );

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-[13px] font-semibold text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger — embossed well */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`
          input-base text-left flex items-center justify-between gap-2 cursor-pointer
          ${error
            ? '!border-red-300 !shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.10),0_0_0_3px_oklch(0.58_0.22_25/0.12)]'
            : ''
          }
          ${!value ? 'text-gray-400' : ''}
        `}
      >
        <span>{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}</span>
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}

      {/* Frosted Glass Calendar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute z-50 mt-1 p-4 w-[304px] rounded-xl
              bg-white/88 backdrop-blur-xl backdrop-saturate-150
              border border-white/50
              shadow-[0_12px_40px_oklch(0.15_0.01_75/0.18),0_4px_12px_oklch(0.15_0.01_75/0.10),inset_0_1px_0_oklch(1_0_0/0.40)]"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  bg-white border border-gray-200 text-gray-500
                  shadow-[0_1px_3px_oklch(0.15_0.01_75/0.10),inset_0_1px_0_oklch(1_0_0/0.50)]
                  hover:shadow-[0_2px_6px_oklch(0.15_0.01_75/0.14),inset_0_1px_0_oklch(1_0_0/0.60)]
                  active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.15)] active:scale-[0.95]
                  transition-all duration-[120ms]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  bg-white border border-gray-200 text-gray-500
                  shadow-[0_1px_3px_oklch(0.15_0.01_75/0.10),inset_0_1px_0_oklch(1_0_0/0.50)]
                  hover:shadow-[0_2px_6px_oklch(0.15_0.01_75/0.14),inset_0_1px_0_oklch(1_0_0/0.60)]
                  active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.15)] active:scale-[0.95]
                  transition-all duration-[120ms]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="h-9 flex items-center justify-center text-xs font-bold text-gray-400"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid — animated, physical key cells */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={format(currentMonth, 'yyyy-MM')}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="grid grid-cols-7 gap-0.5"
                role="grid"
                aria-label="Calendar"
                tabIndex={0}
                onKeyDown={handleGridKeyDown}
              >
                {calendarDays.map((day) => {
                  const inMonth = isSameMonth(day, currentMonth);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);
                  const isPast = minDate ? isBefore(day, minDate) : false;
                  const isFocused = focusedDay && isSameDay(day, focusedDay);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => selectDate(day)}
                      tabIndex={-1}
                      role="gridcell"
                      aria-selected={!!selected}
                      aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                      className={`
                        h-9 w-full flex items-center justify-center text-[13px] rounded-lg
                        transition-all duration-[120ms]
                        ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${selected
                          ? 'bg-accent-600 !text-white font-bold shadow-[0_2px_6px_oklch(0.35_0.20_270/0.35),inset_0_1px_0_oklch(1_0_0/0.15)]'
                          : ''
                        }
                        ${!selected && today ? 'font-bold text-accent-600' : ''}
                        ${!selected && inMonth && !isPast
                          ? 'hover:bg-white hover:shadow-[0_1px_3px_oklch(0.15_0.01_75/0.12),inset_0_1px_0_oklch(1_0_0/0.50)] active:shadow-[inset_0_1px_3px_oklch(0.15_0.01_75/0.15)] active:scale-[0.93]'
                          : ''
                        }
                        ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${isFocused && !selected ? 'ring-2 ring-accent-400 ring-inset' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/60">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg
                  hover:bg-gray-100 hover:shadow-[0_1px_2px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]
                  active:shadow-[inset_0_1px_2px_oklch(0.15_0.01_75/0.12)] active:scale-[0.97]
                  transition-all duration-[120ms]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors px-3 py-1.5 rounded-lg
                  hover:bg-accent-50 hover:shadow-[0_1px_2px_oklch(0.3_0.15_270/0.10),inset_0_1px_0_oklch(1_0_0/0.40)]
                  active:shadow-[inset_0_1px_2px_oklch(0.3_0.15_270/0.12)] active:scale-[0.97]
                  transition-all duration-[120ms]"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
