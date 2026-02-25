import { useState, useRef, useEffect, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parse,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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
        <label className="block text-[13px] font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`
          input-base text-left flex items-center justify-between gap-2 cursor-pointer
          ${error ? '!border-red-300 focus:!ring-red-100 focus:!border-red-400' : ''}
          ${!value ? 'text-gray-400' : ''}
        `}
      >
        <span>{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}</span>
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown Calendar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-200/60 p-4 w-[304px]"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="h-9 flex items-center justify-center text-xs font-medium text-gray-400"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid — animated */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={format(currentMonth, 'yyyy-MM')}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="grid grid-cols-7"
              >
                {calendarDays.map((day) => {
                  const inMonth = isSameMonth(day, currentMonth);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);
                  const isPast = minDate ? day < minDate : false;

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => selectDate(day)}
                      className={`
                        h-9 w-full flex items-center justify-center text-[13px] rounded-lg transition-all duration-100
                        ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${selected ? 'bg-accent-600 !text-white font-semibold shadow-sm' : ''}
                        ${!selected && today ? 'font-semibold text-accent-600' : ''}
                        ${!selected && inMonth && !isPast ? 'hover:bg-accent-50 hover:text-accent-700' : ''}
                        ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors px-2 py-1 rounded-md hover:bg-accent-50"
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
