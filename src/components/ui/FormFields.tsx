import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

/**
 * Neo-Skeuomorphism Form Fields
 * - Inputs feel like embossed wells (inset shadows)
 * - Glowing inner border on focus using box-shadow (no outline)
 * - CheckboxGroup: tactile toggle chips with press animation
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-semibold text-gray-600">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`
          input-base
          ${error
            ? '!border-red-300 !shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.10),0_0_0_3px_oklch(0.58_0.22_25/0.12)] focus:!shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.08),0_0_0_3px_oklch(0.58_0.22_25/0.18),0_0_12px_oklch(0.58_0.22_25/0.08)]'
            : ''
          }
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="text-xs font-medium text-red-500 mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-semibold text-gray-600">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`
          input-base appearance-none
          ${error
            ? '!border-red-300 !shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.10),0_0_0_3px_oklch(0.58_0.22_25/0.12)] focus:!shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.08),0_0_0_3px_oklch(0.58_0.22_25/0.18),0_0_12px_oklch(0.58_0.22_25/0.08)]'
            : ''
          }
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p id={`${selectId}-error`} className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCharCount?: boolean;
}

export function Textarea({ label, error, showCharCount, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const charCount = typeof props.value === 'string' ? props.value.length : 0;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-[13px] font-semibold text-gray-600">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          input-base resize-y min-h-[80px]
          ${error
            ? '!border-red-300 !shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.10),0_0_0_3px_oklch(0.58_0.22_25/0.12)] focus:!shadow-[inset_0_2px_4px_oklch(0.4_0.15_25/0.08),0_0_0_3px_oklch(0.58_0.22_25/0.18),0_0_12px_oklch(0.58_0.22_25/0.08)]'
            : ''
          }
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...props}
      />
      <div className="flex items-center justify-between">
        {error ? <p id={`${textareaId}-error`} className="text-xs font-medium text-red-500">{error}</p> : <span />}
        {(showCharCount || props.maxLength) && (
          <span className={`text-[10px] font-medium ${props.maxLength && charCount >= props.maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}{props.maxLength ? `/${props.maxLength}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

interface CheckboxGroupProps {
  label?: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  const toggle = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter((v) => v !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[13px] font-semibold text-gray-600">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`
              px-3 py-1.5 rounded-[8px] text-[13px] font-semibold border transition-all duration-[120ms] min-h-[32px]
              active:scale-[0.97]
              ${value.includes(opt)
                ? 'bg-accent-600 border-accent-700 text-white shadow-[0_2px_4px_oklch(0.3_0.15_270/0.25),inset_0_1px_0_oklch(1_0_0/0.12)]'
                : 'bg-white border-gray-200 text-gray-600 shadow-[0_1px_3px_oklch(0.15_0.01_75/0.10),inset_0_1px_0_oklch(1_0_0/0.50)] hover:border-gray-300 hover:shadow-[0_2px_6px_oklch(0.15_0.01_75/0.12),inset_0_1px_0_oklch(1_0_0/0.60)] active:shadow-[inset_0_2px_4px_oklch(0.15_0.01_75/0.15)]'
              }
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
