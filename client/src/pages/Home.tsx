import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Briefcase, Users, TrendingUp, X } from 'lucide-react';
import api from '../utils/api';
import { Job } from '../types';
import JobCard from '../components/JobCard';

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote', 'Contract', 'Internship'];
const CATEGORIES = ['Technology', 'Design', 'Data Science', 'Product', 'Marketing', 'Finance', 'Mobile', 'DevOps'];

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [jobType, setJobType] = useState('');
  const [experience, setExperience] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchJobs = async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: '9' };
      if (search) params.search = search;
      if (location) params.location = location;
      if (category) params.category = category;
      if (jobType) params.job_type = jobType;
      if (experience) params.experience = experience;

      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(1); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const clearFilters = () => {
    setSearch(''); setLocation(''); setCategory(''); setJobType(''); setExperience('');
    setTimeout(() => fetchJobs(1), 0);
  };

  const hasFilters = search || location || category || jobType || experience;

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your <span className="text-yellow-300">Dream Job</span></h1>
          <p className="text-blue-100 text-lg mb-8">Discover thousands of job opportunities with all the information you need</p>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search size={20} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Job title, skills, company..."
                className="flex-1 py-2 outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 border-t md:border-t-0 md:border-l border-gray-200">
              <MapPin size={20} className="text-gray-400 flex-shrink-0" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Location (city, state...)"
                className="flex-1 py-2 outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex-shrink-0">
              Search Jobs
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {CATEGORIES.slice(0, 6).map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); fetchJobs(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === cat ? 'bg-white text-blue-600' : 'bg-blue-500/40 text-blue-100 hover:bg-blue-500/60'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: <Briefcase size={24} className="text-blue-600" />, label: 'Active Jobs', value: total },
            { icon: <Users size={24} className="text-green-600" />, label: 'Companies Hiring', value: '50+' },
            { icon: <TrendingUp size={24} className="text-purple-600" />, label: 'New Jobs This Week', value: '30+' }
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              {s.icon}
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className={`lg:w-64 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-4 sticky top-20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <X size={12} />Clear all
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                {JOB_TYPES.map(t => (
                  <label key={t} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="jobType" value={t} checked={jobType === t}
                      onChange={() => { setJobType(t); fetchJobs(1); }}
                      className="text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{t}</span>
                  </label>
                ))}
                {jobType && <button onClick={() => { setJobType(''); fetchJobs(1); }} className="text-xs text-blue-600 mt-1">Clear</button>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={category} onChange={e => { setCategory(e.target.value); fetchJobs(1); }}
                  className="input-field text-sm">
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience: {experience ? `${experience}+ yrs` : 'Any'}
                </label>
                <input type="range" min="0" max="15" value={experience || 0}
                  onChange={e => { setExperience(e.target.value === '0' ? '' : e.target.value); fetchJobs(1); }}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Fresher</span><span>15+ yrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Job listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm">{loading ? 'Loading...' : `${total} job${total !== 1 ? 's' : ''} found`}</p>
                {hasFilters && <p className="text-xs text-blue-600 mt-0.5">Filters applied</p>}
              </div>
              <button onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden flex items-center gap-2 btn-secondary text-sm py-1.5">
                <Filter size={16} />Filters
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No jobs found</h3>
                <p className="text-gray-400 mb-4">Try adjusting your search criteria</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>

                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button disabled={page === 1} onClick={() => fetchJobs(page - 1)}
                      className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
                    {[...Array(pages)].map((_, i) => (
                      <button key={i} onClick={() => fetchJobs(i + 1)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-blue-600 text-white' : 'btn-secondary'}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button disabled={page === pages} onClick={() => fetchJobs(page + 1)}
                      className="btn-secondary text-sm disabled:opacity-40">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
