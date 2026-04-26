import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, TrendingUp, Eye, Users } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Application, Job } from '../types';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14} /> },
  shortlisted: { label: 'Shortlisted', color: 'bg-blue-100 text-blue-700', icon: <TrendingUp size={14} /> },
  interviewed: { label: 'Interview', color: 'bg-purple-100 text-purple-700', icon: <Users size={14} /> },
  hired: { label: 'Hired', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'jobseeker') {
      api.get('/applications/my').then(({ data }) => setApplications(data)).finally(() => setLoading(false));
    } else {
      api.get('/jobs/my').then(({ data }) => setJobs(data)).finally(() => setLoading(false));
    }
  }, [user]);

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}!</p>
        </div>
        {user?.role === 'employer' && (
          <Link to="/post-job" className="btn-primary flex items-center gap-2">
            <Briefcase size={16} />Post New Job
          </Link>
        )}
      </div>

      {user?.role === 'jobseeker' ? (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Applied', value: applications.length, color: 'text-blue-600' },
              { label: 'Shortlisted', value: applications.filter(a => a.status === 'shortlisted').length, color: 'text-blue-600' },
              { label: 'Interviews', value: applications.filter(a => a.status === 'interviewed').length, color: 'text-purple-600' },
              { label: 'Hired', value: applications.filter(a => a.status === 'hired').length, color: 'text-green-600' },
            ].map(stat => (
              <div key={stat.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">My Applications</h2>
            </div>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">No applications yet</p>
                <Link to="/" className="btn-primary text-sm">Browse Jobs</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {applications.map(app => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={app.id} className="p-4 hover:bg-gray-50 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{app.job_title}</h3>
                        <p className="text-sm text-gray-500">{app.company} · {app.location}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs list */}
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">My Job Postings ({jobs.length})</h2>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm mb-3">No jobs posted yet</p>
                <Link to="/post-job" className="btn-primary text-sm">Post a Job</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                {jobs.map(job => (
                  <button key={job.id} onClick={() => loadJobApplications(job.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedJob === job.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{job.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{job.location}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="badge bg-blue-100 text-blue-700 text-xs">{job.application_count || 0}</span>
                        <p className="text-xs text-gray-400 mt-1">{job.is_active ? 'Active' : 'Closed'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Applications for selected job */}
          <div className="lg:col-span-2 card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">
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
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                {jobApplications.map(app => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={app.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{app.full_name}</h3>
                          <p className="text-sm text-gray-500">{app.email} · {app.phone}</p>
                          {app.current_company && <p className="text-xs text-gray-400">Currently at: {app.current_company}</p>}
                        </div>
                        <div className="text-right">
                          <span className={`badge ${cfg.color} flex items-center gap-1`}>
                            {cfg.icon}{cfg.label}
                          </span>
                          {app.match_score > 0 && (
                            <div className={`text-xs mt-1 font-medium ${app.match_score >= 70 ? 'text-green-600' : app.match_score >= 40 ? 'text-yellow-600' : 'text-gray-500'}`}>
                              {app.match_score}% match
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                        <span>Exp: {app.experience_years} yrs</span>
                        <span>Notice: {app.notice_period || 'N/A'}</span>
                        <span>CTC: {app.current_ctc || 'N/A'}</span>
                        <span>Expected: {app.expected_ctc || 'N/A'}</span>
                      </div>
                      {app.skills && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {app.skills.split(',').slice(0, 5).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{s.trim()}</span>
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
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                            }`}>
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        {app.resume_path && (
                          <a href={`/uploads/${app.resume_path}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">
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
