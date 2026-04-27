import React from 'react';
import { MapPin, Clock, Bookmark, BookmarkCheck, IndianRupee } from 'lucide-react';
import { Job } from '../types';
import { useBookmark } from '../hooks/useBookmark';
import { useAuth } from '../context/AuthContext';

interface Props {
  job: Job;
  isSelected: boolean;
  onClick: () => void;
}

const DEPT_DOT: Record<string, string> = {
  NABH: 'bg-teal-500',
  NABET: 'bg-indigo-500',
  NABL: 'bg-orange-500',
  General: 'bg-gray-400',
};

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const f = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(0)}L` : `₹${n.toLocaleString()}`;
  if (min && max) return `${f(min)}–${f(max)}`;
  if (min) return `From ${f(min)}`;
  return `Up to ${f(max!)}`;
}

function daysAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

export default function BrowseJobRow({ job, isSelected, onClick }: Props) {
  const { user } = useAuth();
  const { bookmarked, toggle } = useBookmark(job.id);
  const salary = fmtSalary(job.salary_min, job.salary_max);

  return (
    <div onClick={onClick}
      className={`px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative ${
        isSelected ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-500 dark:border-l-blue-400' : 'border-l-4 border-l-transparent'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Company initial avatar */}
          <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ background: isSelected ? '#2563eb' : '#64748b' }}>
            {job.company.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {job.department && job.department !== 'General' && (
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DEPT_DOT[job.department] || DEPT_DOT.General}`} />
              )}
              <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-900 dark:text-gray-100'}`}>
                {job.title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.company}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                <MapPin size={10} />{job.location}
              </span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{job.experience_min}–{job.experience_max} yrs</span>
              {salary && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="flex items-center text-xs text-gray-400">{salary}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {user && (
            <button onClick={e => { e.stopPropagation(); toggle(); }}
              className={`p-1 rounded transition-colors ${bookmarked ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}>
              {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            </button>
          )}
          <span className="flex items-center gap-0.5 text-xs text-gray-400">
            <Clock size={10} />{daysAgo(job.created_at)}
          </span>
          {(job.application_count ?? 0) > 0 && (
            <span className="text-xs text-gray-400">{job.application_count} applied</span>
          )}
        </div>
      </div>
    </div>
  );
}
