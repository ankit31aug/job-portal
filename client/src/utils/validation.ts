export type Validator = (value: string) => string | null;

export const validators = {
  required: (label = 'This field') => (val: string): string | null =>
    !val.trim() ? `${label} is required` : null,

  name: (val: string): string | null => {
    if (!val.trim()) return 'Full name is required';
    if (val.trim().length < 2) return 'Name must be at least 2 characters';
    if (val.trim().length > 100) return 'Name cannot exceed 100 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(val.trim())) return 'Name can only contain letters, spaces, dots, hyphens';
    return null;
  },

  email: (val: string): string | null => {
    if (!val.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address';
    if (val.length > 254) return 'Email address is too long';
    return null;
  },

  phone: (val: string): string | null => {
    if (!val.trim()) return 'Phone number is required';
    const cleaned = val.trim().replace(/[\s\-\(\)]/g, '');
    if (/^\+91/.test(cleaned)) {
      if (!/^\+91[6-9]\d{9}$/.test(cleaned)) return 'Invalid Indian phone number with country code';
    } else if (/^\d+$/.test(cleaned)) {
      if (cleaned.length !== 10) return 'Phone number must be 10 digits';
      if (!/^[6-9]/.test(cleaned)) return 'Indian mobile number must start with 6, 7, 8 or 9';
    } else {
      return 'Phone number can only contain digits, spaces, hyphens, or parentheses';
    }
    return null;
  },

  pincode: (val: string): string | null => {
    if (!val.trim()) return 'Pincode is required';
    if (!/^\d+$/.test(val.trim())) return 'Pincode must contain only digits';
    if (val.trim().length !== 6) return 'Pincode must be exactly 6 digits';
    if (val.trim() === '000000') return 'Please enter a valid pincode';
    return null;
  },

  password: (val: string): string | null => {
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Password must be at least 8 characters';
    if (val.length > 128) return 'Password is too long';
    if (!/[A-Za-z]/.test(val)) return 'Password must contain at least one letter';
    if (!/\d/.test(val)) return 'Password must contain at least one number';
    return null;
  },

  confirmPassword: (password: string) => (val: string): string | null => {
    if (!val) return 'Please confirm your password';
    if (val !== password) return 'Passwords do not match';
    return null;
  },

  experienceYears: (val: string): string | null => {
    if (val === '' || val === undefined) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return 'Experience must be a valid number';
    if (num < 0) return 'Experience cannot be negative';
    if (num > 60) return 'Please enter a valid experience in years';
    return null;
  },

  salary: (val: string): string | null => {
    if (!val.trim()) return null;
    const num = parseInt(val.replace(/,/g, ''));
    if (isNaN(num)) return 'Salary must be a valid number';
    if (num < 0) return 'Salary cannot be negative';
    if (num > 100000000) return 'Please enter a valid salary amount';
    return null;
  },

  minLength: (min: number, label = 'This field') => (val: string): string | null =>
    val.trim().length < min ? `${label} must be at least ${min} characters` : null,

  maxLength: (max: number, label = 'This field') => (val: string): string | null =>
    val.trim().length > max ? `${label} cannot exceed ${max} characters` : null,
};

export function validate(value: string, ...fns: Validator[]): string | null {
  for (const fn of fns) {
    const error = fn(value);
    if (error) return error;
  }
  return null;
}

export function validateAll(fields: Record<string, { value: string; validators: Validator[] }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, { value, validators: fns }] of Object.entries(fields)) {
    const error = validate(value, ...fns);
    if (error) errors[key] = error;
  }
  return errors;
}
