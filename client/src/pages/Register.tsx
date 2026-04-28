import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';
import { validators } from '../utils/validation';
import api from '../utils/api';

type Role = 'jobseeker' | 'employer';

// Step 1: basic info form
// Step 2: OTP verification (jobseekers only)
// Step 3: completion / success state before redirect
type Step = 1 | 2 | 3;

interface FormState {
  name: string; email: string; password: string; confirmPassword: string;
  phone: string; role: Role; company_name: string; city: string; state: string; pincode: string;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);

  // ── Step 1: form state ────────────────────────────────────────────
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    role: 'jobseeker', company_name: '', city: '', state: '', pincode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // ── Step 2: OTP state ────────────────────────────────────────────
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Validators ───────────────────────────────────────────────────
  const fieldValidators: Record<string, (val: string) => string | null> = {
    name: validators.name,
    email: validators.email,
    password: validators.password,
    confirmPassword: validators.confirmPassword(form.password),
    phone: validators.phone,
    pincode: validators.pincode,
    company_name: (val) => form.role === 'employer' && !val.trim() ? 'Company name is required for employers' : null,
  };

  const validateField = (name: string, value: string) => {
    const fn = fieldValidators[name];
    const error = fn ? fn(value) : null;
    setErrors(prev => ({ ...prev, [name]: error || '' }));
    return !error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateField(name, value);
    setServerError('');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleRoleChange = (role: Role) => {
    setForm(prev => ({ ...prev, role }));
    setErrors({});
  };

  // ── Step 1 → validate all fields, then proceed ───────────────────
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = Object.keys(fieldValidators);
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(f => { newTouched[f] = true; });
    setTouched(newTouched);

    let allValid = true;
    const newErrors: Record<string, string> = {};
    for (const field of allFields) {
      const fn = fieldValidators[field];
      if (fn) {
        const error = fn(form[field as keyof FormState]);
        if (error) { newErrors[field] = error; allValid = false; }
      }
    }
    setErrors(newErrors);
    if (!allValid) return;

    if (form.role === 'jobseeker') {
      // Go to OTP step
      setStep(2);
      setOtpError('');
    } else {
      // Employers skip OTP — register directly
      handleFinalRegister();
    }
  };

  // ── OTP helpers ──────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setOtpSending(true);
    setOtpError('');
    try {
      await api.post('/otp/send', { email: form.email.trim(), name: form.name.trim() });
      setOtpSent(true);
      setOtpDigits(['', '', '', '', '', '']);
      startCooldown();
      // Focus first OTP box after sending
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    // Allow only single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setOtpError('');

    // Auto-advance focus
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const res = await api.post('/otp/verify', { email: form.email.trim(), otp });
      if (res.data?.verified) {
        setOtpVerified(true);
        // Proceed to final registration
        await handleFinalRegister(true);
      } else {
        setOtpError('Incorrect OTP. Please try again.');
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'OTP verification failed. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  // ── Final registration ───────────────────────────────────────────
  const handleFinalRegister = async (skipLoadingState = false) => {
    if (!skipLoadingState) setLoading(true);
    setServerError('');
    try {
      await register({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        phone: form.phone, role: form.role, company_name: form.company_name,
        city: form.city, state: form.state, pincode: form.pincode
      });
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      if (step === 2) {
        setOtpError(msg);
      } else {
        setServerError(msg);
      }
    } finally {
      if (!skipLoadingState) setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Briefcase size={28} className="text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Quality Council <span className="text-blue-600">of India</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Account</h1>

          {/* Step indicator (only for jobseekers mid-flow) */}
          {form.role === 'jobseeker' && step === 2 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
              <div className="w-8 h-0.5 bg-blue-600"></div>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
              <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs font-bold">3</span>
            </div>
          )}
        </div>

        <div className="card p-8">

          {/* ─── STEP 1: Registration Form ─── */}
          {step === 1 && (
            <>
              {serverError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
              )}

              {/* Role selector */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I want to:</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['jobseeker', 'employer'] as const).map(role => (
                    <button key={role} type="button" onClick={() => handleRoleChange(role)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.role === role
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                      }`}>
                      {role === 'jobseeker' ? '🔍 Find a Job' : '🏢 Hire Talent'}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleStep1Submit} noValidate>
                <FormInput label="Full Name" name="name" value={form.name}
                  onChange={handleChange} onBlur={handleBlur}
                  error={errors.name} touched={touched.name}
                  placeholder="John Doe" required
                  hint="Only letters and spaces allowed" />

                <FormInput label="Email Address" name="email" type="email" value={form.email}
                  onChange={handleChange} onBlur={handleBlur}
                  error={errors.email} touched={touched.email}
                  placeholder="you@example.com" required />

                <FormInput label="Phone Number" name="phone" type="tel" value={form.phone}
                  onChange={handleChange} onBlur={handleBlur}
                  error={errors.phone} touched={touched.phone}
                  placeholder="9876543210" required
                  hint="10-digit Indian mobile number" />

                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="City" name="city" value={form.city}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="Bangalore" />
                  <FormInput label="Pincode" name="pincode" value={form.pincode}
                    onChange={handleChange} onBlur={handleBlur}
                    error={errors.pincode} touched={touched.pincode}
                    placeholder="560001" required
                    hint="6-digit pincode" />
                </div>

                <FormInput label="State" name="state" value={form.state}
                  onChange={handleChange} onBlur={handleBlur}
                  placeholder="Karnataka" />

                {form.role === 'employer' && (
                  <FormInput label="Company Name" name="company_name" value={form.company_name}
                    onChange={handleChange} onBlur={handleBlur}
                    error={errors.company_name} touched={touched.company_name}
                    placeholder="Acme Corp" required />
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder="Min 8 chars, letters & numbers"
                      autoComplete="new-password"
                      className={`input-field pr-10 ${touched.password && errors.password ? 'input-error' : ''}`} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <FormInput label="Confirm Password" name="confirmPassword" type={showPw ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
                  error={errors.confirmPassword} touched={touched.confirmPassword}
                  placeholder="Repeat your password" required autoComplete="new-password" />

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
                  {loading
                    ? 'Creating account...'
                    : form.role === 'jobseeker'
                      ? 'Continue to Verify Email'
                      : 'Create Account'
                  }
                </button>
              </form>

              <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
              </p>
            </>
          )}

          {/* ─── STEP 2: OTP Verification ─── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 mb-3">
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Verify Your Email</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  We need to verify <span className="font-medium text-gray-700 dark:text-gray-300">{form.email}</span>
                </p>
              </div>

              {otpError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{otpError}</div>
              )}

              {!otpSent ? (
                /* Send OTP prompt */
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                    Click the button below to receive a 6-digit OTP at your email address.
                  </p>
                  <button onClick={sendOtp} disabled={otpSending}
                    className="btn-primary w-full py-3 text-base">
                    {otpSending ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              ) : (
                /* OTP input */
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-5">
                    We've sent a 6-digit OTP to{' '}
                    <span className="font-medium text-gray-800 dark:text-gray-200">{form.email}</span>.
                    Enter it below to continue.
                  </p>

                  {/* 6 digit boxes */}
                  <div className="flex justify-center gap-2 mb-5">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        disabled={otpVerifying || otpVerified}
                        className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-lg
                          focus:outline-none focus:border-blue-500 transition-colors
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                          ${digit ? 'border-blue-400 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600'}
                          ${otpVerified ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                          disabled:opacity-60`}
                        style={{ height: '3.25rem' }}
                      />
                    ))}
                  </div>

                  {/* Resend */}
                  <div className="text-center mb-5">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Resend OTP in <span className="font-medium text-blue-500">{resendCooldown}s</span>
                      </p>
                    ) : (
                      <button onClick={sendOtp} disabled={otpSending}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50">
                        {otpSending ? 'Sending...' : 'Resend OTP'}
                      </button>
                    )}
                  </div>

                  {/* Verify button */}
                  {!otpVerified && (
                    <button onClick={verifyOtp} disabled={otpVerifying || otpDigits.join('').length !== 6}
                      className="btn-primary w-full py-3 text-base">
                      {otpVerifying ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                  )}

                  {/* Verified success state */}
                  {otpVerified && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle size={18} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Email verified! Creating your account...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Back link */}
              {!otpVerified && (
                <button onClick={() => { setStep(1); setOtpSent(false); setOtpError(''); }}
                  className="mt-5 w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  &larr; Back to edit details
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
