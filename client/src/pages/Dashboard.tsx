import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, TrendingUp, Eye, Users, Bookmark, MapPin, IndianRupee, Bell, Plus, Trash2, ToggleLeft, ToggleRight, UserCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Application, Job, JobAlert } from '../types';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  shortlisted: { label: 'Shortlisted', color: 'bg-blue-100 text-blue-700', icon: <TrendingUp size={14} /> },
  interviewed: { label: 'Interview', color: 'bg-purple-100 text-purple-700', icon: <Users size={14} /> },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
};

const JOB_CATEGORIES = ['Operations', 'Management', 'Technology', 'Finance', 'HR', 'Administration', 'Design', 'Legal', 'Other'];

const emptyAlertForm = { label: '', keywords: '', location: '', category: '', experience_min: '', experience_max: '' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'saved' | 'alerts'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Job Alerts state
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({ ...emptyAlertForm });
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertError, setAlertError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'jobseeker') {
      Promise.all([
        api.get('/applications/my'),
        api.get('/bookmarks'),
      ]).then(([appsRes, bookmarksRes]) => {
        setApplications(appsRes.data);
        setSavedJobs(bookmarksRes.data);
      }).finally(() => setLoading(false));
    } else {
      api.get('/jobs/my').then(({ data }) => setJobs(data)).finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'alerts' && user?.role === 'jobseeker') loadAlerts();
  }, [activeTab]);

  const loadAlerts = async () => {
    setAlertsLoading(true);
    try {
      const { data } = await api.get('/job-alerts');
      setAlerts(data);
    } catch (_) {}
    setAlertsLoading(false);
  };

  const createAlert = async () => {
    if (!alertForm.label.trim()) { setAlertError('Alert name is required'); return; }
    setAlertSaving(true);
    setAlertError('');
    try {
      await api.post('/job-alerts', {
        label: alertForm.label,
        keywords: alertForm.keywords || undefined,
        location: alertForm.location || undefined,
        category: alertForm.category || undefined,
        experience_min: alertForm.experience_min ? parseInt(alertForm.experience_min) : undefined,
        experience_max: alertForm.experience_max ? parseInt(alertForm.experience_max) : undefined,
      });
      setAlertForm({ ...emptyAlertForm });
      setShowAlertForm(false);
      loadAlerts();
    } catch (err: any) {
      setAlertError(err.response?.data?.error || 'Failed to create alert');
    } finally {
      setAlertSaving(false);
    }
  };

  const toggleAlert = async (id: number) => {
    try {
      await api.patch(`/job-alerts/${id}/toggle`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: a.is_active ? 0 : 1 } : a));
    } catch (_) {}
  };

  const deleteAlert = async (id: number) => {
    if (!confirm('Delete this job alert?')) return;
    try {
      await api.delete(`/job-alerts/${id}`);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (_) {}
  };

  const removeSaved = async (jobId: number) => {
    await api.delete(`/bookmarks/${jobId}`);
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const loadJobApplications = async (jobId: number) => {
    setSelectedJob(jobId);
    const { data } = await api.get(`/applications/job/${jobId}`);
    setJobApplications(data);
  };

  const updateStatus = async (appId: number, status: string) => {
    await api.patch(`/applications/${appId}/status`, { status });
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, status: status as any } : a));
  };

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 dark:text-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Welcome back, {user?.name}!</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'jobseeker' && (
            <Link to="/profile" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors">
              <UserCircle size={15} /> Edit Profile
            </Link>
          )}
          {user?.role === 'employer' && (
            <Link to="/post-job" className="btn-primary flex items-center gap-2">
              <Briefcase size={16} />Post New Job
            </Link>
          )}
        </div>
      </div>

      {user?.role === 'jobseeker' ? (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Applied', value: applications.length, color: 'text-blue-600' },
              { label: 'Shortlisted', value: applications.filter(a => a.status === 'shortlisted').length, color: 'text-blue-600' },
              { label: 'Interviews', value: applications.filter(a => a.status === 'interviewed').length, color: 'text-purple-600' },
              { label: 'Saved Jobs', value: savedJobs.length, color: 'text-orange-500' },
            ].map(stat => (
              <div key={stat.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
            {[
              { key: 'applications', label: 'My Applications', icon: <FileText size={14} /> },
              { key: 'saved', label: 'Saved Jobs', icon: <Bookmark size={14} /> },
              { key: 'alerts', label: 'Job Alerts', icon: <Bell size={14} /> },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:border-gray-700'
                }`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'applications' && (
            <div className="card">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-3">No applications yet</p>
                  <Link to="/browse" className="btn-primary text-sm">Browse Jobs</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {applications.map(app => {
                    const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={app.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{app.job_title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{app.company} · {app.location}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {app.match_score > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {app.match_score}% match
                            </span>
                          )}
                          <span className={`badge ${cfg.color} flex items-center gap-1`}>
                            {cfg.icon}{cfg.label}
                          </span>
                          <Link to={`/jobs/${app.job_id}`} className="text-gray-400 hover:text-blue-600">
                            <Eye size={16} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="card">
              {savedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-3">No saved jobs yet</p>
                  <Link to="/browse" className="btn-primary text-sm">Browse Jobs</Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {savedJobs.map(job => (
                    <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {job.department && job.department !== 'General' && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{job.department}</span>
                          )}
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">{job.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.company}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-0.5"><MapPin size={10} />{job.location}</span>
                          <span>{job.experience_min}–{job.experience_max} yrs</span>
                          {job.salary_min && <span className="flex items-center gap-0.5"><IndianRupee size={10} />{(job.salary_min / 100000).toFixed(0)}L+</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/jobs/${job.id}`}
                          className="text-xs px-3 py-1.5 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          View
                        </Link>
                        <button onClick={() => removeSaved(job.id)}
                          className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-500">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{alerts.length} alert{alerts.length !== 1 ? 's' : ''} configured</p>
                <button onClick={() => { setShowAlertForm(true); setAlertError(''); }}
                  className="btn-primary text-sm flex items-center gap-1.5 py-2">
                  <Plus size={14} /> New Alert
                </button>
              </div>

              {showAlertForm && (
                <div className="card p-5 mb-4 border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create Job Alert</h3>
                  {alertError && <p className="text-red-600 text-sm mb-3">{alertError}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Alert Name <span className="text-red-500">*</span></label>
                      <input value={alertForm.label} onChange={e => setAlertForm(p => ({ ...p, label: e.target.value }))}
                        placeholder="e.g. Quality Manager roles in Delhi" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Keywords</label>
                      <input value={alertForm.keywords} onChange={e => setAlertForm(p => ({ ...p, keywords: e.target.value }))}
                        placeholder="e.g. ISO 9001, Quality" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Location</label>
                      <input value={alertForm.location} onChange={e => setAlertForm(p => ({ ...p, location: e.target.value }))}
                        placeholder="e.g. New Delhi" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
                      <select value={alertForm.category} onChange={e => setAlertForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                        <option value="">Any category</option>
                        {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Min Exp (yrs)</label>
                        <input type="number" min="0" max="60" value={alertForm.experience_min}
                          onChange={e => setAlertForm(p => ({ ...p, experience_min: e.target.value }))}
                          placeholder="0" className="input-field" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Max Exp (yrs)</label>
                        <input type="number" min="0" max="60" value={alertForm.experience_max}
                          onChange={e => setAlertForm(p => ({ ...p, experience_max: e.target.value }))}
                          placeholder="10" className="input-field" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createAlert} disabled={alertSaving} className="btn-primary text-sm py-2">
                      {alertSaving ? 'Creating...' : 'Create Alert'}
                    </button>
                    <button onClick={() => { setShowAlertForm(false); setAlertForm({ ...emptyAlertForm }); setAlertError(''); }}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {alertsLoading ? (
                <div className="text-center py-8"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div></div>
              ) : alerts.length === 0 ? (
                <div className="card text-center py-12">
                  <Bell size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-1">No job alerts yet</p>
                  <p className="text-gray-400 text-sm">Create an alert to be notified when matching jobs are posted</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`card p-4 flex items-start gap-3 ${!alert.is_active ? 'opacity-60' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{alert.label}</h3>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${alert.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                            {alert.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {alert.keywords && <span>Keywords: <span className="text-gray-700 dark:text-gray-300">{alert.keywords}</span></span>}
                          {alert.location && <span>Location: <span className="text-gray-700 dark:text-gray-300">{alert.location}</span></span>}
                          {alert.category && <span>Category: <span className="text-gray-700 dark:text-gray-300">{alert.category}</span></span>}
                          {(alert.experience_min != null || alert.experience_max != null) && (
                            <span>Exp: <span className="text-gray-700 dark:text-gray-300">{alert.experience_min ?? 0}–{alert.experience_max ?? '∞'} yrs</span></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(alert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => toggleAlert(alert.id)}
                          className={`p-1.5 rounded-lg transition-colors ${alert.is_active ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          title={alert.is_active ? 'Pause alert' : 'Activate alert'}>
                          {alert.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button onClick={() => deleteAlert(alert.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs list */}
          <div className="card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-800 dark:text-white">My Job Postings ({jobs.length})</h2>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No jobs posted yet</p>
                <Link to="/post-job" className="btn-primary text-sm">Post a Job</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[600px]">
                {jobs.map(job => (
                  <button key={job.id} onClick={() => loadJobApplications(job.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedJob === job.id ? 'bg-blue-50 dark:bg-blue-950 border-r-2 border-blue-500 dark:border-blue-400' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{job.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.location}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="badge bg-blue-100 text-blue-700 text-xs">{job.application_count || 0}</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{job.is_active ? 'Active' : 'Closed'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Applications for selected job */}
          <div className="lg:col-span-2 card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-800 dark:text-white">
                {selectedJob ? `Applications (${jobApplications.length})` : 'Select a job to view applications'}
              </h2>
            </div>
            {!selectedJob ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p>Select a job posting to view its applications</p>
              </div>
            ) : jobApplications.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                <p>No applications yet for this job</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[600px]">
                {jobApplications.map(app => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={app.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{app.full_name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{app.email} · {app.phone}</p>
                          {app.current_company && <p className="text-xs text-gray-400 dark:text-gray-500">Currently at: {app.current_company}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`badge ${cfg.color} flex items-center gap-1`}>
                            {cfg.icon}{cfg.label}
                          </span>
                          {app.match_score > 0 && (
                            <div className={`text-xs mt-1 font-medium ${app.match_score >= 70 ? 'text-green-600' : app.match_score >= 40 ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400'}`}>
                              {app.match_score}% match
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>Exp: {app.experience_years} yrs</span>
                        <span>Notice: {app.notice_period || 'N/A'}</span>
                        <span>CTC: {app.current_ctc || 'N/A'}</span>
                        <span>Expected: {app.expected_ctc || 'N/A'}</span>
                      </div>
                      {app.skills && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {app.skills.split(',').slice(0, 5).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-xs rounded">{s.trim()}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {(['shortlisted', 'interviewed', 'hired', 'rejected'] as const).map(s => (
                          <button key={s} onClick={() => updateStatus(app.id, s)}
                            disabled={app.status === s}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                              app.status === s
                                ? STATUS_CONFIG[s].color + ' border-transparent'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                            }`}>
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        {app.resume_path && (
                          <a href={`/uploads/${app.resume_path}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            View Resume
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
