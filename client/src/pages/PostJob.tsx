import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/FormInput';
import { validators } from '../utils/validation';

const CATEGORIES = ['Technology', 'Design', 'Data Science', 'Product', 'Marketing', 'Finance', 'Mobile', 'DevOps', 'Sales', 'Operations', 'HR', 'Other'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];

interface JobForm {
  title: string; location: string; job_type: string; category: string;
  experience_min: string; experience_max: string; salary_min: string; salary_max: string;
  description: string; requirements: string; skills: string; openings: string;
}

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<JobForm>({
    title: '', location: '', job_type: 'Full-time', category: 'Technology',
    experience_min: '0', experience_max: '5', salary_min: '', salary_max: '',
    description: '', requirements: '', skills: '', openings: '1'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [posted, setPosted] = useState(false);

  if (!user || user.role !== 'employer') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Employers Only</h2>
        <p className="text-gray-500 mb-4">Please register as an employer to post jobs.</p>
        <button onClick={() => navigate('/register')} className="btn-primary">Register as Employer</button>
      </div>
    );
  }

  const fieldValidators: Record<string, (val: string) => string | null> = {
    title: (v) => !v.trim() ? 'Job title is required' : v.trim().length < 3 ? 'Title must be at least 3 characters' : null,
    location: (v) => !v.trim() ? 'Location is required' : null,
    description: (v) => !v.trim() ? 'Description is required' : v.trim().length < 50 ? 'Description must be at least 50 characters' : null,
    requirements: (v) => !v.trim() ? 'Requirements are required' : null,
    skills: (v) => !v.trim() ? 'At least one skill is required' : null,
    salary_min: validators.salary,
    salary_max: validators.salary,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['title', 'location', 'description', 'requirements', 'skills'];
    const newTouched: Record<string, boolean> = {};
    required.forEach(f => { newTouched[f] = true; });
    setTouched(prev => ({ ...prev, ...newTouched }));

    let allValid = true;
    const newErrors: Record<string, string> = {};
    for (const field of required) {
      const error = fieldValidators[field]?.(form[field as keyof JobForm]);
      if (error) { newErrors[field] = error; allValid = false; }
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
    if (!allValid) return;

    setLoading(true);
    setServerError('');
    try {
      await api.post('/jobs', {
        ...form,
        experience_min: parseInt(form.experience_min) || 0,
        experience_max: parseInt(form.experience_max) || 5,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        openings: parseInt(form.openings) || 1,
      });
      setPosted(true);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  if (posted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card p-10 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Posted!</h2>
        <p className="text-gray-600 mb-6">Your job listing is now live and candidates can apply.</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-primary py-2.5">View Applications</button>
          <button onClick={() => { setPosted(false); setForm({ title: '', location: '', job_type: 'Full-time', category: 'Technology', experience_min: '0', experience_max: '5', salary_min: '', salary_max: '', description: '', requirements: '', skills: '', openings: '1' }); }} className="btn-secondary py-2.5">Post Another Job</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <PlusCircle size={24} className="text-blue-600" />Post a New Job
      </h1>
      <p className="text-gray-500 mb-6">Fill in the details to attract the right candidates</p>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{serverError}</div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} noValidate>
          <section className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div className="md:col-span-2">
                <FormInput label="Job Title" name="title" value={form.title}
                  onChange={handleChange} onBlur={handleBlur}
                  error={errors.title} touched={touched.title}
                  placeholder="e.g. Senior React Developer" required />
              </div>
              <FormInput label="Location" name="location" value={form.location}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.location} touched={touched.location}
                placeholder="Bangalore, Karnataka (or Remote)" required />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type <span className="text-red-500">*</span></label>
                <select name="job_type" value={form.job_type} onChange={handleChange} className="input-field">
                  {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} className="input-field">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <FormInput label="Number of Openings" name="openings" type="number" value={form.openings}
                onChange={handleChange} onBlur={handleBlur} placeholder="1" />
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Experience & Salary</h2>
            <div className="grid grid-cols-2 gap-x-4">
              <FormInput label="Min Experience (years)" name="experience_min" type="number" value={form.experience_min}
                onChange={handleChange} onBlur={handleBlur} placeholder="0" />
              <FormInput label="Max Experience (years)" name="experience_max" type="number" value={form.experience_max}
                onChange={handleChange} onBlur={handleBlur} placeholder="5" />
              <FormInput label="Min Salary (₹/annum)" name="salary_min" type="number" value={form.salary_min}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.salary_min} touched={touched.salary_min}
                placeholder="600000" hint="Leave blank to not disclose" />
              <FormInput label="Max Salary (₹/annum)" name="salary_max" type="number" value={form.salary_max}
                onChange={handleChange} onBlur={handleBlur}
                error={errors.salary_max} touched={touched.salary_max}
                placeholder="1200000" />
            </div>
          </section>

          <section className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Job Details</h2>
            <FormInput label="Job Description" name="description" as="textarea" value={form.description}
              onChange={handleChange} onBlur={handleBlur}
              error={errors.description} touched={touched.description}
              placeholder="Describe the role, responsibilities, team, and what makes this opportunity exciting..." required rows={5} />
            <FormInput label="Requirements" name="requirements" as="textarea" value={form.requirements}
              onChange={handleChange} onBlur={handleBlur}
              error={errors.requirements} touched={touched.requirements}
              placeholder="List each requirement on a new line:&#10;3+ years of React.js experience&#10;Strong JavaScript skills&#10;Bachelor's degree in CS or related field" required rows={4} />
            <FormInput label="Required Skills (comma-separated)" name="skills" value={form.skills}
              onChange={handleChange} onBlur={handleBlur}
              error={errors.skills} touched={touched.skills}
              placeholder="React,JavaScript,TypeScript,Node.js,Git" required
              hint="These skills are used to match candidates. No spaces around commas." />
          </section>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
