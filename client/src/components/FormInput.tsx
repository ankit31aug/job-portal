import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  as?: 'input' | 'textarea' | 'select';
  rows?: number;
  children?: React.ReactNode;
  disabled?: boolean;
  autoComplete?: string;
}

export default function FormInput({
  label, name, type = 'text', value, onChange, onBlur, error, touched,
  placeholder, required, hint, as = 'input', rows = 3, children, disabled, autoComplete
}: FormInputProps) {
  const isValid = touched && !error && value.trim().length > 0;
  const hasError = touched && !!error;

  const baseClass = `input-field pr-10 ${hasError ? 'input-error border-red-400 focus:ring-red-400' : isValid ? 'border-green-400 focus:ring-green-400' : ''}`;

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {as === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`${baseClass} resize-none`}
          />
        ) : as === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={baseClass}
          >
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            className={baseClass}
          />
        )}
        {as !== 'textarea' && (hasError || isValid) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {hasError
              ? <AlertCircle size={16} className="text-red-500" />
              : <CheckCircle size={16} className="text-green-500" />
            }
          </div>
        )}
      </div>
      {hasError && <p className="mt-1 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {!hasError && hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
