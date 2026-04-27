import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, IndianRupee, Users, TrendingUp } from 'lucide-react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  showMatchScore?: boolean;
}

const categoryColors: Record<string, string> = {
  Technology:     'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Operations:     'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  Management:     'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  Finance:        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  HR:             'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  Administration: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  Design:         'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  Legal:          'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
};

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobCard({ job, showMatchScore }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max);
  const skills = job.skills.split(',').slice(0, 4);

  return (
    <div className="card p-5 group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${categoryColors[job.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
              {job.category}
            </span>
            <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{job.job_type}</span>
            {showMatchScore && job.match_score !== undefined && job.match_score > 0 && (
              <span className={`badge ${job.match_score >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : job.match_score >= 40 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} flex items-center gap-1`}>
                <TrendingUp size={10} />
                {job.match_score}% match
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>
          <p className="text-gray-600 dark:text-gray-300 font-medium">{job.company}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {job.company.charAt(0)}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>
        <span className="flex items-center gap-1"><Briefcase size={13} />{job.experience_min}-{job.experience_max} yrs</span>
        {salary && <span className="flex items-center gap-1"><IndianRupee size={13} />{salary}</span>}
        {job.openings > 1 && <span className="flex items-center gap-1"><Users size={13} />{job.openings} openings</span>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {skills.map((skill) => (
          <span key={skill} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md font-medium">
            {skill.trim()}
          </span>
        ))}
        {job.skills.split(',').length > 4 && (
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-md">
            +{job.skills.split(',').length - 4} more
          </span>
        )}
      </div>

      {showMatchScore && job.matched_skills && job.matched_skills.length > 0 && (
        <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-green-700 dark:text-green-300 font-medium">Matched skills: {job.matched_skills.slice(0, 5).join(', ')}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <Clock size={12} />
          {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {job.application_count !== undefined && ` · ${job.application_count} applicants`}
        </span>
        <Link to={`/jobs/${job.id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
          View Details →
        </Link>
      </div>
    </div>
  );
}
