import React, { useState } from 'react';
import { Upload, Search, FileText, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Job } from '../types';
import JobCard from '../components/JobCard';

export default function ResumeMatch() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const handleMatch = async () => {
    if (!file) return;
    if (!user) { setError('Please login to use Resume Match'); return; }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await api.post('/resume/match', formData);
      setJobs(data.jobs);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setSearched(false);
    } else {
      setError('Only PDF resumes are supported');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <TrendingUp size={32} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Resume-Based Job Matching</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">Upload your PDF resume and we'll instantly find the best matching jobs based on your skills and experience.</p>
      </div>

      <div className="card p-8 mb-8 max-w-xl mx-auto">
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('resume-input')?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
            }`}
          >
            <Upload size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Drop your resume here</p>
            <p className="text-sm text-gray-400 mb-3">or click to upload</p>
            <p className="text-xs text-gray-400">PDF only — Max 5MB</p>
            <input id="resume-input" type="file" accept=".pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setSearched(false); setError(''); } }} />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
              <FileText size={24} className="text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button onClick={() => { setFile(null); setSearched(false); setJobs([]); }}
                className="text-sm text-red-500 hover:text-red-700">Remove</button>
            </div>
            <button onClick={handleMatch} disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
              {loading
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Analyzing Resume...</>
                : <><Search size={18} />Find Matching Jobs</>}
            </button>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

        {!user && (
          <p className="text-center text-sm text-amber-600 mt-3">
            Please <a href="/login" className="font-medium underline">login</a> to use this feature
          </p>
        )}
      </div>

      {searched && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {jobs.length > 0 ? `Found ${jobs.length} matching jobs` : 'No matching jobs found'}
            </h2>
            {jobs.length > 0 && (
              <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Sorted by match score</span>
            )}
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="mb-2">We couldn't find matching jobs for your resume.</p>
              <p className="text-sm">Try <a href="/" className="text-blue-600 hover:underline">browsing all jobs</a> instead.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map(job => <JobCard key={job.id} job={job} showMatchScore />)}
            </div>
          )}
        </div>
      )}

      {!searched && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {[
            { icon: '📄', title: 'Upload PDF Resume', desc: 'Our AI reads your skills, experience, and background' },
            { icon: '🔍', title: 'Smart Matching', desc: 'We compare your profile against all active job listings' },
            { icon: '✅', title: 'See Your Matches', desc: 'Jobs sorted by compatibility score so best fits are first' }
          ].map(step => (
            <div key={step.title} className="card p-5 text-center">
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
