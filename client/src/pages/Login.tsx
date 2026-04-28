import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';
import { validators, validate } from '../utils/validation';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
    setServerError('');
  };

  const validateField = (name: string, value: string) => {
    let error: string | null = null;
    if (name === 'email') error = validators.email(value);
    if (name === 'password') error = !value ? 'Password is required' : null;
    setErrors(prev => ({ ...prev, [name]: error || '' }));
    return !error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const emailOk = validateField('email', form.email);
    const pwOk = validateField('password', form.password);
    if (!emailOk || !pwOk) return;

    setLoading(true);
    setServerError('');
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Briefcase size={32} className="text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Quality Council <span className="text-blue-600">of India</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to continue your job search</p>
        </div>

        <div className="card p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <FormInput
              label="Email Address" name="email" type="email" value={form.email}
              onChange={handleChange} onBlur={handleBlur}
              error={errors.email} touched={touched.email}
              placeholder="you@example.com" required autoComplete="email"
            />

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`input-field pr-10 ${touched.password && errors.password ? 'input-error' : ''}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">Create account</Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">Demo Accounts:</p>
          <p className="text-blue-700 dark:text-blue-400">Employer (NABH): <code>nabh@qci.org</code> / <code>Admin@123</code></p>
          <p className="text-blue-700 dark:text-blue-400 mt-1">Employer (NABET): <code>nabet@qci.org</code> / <code>Admin@123</code></p>
          <p className="text-blue-700 dark:text-blue-400 mt-1">Employer (NABL): <code>nabl@qci.org</code> / <code>Admin@123</code></p>
        </div>
      </div>
    </div>
  );
}
