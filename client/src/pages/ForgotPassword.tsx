import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mail, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { validators } from '../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateEmail = (val: string) => {
    const err = validators.email(val);
    setEmailError(err || '');
    return !err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validateEmail(email)) return;

    setLoading(true);
    setServerError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Check your inbox</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                If <strong>{email}</strong> is registered, we've sent a password reset link. It expires in 1 hour.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {serverError}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (touched) validateEmail(e.target.value); setServerError(''); }}
                    onBlur={() => { setTouched(true); validateEmail(email); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`input-field ${touched && emailError ? 'input-error' : ''}`}
                  />
                  {touched && emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
