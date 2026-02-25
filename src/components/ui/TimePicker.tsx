import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  label?: string;
  value: string; // HH:mm (24h)
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  minuteStep?: number;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function to12Hour(h24: number) {
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return { h12, period };
}

function to24Hour(h12: number, period: 'AM' | 'PM') {
  if (period === 'AM') return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function formatDisplay(value: string) {
  if (!value) return '';
  const [hStr, mStr] = value.split(':');
  const h24 = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const { h12, period } = to12Hour(h24);
  return `${pad(h12)}:${pad(m)} ${period}`;
}

export function TimePicker({
  label,
  value,
  onChange,
  error,
  required,
  placeholder = 'Select time',
  minuteStep = 5,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const parsed = useMemo(() => {
    if (!value) return { hour: 8, minute: 0, period: 'AM' as const };
    const [hStr, mStr] = value.split(':');
    const h24 = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const { h12, period } = to12Hour(h24);
    return { hour: h12, minute: m, period: period as 'AM' | 'PM' };
  }, [value]);

  // Derive hour/minute/period directly from value prop
  const hour = parsed.hour;
  const minute = parsed.minute;
  const period = parsed.period;

  // Emit 24h value
  const emitChange = useCallback(
    (h12: number, m: number, p: 'AM' | 'PM') => {
      const h24 = to24Hour(h12, p);
      onChange(`${pad(h24)}:${pad(m)}`);
    },
    [onChange]
  );

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

  const incHour = () => {
    const next = hour >= 12 ? 1 : hour + 1;
    emitChange(next, minute, period);
  };
  const decHour = () => {
    const next = hour <= 1 ? 12 : hour - 1;
    emitChange(next, minute, period);
  };
  const incMinute = () => {
    const next = (minute + minuteStep) % 60;
    emitChange(hour, next, period);
  };
  const decMinute = () => {
    const next = minute - minuteStep < 0 ? 60 + (minute - minuteStep) : minute - minuteStep;
    emitChange(hour, next, period);
  };
  const togglePeriod = () => {
    const next = period === 'AM' ? 'PM' : 'AM';
    emitChange(hour, minute, next);
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
          input-base text-left flex items-center justify-between gap-2 cursor-pointer w-full
          ${error ? '!border-red-300 focus:!ring-red-100 focus:!border-red-400' : ''}
          ${!value ? 'text-gray-400' : ''}
        `}
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg shadow-gray-200/60 p-4 w-[220px]"
          >
            {/* Spinners */}
            <div className="flex items-center justify-center gap-2">
              {/* Hour spinner */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incHour}
                  className="w-10 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="w-14 h-12 flex items-center justify-center rounded-lg bg-accent-50 text-accent-700 text-xl font-bold tabular-nums">
                  {pad(hour)}
                </div>
                <button
                  type="button"
                  onClick={decHour}
                  className="w-10 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Separator */}
              <span className="text-xl font-bold text-gray-300 pb-0.5">:</span>

              {/* Minute spinner */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incMinute}
                  className="w-10 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="w-14 h-12 flex items-center justify-center rounded-lg bg-accent-50 text-accent-700 text-xl font-bold tabular-nums">
                  {pad(minute)}
                </div>
                <button
                  type="button"
                  onClick={decMinute}
                  className="w-10 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* AM/PM toggle */}
              <div className="flex flex-col items-center ml-1">
                <button
                  type="button"
                  onClick={togglePeriod}
                  className={`
                    w-12 h-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors
                    ${period === 'AM' ? 'bg-accent-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                  `}
                >
                  AM
                </button>
                <div className="h-1.5" />
                <button
                  type="button"
                  onClick={togglePeriod}
                  className={`
                    w-12 h-9 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors
                    ${period === 'PM' ? 'bg-accent-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                  `}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Quick picks */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-4 gap-1.5">
                {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map((t) => {
                  const isSelected = value === t;
                  const display = formatDisplay(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        onChange(t);
                        setIsOpen(false);
                      }}
                      className={`
                        px-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors
                        ${isSelected ? 'bg-accent-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}
                      `}
                    >
                      {display}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Done button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-2 text-xs font-semibold text-accent-600 hover:text-accent-700 hover:bg-accent-50 rounded-lg transition-colors"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
