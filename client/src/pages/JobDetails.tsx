import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, IndianRupee, Users, Clock, ArrowLeft, CheckCircle, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Job } from '../types';
import SkillsGapPanel from '../components/SkillsGapPanel';
import { useBookmark } from '../hooks/useBookmark';

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return 'Not disclosed';
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} per annum`;
  if (min) return `From ${fmt(min)} per annum`;
  return `Up to ${fmt(max!)} per annum`;
}

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);
  const { bookmarked, toggle: toggleBookmark } = useBookmark(job?.id ?? 0);

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => setError('Job not found or no longer available'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = () => {
    if (!user) { navigate('/login', { state: { from: `/jobs/${id}` } }); return; }
    navigate(`/apply/${id}`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card p-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-3 bg-gray-200 rounded"></div>)}</div>
      </div>
    </div>
  );

  if (error || !job) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-red-600 mb-4">{error}</p>
      <Link to="/" className="btn-primary">Browse Jobs</Link>
    </div>
  );

  const requirements = job.requirements.split('\n').filter(Boolean);
  const skills = job.skills.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft size={16} />Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-blue-100 text-blue-700">{job.category}</span>
                  <span className="badge bg-gray-100 text-gray-600">{job.job_type}</span>
                  {job.is_active ? (
                    <span className="badge bg-green-100 text-green-700">Active</span>
                  ) : (
                    <span className="badge bg-red-100 text-red-700">Closed</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600 text-lg mt-1">{job.company}</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {job.company.charAt(0)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: <MapPin size={16} />, label: job.location },
                { icon: <Briefcase size={16} />, label: `${job.experience_min}-${job.experience_max} yrs exp` },
                { icon: <IndianRupee size={16} />, label: formatSalary(job.salary_min, job.salary_max) },
                { icon: <Users size={16} />, label: `${job.openings} opening${job.openings > 1 ? 's' : ''}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-blue-500">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              Posted {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{job.description}</div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
            <ul className="space-y-2">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <SkillsGapPanel jobSkills={job.skills} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-20">
            <div className="space-y-3">
              {job.is_active ? (
                <button onClick={handleApply}
                  className="btn-primary w-full py-3 text-base">
                  {user?.role === 'employer' ? 'This is your category' : 'Apply Now'}
                </button>
              ) : (
                <div className="w-full py-3 text-center text-gray-500 bg-gray-100 rounded-lg text-sm">
                  This position is no longer accepting applications
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleShare} className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-2">
                  {shared ? <><CheckCircle size={16} />Copied!</> : <><Share2 size={16} />Share</>}
                </button>
                {user && (
                  <button onClick={toggleBookmark}
                    className={`py-2 px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-colors ${
                      bookmarked ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    {bookmarked ? 'Saved' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Job Overview</h3>
              {[
                { label: 'Category', value: job.category },
                { label: 'Job Type', value: job.job_type },
                { label: 'Experience', value: `${job.experience_min}-${job.experience_max} years` },
                { label: 'Openings', value: job.openings.toString() },
                { label: 'Salary', value: formatSalary(job.salary_min, job.salary_max) },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-800 font-medium text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
