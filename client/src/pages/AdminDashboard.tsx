import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, FileText, CheckCircle, Clock, TrendingUp, Users,
  PlusCircle, ToggleLeft, ToggleRight, ShieldCheck, Eye, Settings2, Save,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSettings, SiteSettings } from '../context/SettingsContext';
import { Job, Application } from '../types';

const DEPARTMENTS = ['All', 'NABH', 'NABET', 'NABL', 'General'];
const CATEGORIES = ['Operations', 'Management', 'Technology', 'Finance', 'HR', 'Administration', 'Design', 'Legal', 'Other'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'];

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-700' },
  shortlisted: { label: 'Shortlisted', color: 'bg-blue-100 text-blue-700' },
  interviewed: { label: 'Interview',   color: 'bg-purple-100 text-purple-700' },
  hired:       { label: 'Hired',       color: 'bg-green-100 text-green-700' },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700' },
};

const DEPT_COLORS: Record<string, string> = {
  NABH:    'bg-blue-100 text-blue-700',
  NABET:   'bg-purple-100 text-purple-700',
  NABL:    'bg-orange-100 text-orange-700',
  General: 'bg-gray-100 text-gray-600',
};

interface Stats { totalJobs: number; totalApplications: number; pending: number; inProgress: number; hired: number; }

