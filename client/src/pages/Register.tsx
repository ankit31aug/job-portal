import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';
import { validators } from '../utils/validation';

type Role = 'jobseeker' | 'employer';

interface FormState {
  name: string; email: string; password: string; confirmPassword: string;
  phone: string; role: Role; company_name: string; city: string; state: string; pincode: string;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    role: 'jobseeker', company_name: '', city: '', state: '', pincode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);
    setServerError('');
    try {
      await register({
        name: form.name.trim(), email: form.email.trim(), password: form.password,
        phone: form.phone, role: form.role, company_name: form.company_name,
        city: form.city, state: form.state, pincode: form.pincode
      });
      navigate('/');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Briefcase size={28} className="text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Quality Council <span className="text-blue-600">of India</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
        </div>

        <div className="card p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
          )}

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">I want to:</p>
            <div className="grid grid-cols-2 gap-3">
              {(['jobseeker', 'employer'] as const).map(role => (
                <button key={role} type="button" onClick={() => handleRoleChange(role)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.role === role ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {role === 'jobseeker' ? '🔍 Find a Job' : '🏢 Hire Talent'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              {touched.password && errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <FormInput label="Confirm Password" name="confirmPassword" type={showPw ? 'text' : 'password'}
              value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
              error={errors.confirmPassword} touched={touched.confirmPassword}
              placeholder="Repeat your password" required autoComplete="new-password" />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
