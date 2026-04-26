import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Briefcase } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Job, ParsedResume } from '../types';
import FormInput from '../components/FormInput';
import ResumeUpload from '../components/ResumeUpload';
import { validators } from '../utils/validation';

interface AppForm {
  full_name: string; email: string; phone: string; pincode: string; city: string; state: string;
  experience_years: string; current_company: string; current_ctc: string; expected_ctc: string;
  notice_period: string; skills: string; cover_letter: string;
}

const NOTICE_PERIODS = ['Immediate', '15 days', '30 days', '45 days', '60 days', '90 days'];

export default function Apply() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<AppForm>({
    full_name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    pincode: user?.pincode || '', city: user?.city || '', state: user?.state || '',
    experience_years: '', current_company: '', current_ctc: '', expected_ctc: '',
    notice_period: '', skills: '', cover_letter: ''
  });

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: `/apply/${jobId}` } }); return; }
    api.get(`/jobs/${jobId}`).then(({ data }) => setJob(data)).catch(() => navigate('/'));
  }, [jobId]);

  const fieldValidators: Record<string, (val: string) => string | null> = {
    full_name: validators.name,
    email: validators.email,
    phone: validators.phone,
    pincode: validators.pincode,
    experience_years: validators.experienceYears,
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

  const handleBlur = (e: React.FocusEvent<any>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleParsed = (data: ParsedResume) => {
    setForm(prev => ({
      ...prev,
      full_name: data.name || prev.full_name,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      pincode: data.pincode || prev.pincode,
      city: data.city || prev.city,
      skills: data.skills || prev.skills,
      experience_years: String(data.experienceYears || prev.experience_years),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['full_name', 'email', 'phone', 'pincode'];
    const newTouched: Record<string, boolean> = {};
    required.forEach(f => { newTouched[f] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));

    let allValid = true;
    const newErrors: Record<string, string> = {};
    for (const field of required) {
      const error = fieldValidators[field]?.(form[field as keyof AppForm]);
      if (error) { newErrors[field] = error; allValid = false; }
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    if (!allValid) return;

    setSubmitting(true);
    setServerError('');
    try {
      const formData = new FormData();
      formData.append('job_id', jobId!);
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
      if (resumeFile) formData.append('resume', resumeFile);

      await api.post('/applications', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-10 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-600 mb-2">Your application for <strong>{job?.title}</strong> at <strong>{job?.company}</strong> has been submitted successfully.</p>
        <p className="text-sm text-gray-500 mb-6">The employer will review your profile and get back to you.</p>
        <div className="flex flex-col gap-3">
          <Link to="/dashboard" className="btn-primary py-2.5">View My Applications</Link>
          <Link to="/" className="btn-secondary py-2.5">Browse More Jobs</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={`/jobs/${jobId}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} />Back to Job
      </Link>

      {job && (
        <div className="card p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
            {job.company.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{job.title}</h2>
            <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
          </div>
          <span className="ml-auto badge bg-blue-100 text-blue-700">{job.job_type}</span>
        </div>
      )}

      <div className="card p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Apply for this Position</h1>
        <p className="text-sm text-gray-500 mb-6">Upload your PDF resume to auto-fill the form, then review and submit.</p>

        <ResumeUpload
          label="Upload Resume (PDF — auto-fills form)"
          onParsed={handleParsed}
          onFileSelected={setResumeFile}
        />

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="border-t border-gray-100 pt-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <FormInput label="Full Name" name="full_name" value={form.full_name}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.full_name} touched={touched.full_name}
                placeholder="John Doe" required />
              <FormInput label="Email Address" name="email" type="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.email} touched={touched.email}
                placeholder="you@example.com" required />
              <FormInput label="Phone Number" name="phone" type="tel" value={form.phone}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.phone} touched={touched.phone}
                placeholder="9876543210" required />
              <FormInput label="Pincode" name="pincode" value={form.pincode}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.pincode} touched={touched.pincode}
                placeholder="560001" required hint="6-digit pincode" />
              <FormInput label="City" name="city" value={form.city}
                onChange={handleChange} onBlur={handleBlur} placeholder="Bangalore" />
              <FormInput label="State" name="state" value={form.state}
                onChange={handleChange} onBlur={handleBlur} placeholder="Karnataka" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <FormInput label="Years of Experience" name="experience_years" type="number" value={form.experience_years}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.experience_years} touched={touched.experience_years}
                placeholder="3" hint="Total years of work experience" />
              <FormInput label="Current Company" name="current_company" value={form.current_company}
                onChange={handleChange} onBlur={handleBlur} placeholder="Acme Corp (or Fresher)" />
              <FormInput label="Current CTC (₹ per annum)" name="current_ctc" value={form.current_ctc}
                onChange={handleChange} onBlur={handleBlur} placeholder="600000" />
              <FormInput label="Expected CTC (₹ per annum)" name="expected_ctc" value={form.expected_ctc}
                onChange={handleChange} onBlur={handleBlur} placeholder="800000" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
              <select name="notice_period" value={form.notice_period} onChange={handleChange}
                className="input-field">
                <option value="">Select notice period</option>
                {NOTICE_PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <FormInput label="Skills (comma-separated)" name="skills" value={form.skills}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="React, Node.js, TypeScript, SQL..."
              hint="Add skills relevant to this job for better match score" />
          </div>

          <div className="border-t border-gray-100 pt-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
              Cover Letter <span className="text-gray-400 font-normal text-sm">(optional)</span>
            </h3>
            <FormInput label="Cover Letter" name="cover_letter" as="textarea" value={form.cover_letter}
              onChange={handleChange} onBlur={handleBlur} rows={5}
              placeholder="Tell the employer why you're the perfect fit for this role..." />
          </div>

          <button type="submit" disabled={submitting}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
            {submitting ? 'Submitting...' : <><Briefcase size={18} />Submit Application</>}
          </button>
        </form>
      </div>
    </div>
  );
}
