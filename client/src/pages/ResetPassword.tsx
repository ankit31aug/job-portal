import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { validators } from '../utils/validation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const validateField = (name: string, value: string) => {
    let err: string | null = null;
    if (name === 'password') err = validators.password(value);
    if (name === 'confirm') err = value !== form.password ? 'Passwords do not match' : null;
    setErrors(prev => ({ ...prev, [name]: err || '' }));
    return !err;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
    setServerError('');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    const pwOk = validateField('password', form.password);
    const cfOk = validateField('confirm', form.confirm);
    if (!pwOk || !cfOk) return;
    if (!token) { setServerError('Invalid or missing reset token. Please request a new reset link.'); return; }

    setLoading(true);
    setServerError('');
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">Invalid reset link. Please request a new one.</p>
          <Link to="/forgot-password" className="btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Briefcase size={32} className="text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Quality Council <span className="text-blue-600">of India</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set New Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Password Updated!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to Login</button>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {serverError}
                  {serverError.includes('expired') && (
                    <div className="mt-2">
                      <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">Request a new reset link →</Link>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Min 8 chars, include a letter and number"
                      autoComplete="new-password"
                      className={`input-field pr-10 ${touched.password && errors.password ? 'input-error' : ''}`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.password && errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirm"
                      value={form.confirm}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      className={`input-field pr-10 ${touched.confirm && errors.confirm ? 'input-error' : ''}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.confirm && errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm}</p>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
