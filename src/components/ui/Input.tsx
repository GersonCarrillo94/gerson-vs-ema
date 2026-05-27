import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        {...props}
        aria-invalid={error != null}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={[
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-gerson focus:border-transparent',
          'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300',
          className,
        ].join(' ')}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
});