const emptyForm = {
  title: '', company: 'Quality Council of India', location: 'New Delhi',
  job_type: 'Full-time', category: 'Operations', department: 'NABH',
  experience_min: '0', experience_max: '5', salary_min: '', salary_max: '',
  description: '', requirements: '', skills: '', openings: '1',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'jobs' | 'settings'>('jobs');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [deptFilter, setDeptFilter] = useState('All');
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [postSuccess, setPostSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/admin-login'); return; }
    if (user.role !== 'hr') { navigate('/'); return; }
    loadAll();
  }, [user]);

  useEffect(() => {
    setSiteSettings({ ...settings });
  }, [settings]);

  const handleSettingChange = (key: keyof SiteSettings, value: string) => {
    setSiteSettings(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const saveSettings = async () => {
    if (!siteSettings) return;
    setSavingSettings(true);
    try {
      await api.put('/settings', siteSettings);
      await refreshSettings();
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/jobs'),
      ]);
      setStats(statsRes.data);
      setJobs(jobsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (job: Job) => {
    setSelectedJob(job);
    setShowPostForm(false);
    setEditingJob(null);
    const { data } = await api.get(`/admin/applications/job/${job.id}`);
    setApplications(data);
  };

  const updateStatus = async (appId: number, status: string) => {
    await api.patch(`/admin/applications/${appId}/status`, { status });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: status as any } : a));
    const statsRes = await api.get('/admin/stats');
    setStats(statsRes.data);
  };

  const toggleJob = async (job: Job) => {
    await api.patch(`/admin/jobs/${job.id}/toggle`);
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: j.is_active ? 0 : 1 } : j));
    const statsRes = await api.get('/admin/stats');
    setStats(statsRes.data);
  };

  const openPostForm = () => {
    setEditingJob(null);
    setForm({ ...emptyForm });
    setShowPostForm(true);
    setSelectedJob(null);
    setPostError('');
    setPostSuccess('');
  };

  const openEditForm = (job: Job) => {
    setEditingJob(job);
    setForm({
      title: job.title, company: job.company, location: job.location,
      job_type: job.job_type, category: job.category, department: job.department || 'General',
      experience_min: String(job.experience_min), experience_max: String(job.experience_max),
      salary_min: job.salary_min ? String(job.salary_min) : '',
      salary_max: job.salary_max ? String(job.salary_max) : '',
      description: job.description, requirements: job.requirements,
      skills: job.skills, openings: String(job.openings),
    });
    setShowPostForm(true);
    setSelectedJob(null);
    setPostError('');
    setPostSuccess('');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPostError('');
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.requirements || !form.skills) {
      setPostError('Title, description, requirements, and skills are required');
      return;
    }
    setPosting(true);
    setPostError('');
    try {
      const payload = {
        ...form,
        experience_min: parseInt(form.experience_min) || 0,
        experience_max: parseInt(form.experience_max) || 5,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        openings: parseInt(form.openings) || 1,
      };
      if (editingJob) {
        await api.put(`/admin/jobs/${editingJob.id}`, payload);
        setPostSuccess('Job updated successfully!');
      } else {
        await api.post('/admin/jobs', payload);
        setPostSuccess('Job posted successfully!');
        setForm({ ...emptyForm });
      }
      const jobsRes = await api.get('/admin/jobs');
      setJobs(jobsRes.data);
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (err: any) {
      setPostError(err.response?.data?.error || 'Failed to save job');
    } finally {
      setPosting(false);
    }
  };

  const filteredJobs = deptFilter === 'All' ? jobs : jobs.filter(j => j.department === deptFilter);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ShieldCheck size={22} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Quality Council of India — {user?.name}</p>
          </div>
        </div>
        <button onClick={openPostForm}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <PlusCircle size={16} />Post New Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('jobs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'jobs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}>
          <Briefcase size={15} />Jobs & Applications
        </button>
        <button onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}>
          <Settings2 size={15} />Site Settings
        </button>
      </div>

      {/* Stats */}
      {stats && activeTab === 'jobs' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Active Jobs',       value: stats.totalJobs,       color: 'text-emerald-600', icon: <Briefcase size={18} /> },
            { label: 'Total Applications',value: stats.totalApplications,color: 'text-blue-600',    icon: <FileText size={18} /> },
            { label: 'Pending Review',    value: stats.pending,         color: 'text-yellow-600',  icon: <Clock size={18} /> },
            { label: 'In Progress',       value: stats.inProgress,      color: 'text-purple-600',  icon: <TrendingUp size={18} /> },
            { label: 'Hired',             value: stats.hired,           color: 'text-green-600',   icon: <CheckCircle size={18} /> },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && siteSettings && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Site Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">All changes apply site-wide immediately after saving</p>
            </div>
            <button onClick={saveSettings} disabled={savingSettings}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
              <Save size={15} />{savingSettings ? 'Saving...' : settingsSaved ? 'Saved!' : 'Save All Changes'}
            </button>
          </div>

          {settingsSaved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Settings saved successfully. Changes are now live.
            </div>
          )}

          <div className="space-y-8">
            {/* Branding */}
            <section>
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Branding</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input value={siteSettings.site_name} onChange={e => handleSettingChange('site_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Tagline</label>
                  <input value={siteSettings.site_tagline} onChange={e => handleSettingChange('site_tagline', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </section>

            {/* Hero Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Hero Section</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                  <input value={siteSettings.hero_title} onChange={e => handleSettingChange('hero_title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                  <textarea value={siteSettings.hero_subtitle} onChange={e => handleSettingChange('hero_subtitle', e.target.value)}
                    rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Start Color</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={siteSettings.hero_gradient_from}
                        onChange={e => handleSettingChange('hero_gradient_from', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                      <input value={siteSettings.hero_gradient_from} onChange={e => handleSettingChange('hero_gradient_from', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background End Color</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={siteSettings.hero_gradient_to}
                        onChange={e => handleSettingChange('hero_gradient_to', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5" />
                      <input value={siteSettings.hero_gradient_to} onChange={e => handleSettingChange('hero_gradient_to', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" />
                    </div>
                  </div>
                </div>
                {/* Live preview */}
                <div className="rounded-xl p-4 text-white text-center text-sm"
                  style={{ background: `linear-gradient(135deg, ${siteSettings.hero_gradient_from}, ${siteSettings.hero_gradient_to})` }}>
                  <p className="font-bold text-lg">{siteSettings.hero_title}</p>
                  <p className="text-white/80 text-xs mt-1">{siteSettings.hero_subtitle}</p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <section>
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Footer</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About Text</label>
                  <textarea value={siteSettings.footer_about} onChange={e => handleSettingChange('footer_about', e.target.value)}
                    rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input value={siteSettings.footer_email} onChange={e => handleSettingChange('footer_email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input value={siteSettings.footer_phone} onChange={e => handleSettingChange('footer_phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={siteSettings.footer_address} onChange={e => handleSettingChange('footer_address', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input value={siteSettings.footer_linkedin} onChange={e => handleSettingChange('footer_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X URL</label>
                    <input value={siteSettings.footer_twitter} onChange={e => handleSettingChange('footer_twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>
            </section>

            {/* Job Defaults */}
            <section>
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Job Defaults</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Company Name</label>
                  <input value={siteSettings.default_company} onChange={e => handleSettingChange('default_company', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Location</label>
                  <input value={siteSettings.default_location} onChange={e => handleSettingChange('default_location', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
      <>

      {/* Department filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {DEPARTMENTS.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              deptFilter === d
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}>
            {d}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{filteredJobs.length} jobs</span>
      </div>

      {/* Main panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Jobs list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-800 text-sm">Job Postings ({filteredJobs.length})</h2>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No jobs found</div>
            ) : filteredJobs.map(job => (
              <div key={job.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedJob?.id === job.id ? 'bg-emerald-50 border-r-2 border-emerald-500' : ''
                }`}
                onClick={() => loadApplications(job)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {job.department && job.department !== 'General' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DEPT_COLORS[job.department] || DEPT_COLORS.General}`}>
                          {job.department}
                        </span>
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {job.application_count || 0}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); openEditForm(job); }}
                        className="text-xs text-gray-400 hover:text-emerald-600 px-1 py-0.5">
                        Edit
                      </button>
                      <button onClick={e => { e.stopPropagation(); toggleJob(job); }}
                        className="text-gray-400 hover:text-emerald-600">
                        {job.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel: applications or post form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {showPostForm ? (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800 text-sm">
                  {editingJob ? `Edit Job: ${editingJob.title}` : 'Post New Job'}
                </h2>
                <button onClick={() => setShowPostForm(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[580px]">
                {postError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{postError}</div>}
                {postSuccess && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{postSuccess}</div>}
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
                      <input name="title" value={form.title} onChange={handleFormChange}
                        placeholder="e.g. Hospital Accreditation Coordinator"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                      <select name="department" value={form.department} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        {['NABH', 'NABET', 'NABL', 'General'].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                      <select name="category" value={form.category} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                      <input name="company" value={form.company} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                      <input name="location" value={form.location} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
                      <select name="job_type" value={form.job_type} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Openings</label>
                      <input name="openings" type="number" value={form.openings} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Experience (yrs)</label>
                      <input name="experience_min" type="number" value={form.experience_min} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Experience (yrs)</label>
                      <input name="experience_max" type="number" value={form.experience_max} onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Salary (₹/annum)</label>
                      <input name="salary_min" type="number" value={form.salary_min} onChange={handleFormChange}
                        placeholder="e.g. 400000"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Salary (₹/annum)</label>
                      <input name="salary_max" type="number" value={form.salary_max} onChange={handleFormChange}
                        placeholder="e.g. 700000"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                      <textarea name="description" value={form.description} onChange={handleFormChange}
                        rows={4} placeholder="Describe the role and responsibilities..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Requirements <span className="text-red-500">*</span></label>
                      <textarea name="requirements" value={form.requirements} onChange={handleFormChange}
                        rows={3} placeholder="One requirement per line..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Skills (comma-separated) <span className="text-red-500">*</span></label>
                      <input name="skills" value={form.skills} onChange={handleFormChange}
                        placeholder="e.g. Healthcare,Quality Management,Documentation"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <button type="submit" disabled={posting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {posting ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                  </button>
                </form>
              </div>
            </>
          ) : !selectedJob ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
              <Users size={40} className="mb-3 opacity-40" />
              <p className="text-sm">Select a job to view applications</p>
              <p className="text-xs mt-1">or click "Post New Job" to create one</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-800 text-sm">{selectedJob.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      {selectedJob.department && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${DEPT_COLORS[selectedJob.department] || DEPT_COLORS.General}`}>
                          {selectedJob.department}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => openEditForm(selectedJob)}
                    className="text-xs text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg">
                    Edit Job
                  </button>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No applications yet for this job</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 overflow-y-auto max-h-[560px]">
                  {applications.map(app => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={app.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{app.full_name}</h3>
                            <p className="text-xs text-gray-500">{app.email} · {app.phone}</p>
                            {app.current_company && (
                              <p className="text-xs text-gray-400 mt-0.5">Currently at: {app.current_company}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                            {app.match_score > 0 && (
                              <div className={`text-xs mt-1 font-semibold ${
                                app.match_score >= 70 ? 'text-green-600' : app.match_score >= 40 ? 'text-yellow-600' : 'text-gray-500'
                              }`}>
                                {app.match_score}% match
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-xs text-gray-500 mb-2">
                          <span>Exp: {app.experience_years} yrs</span>
                          <span>Notice: {app.notice_period || 'N/A'}</span>
                          <span>CTC: {app.current_ctc || 'N/A'}</span>
                          <span>Expected: {app.expected_ctc || 'N/A'}</span>
                        </div>

                        {app.skills && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {app.skills.split(',').slice(0, 6).map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{s.trim()}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-1.5 flex-wrap">
                          {(['shortlisted', 'interviewed', 'hired', 'rejected'] as const).map(s => (
                            <button key={s} onClick={() => updateStatus(app.id, s)}
                              disabled={app.status === s}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                app.status === s
                                  ? STATUS_CONFIG[s].color + ' border-transparent'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                              }`}>
                              {STATUS_CONFIG[s].label}
                            </button>
                          ))}
                          {app.resume_path && (
                            <a href={`/uploads/${app.resume_path}`} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center gap-1">
                              <Eye size={12} />View Resume
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
