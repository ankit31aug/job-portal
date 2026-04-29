import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Save, Upload, FileText, ArrowLeft, Check, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { validators } from '../utils/validation';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', phone: '', city: '', state: '', pincode: '',
    bio: '', skills: '', experience_years: '', current_company: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [currentResume, setCurrentResume] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [flashType, setFlashType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        bio: data.bio || '',
        skills: data.skills || '',
        experience_years: data.experience_years != null ? String(data.experience_years) : '',
        current_company: data.current_company || '',
      });
      setCurrentResume(data.profile_resume_path || null);
    } catch (_) {}
  };

  const validate = (name: string, value: string): string => {
    if (name === 'name') return validators.name(value) || '';
    if (name === 'phone' && value) return validators.phone(value) || '';
    if (name === 'pincode' && value) return validators.pincode(value) || '';
    if (name === 'experience_years' && value) return validators.experienceYears(value) || '';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const showFlash = (msg: string, type: 'success' | 'error' = 'success') => {
    setFlash(msg);
    setFlashType(type);
    setTimeout(() => setFlash(''), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]));
    setTouched(allTouched);
    const newErrors = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, validate(k, v)]));
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (resumeFile) fd.append('resume', resumeFile);
      await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      showFlash('Profile saved successfully');
      setResumeFile(null);
      if (fileRef.current) fileRef.current.value = '';
      loadProfile();
    } catch (err: any) {
      showFlash(err.response?.data?.error || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inp = 'input-field';
  const lbl = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Keep your information up to date</p>
        </div>
        {flash && (
          <div className={`ml-auto flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${flashType === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {flashType === 'success' ? <Check size={14} /> : <X size={14} />}{flash}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800 dark:text-white">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Full Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name} onChange={handleChange} onBlur={handleBlur}
                placeholder="Your full name" className={`${inp} ${touched.name && errors.name ? 'input-error' : ''}`} />
              {touched.name && errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur}
                placeholder="10-digit mobile number" className={`${inp} ${touched.phone && errors.phone ? 'input-error' : ''}`} />
              {touched.phone && errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div>
              <label className={lbl}>City</label>
              <input name="city" value={form.city} onChange={handleChange} onBlur={handleBlur}
                placeholder="Your city" className={inp} />
            </div>
            <div>
              <label className={lbl}>State</label>
              <select name="state" value={form.state} onChange={handleChange} onBlur={handleBlur} className={inp}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Pincode</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} onBlur={handleBlur}
                placeholder="6-digit pincode" className={`${inp} ${touched.pincode && errors.pincode ? 'input-error' : ''}`} />
              {touched.pincode && errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* Professional Info — jobseekers only */}
        {user?.role === 'jobseeker' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileText size={16} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800 dark:text-white">Professional Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Current Company</label>
                  <input name="current_company" value={form.current_company} onChange={handleChange} onBlur={handleBlur}
                    placeholder="Where you work now (if any)" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Years of Experience</label>
                  <input name="experience_years" type="number" min="0" max="60" value={form.experience_years}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="e.g. 3" className={`${inp} ${touched.experience_years && errors.experience_years ? 'input-error' : ''}`} />
                  {touched.experience_years && errors.experience_years && <p className="mt-1 text-sm text-red-600">{errors.experience_years}</p>}
                </div>
              </div>
              <div>
                <label className={lbl}>Skills</label>
                <input name="skills" value={form.skills} onChange={handleChange} onBlur={handleBlur}
                  placeholder="e.g. Quality Management, ISO 9001, Data Analysis (comma separated)" className={inp} />
                <p className="text-xs text-gray-400 mt-1">Separate skills with commas. These are used for job matching.</p>
              </div>
              {form.skills && (
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">{s}</span>
                  ))}
                </div>
              )}
              <div>
                <label className={lbl}>Bio / About Me</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} onBlur={handleBlur}
                  rows={4} placeholder="Brief introduction about yourself, your experience, and career goals..."
                  className={`${inp} resize-none`} />
              </div>
            </div>
          </div>
        )}

        {/* Resume Upload — jobseekers only */}
        {user?.role === 'jobseeker' && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Upload size={16} className="text-blue-600" />
              <h2 className="font-semibold text-gray-800 dark:text-white">Resume / CV</h2>
            </div>
            {currentResume && !resumeFile && (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                <FileText size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-300 flex-1 truncate">Current resume on file</span>
                <a href={currentResume} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-green-700 dark:text-green-400 hover:underline font-medium flex-shrink-0">View</a>
              </div>
            )}
            {resumeFile && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <FileText size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">{resumeFile.name}</span>
                <button type="button" onClick={() => { setResumeFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-gray-400 hover:text-red-500"><X size={14} /></button>
              </div>
            )}
            <label className="block cursor-pointer">
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => setResumeFile(e.target.files?.[0] || null)} />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
              </div>
            </label>
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 py-2.5 px-6">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <Link to="/dashboard"
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
