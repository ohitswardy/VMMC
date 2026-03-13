import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Neo-Skeuomorphism Custom Select
 * - Trigger: embossed input well
 * - Dropdown: frosted glass panel with backdrop-filter
 * - Items: hover highlight glow, selected check
 * - Slide + fade in with cubic-bezier easing
 */

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  required,
  className = '',
  disabled,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [flipUp, setFlipUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const openDropdown = useCallback(() => {
    const idx = options.findIndex((o) => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
    // Determine flip direction
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setFlipUp(spaceBelow < 260);
    }
    setIsOpen(true);
  }, [options, value]);

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

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
          } else {
            openDropdown();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, highlightedIndex, options, onChange, disabled, openDropdown]
  );

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.children;
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[13px] font-semibold text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger — embossed well */}
      <button
        type="button"
        onClick={() => !disabled && (isOpen ? setIsOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          input-base text-left flex items-center justify-between gap-2 cursor-pointer w-full
          ${error
            ? '!border-red-300 !shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.10),0_0_0_3px_oklch(0.58_0.22_25/0.12)]'
            : ''
          }
          ${!selectedOption ? 'text-gray-400' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}

      {/* Frosted Glass Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: flipUp ? 8 : -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: flipUp ? 8 : -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className={`
              absolute z-50 ${flipUp ? 'bottom-full mb-1' : 'mt-1'} min-w-full w-max
              rounded-xl py-1.5 max-h-[240px] overflow-y-auto right-0
              bg-white/85 backdrop-blur-xl backdrop-saturate-150
              border border-white/50
              shadow-[0_8px_32px_oklch(0.15_0.01_75/0.16),0_2px_8px_oklch(0.15_0.01_75/0.08),inset_0_1px_0_oklch(1_0_0/0.40)]
            `}
            ref={listRef}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition-all duration-100
                    ${isHighlighted
                      ? 'bg-accent-50/60 shadow-[inset_0_0_0_1px_oklch(0.55_0.24_270/0.08)]'
                      : ''
                    }
                    ${isSelected ? 'text-accent-600 font-semibold' : 'text-gray-700'}
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-accent-600 shrink-0" />
                  )}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3.5 py-2.5 text-sm text-gray-400">No options</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
