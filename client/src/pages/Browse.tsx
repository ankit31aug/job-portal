import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, X, MapPin, Briefcase, Clock, IndianRupee, Bookmark, BookmarkCheck, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { Job } from '../types';
import BrowseJobRow from '../components/BrowseJobRow';
import SkillsGapPanel from '../components/SkillsGapPanel';
import { useAuth } from '../context/AuthContext';
import { useBookmark } from '../hooks/useBookmark';

const DEPTS = ['All', 'NABCB', 'NABH', 'NABET', 'NABL', 'NBQP', 'TCB', 'PADD', 'PPID', 'NDIE', 'SPD', 'IT', 'Media', 'Finance', 'HR'];

const DEPT_COLORS: Record<string, string> = {
  NABCB:   'bg-indigo-600',
  NABH:    'bg-teal-600',
  NABET:   'bg-violet-600',
  NABL:    'bg-orange-600',
  NBQP:    'bg-rose-600',
  TCB:     'bg-purple-600',
  PADD:    'bg-blue-600',
  PPID:    'bg-emerald-600',
  NDIE:    'bg-amber-600',
  SPD:     'bg-cyan-600',
  IT:      'bg-sky-600',
  Media:   'bg-pink-600',
  Finance: 'bg-green-600',
  HR:      'bg-orange-500',
};
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return 'Salary not disclosed';
  const f = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`;
  if (min && max) return `${f(min)} – ${f(max)} per annum`;
  if (min) return `From ${f(min)} per annum`;
  return `Up to ${f(max!)} per annum`;
}

function JobDetailPanel({ job, onApply }: { job: Job; onApply: () => void }) {
  const { user } = useAuth();
  const { bookmarked, toggle } = useBookmark(job.id);
  const skills = job.skills?.split(',').map(s => s.trim()) ?? [];

  return (
    <div className="h-full flex flex-col">
      {/* Sticky header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {job.department && job.department !== 'General' && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{job.department}</span>
              )}
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{job.job_type}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{job.category}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{job.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium">{job.company}</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={toggle}
                className={`p-2 rounded-xl border transition-colors ${bookmarked ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-400 hover:text-gray-600'}`}>
                {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
              {job.company.charAt(0)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>
          <span className="flex items-center gap-1"><Briefcase size={13} />{job.experience_min}–{job.experience_max} yrs exp</span>
          <span className="flex items-center gap-1"><IndianRupee size={13} />{fmtSalary(job.salary_min, job.salary_max)}</span>
          {job.openings > 1 && <span className="text-gray-500">{job.openings} openings</span>}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">

        {/* Skills gap */}
        <SkillsGapPanel jobSkills={job.skills} />

        {/* Description */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About This Role</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>

        {/* Requirements */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
          <ul className="space-y-1.5">
            {job.requirements.split('\n').filter(Boolean).map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Skills */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-medium border border-blue-100 dark:border-blue-800">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky footer CTA */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-3">
        {user ? (
          <>
            <Link to={`/apply/${job.id}`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm text-center transition-colors">
              Apply with Resume
            </Link>
            <Link to={`/jobs/${job.id}`}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm text-center transition-colors">
              Full Details
            </Link>
          </>
        ) : (
          <>
            <Link to={`/login`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm text-center transition-colors">
              Sign In to Apply
            </Link>
            <Link to={`/jobs/${job.id}`}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm text-center transition-colors">
              Full Details
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [dept, setDept] = useState(searchParams.get('department') || 'All');
  const [jobType, setJobType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const fetchJobs = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: '20' };
      if (search) params.search = search;
      if (dept && dept !== 'All') params.department = dept;
      if (jobType) params.job_type = jobType;
      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
      if (data.jobs.length > 0 && !selectedJob) {
        setSelectedJob(data.jobs[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const d = searchParams.get('department') || 'All';
    if (d !== dept) setDept(d);
  }, [searchParams]);

  useEffect(() => { fetchJobs(1); }, [dept, jobType]);

  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId && jobs.length > 0) {
      const found = jobs.find(j => j.id === parseInt(jobId));
      if (found) setSelectedJob(found);
    }
  }, [jobs]);

  const selectJob = (job: Job) => {
    setSelectedJob(job);
    setSearchParams(prev => { prev.set('job', String(job.id)); return prev; }, { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Search */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 bg-gray-50 dark:bg-gray-800">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Role, skill, keyword..."
                className="flex-1 py-2.5 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
              {search && <button type="button" onClick={() => { setSearch(''); fetchJobs(1); }}><X size={13} className="text-gray-400" /></button>}
            </div>
            <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white px-3 rounded-xl text-sm font-medium transition-colors">
              Go
            </button>
          </form>
        </div>

        {/* Department tabs */}
        <div className="flex gap-1 px-3 pt-2 pb-1 overflow-x-auto scrollbar-hide">
          {DEPTS.map(d => (
            <button key={d} onClick={() => setDept(d)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dept === d
                  ? `${DEPT_COLORS[d] ?? 'bg-violet-600'} text-white`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {d}
            </button>
          ))}
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 ml-auto">
            <Filter size={12} />Filters
          </button>
        </div>

        {showFilters && (
          <div className="px-3 pb-2 flex gap-2 flex-wrap">
            {JOB_TYPES.map(t => (
              <button key={t} onClick={() => setJobType(jobType === t ? '' : t)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  jobType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                }`}>
                {t}
              </button>
            ))}
          </div>
        )}

        <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-400">{loading ? 'Loading…' : `${total} job${total !== 1 ? 's' : ''} found`}</p>
        </div>

        {/* Job list */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse p-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                      <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No jobs found</p>
              <button onClick={() => { setSearch(''); setDept('All'); setJobType(''); fetchJobs(1); }}
                className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
            </div>
          ) : (
            jobs.map(job => (
              <BrowseJobRow key={job.id} job={job}
                isSelected={selectedJob?.id === job.id}
                onClick={() => selectJob(job)} />
            ))
          )}
          {pages > 1 && !loading && (
            <div className="flex gap-1 p-3 justify-center">
              {page > 1 && <button onClick={() => fetchJobs(page - 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">← Prev</button>}
              {page < pages && <button onClick={() => fetchJobs(page + 1)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">Next →</button>}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="hidden lg:flex flex-1 flex-col overflow-hidden bg-white dark:bg-gray-800">
        {!selectedJob ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ChevronRight size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Select a job to view details</p>
            <p className="text-sm mt-1">Choose from the list on the left</p>
          </div>
        ) : (
          <JobDetailPanel job={selectedJob} onApply={() => {}} />
        )}
      </div>
    </div>
  );
}
