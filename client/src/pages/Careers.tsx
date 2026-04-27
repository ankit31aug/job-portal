import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, IndianRupee, Briefcase, TrendingUp } from 'lucide-react';
import api from '../utils/api';

const LEVELS = [
  {
    title: 'Coordinator',
    exp: '1–3 years',
    salary: '₹4L – ₹7L',
    description: 'Entry point into QCI accreditation. Work directly with organisations going through the accreditation process — site visits, documentation, coordination.',
    skills: ['Documentation', 'Communication', 'MS Office', 'Quality Standards', 'Coordination'],
  },
  {
    title: 'Analyst',
    exp: '2–4 years',
    salary: '₹5L – ₹9L',
    description: 'Deepen your domain expertise. Evaluate compliance, write assessment reports, support internal audits, and drive continuous improvement at client organisations.',
    skills: ['Data Analysis', 'Audit', 'Report Writing', 'Quality Assurance', 'ISO Standards'],
  },
  {
    title: 'Associate Manager',
    exp: '3–6 years',
    salary: '₹8L – ₹14L',
    description: 'Lead a team. Manage multiple accreditation projects simultaneously, mentor coordinators and analysts, and build long-term relationships with client organisations.',
    skills: ['Team Management', 'Project Management', 'Stakeholder Management', 'Leadership', 'Quality Systems'],
  },
  {
    title: 'Project Manager',
    exp: '5–8 years',
    salary: '₹12L – ₹20L',
    description: 'Drive strategy. Own end-to-end accreditation programmes for large clients, manage P&L for your department, and shape QCI\'s accreditation standards at a national level.',
    skills: ['PMP/Prince2', 'Strategic Planning', 'Risk Management', 'Executive Communication', 'Leadership'],
  },
];

const DEPT_CONFIG = {
  NABH: { color: '#0f766e', bg: 'from-teal-600 to-cyan-600', icon: '🏥', domain: 'Healthcare Accreditation' },
  NABET: { color: '#6d28d9', bg: 'from-violet-600 to-indigo-600', icon: '🎓', domain: 'Education & Training Accreditation' },
  NABL: { color: '#c2410c', bg: 'from-orange-600 to-amber-600', icon: '🔬', domain: 'Laboratory Accreditation' },
};

interface Stats { byDepartment: Record<string, number>; }

export default function Careers() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/jobs/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Quality Council of India</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Build a Career with <span className="text-blue-400">National Impact</span></h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Every role at QCI helps raise quality standards across India's healthcare, education, and laboratory sectors. Explore how your career can grow here.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {Object.entries(DEPT_CONFIG).map(([dept, cfg]) => (
              <div key={dept} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                <span className="text-xl">{cfg.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-sm">{dept}</p>
                  <p className="text-slate-400 text-xs">{stats?.byDepartment[dept] ?? 0} open roles</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Career ladders */}
      <div className="max-w-7xl mx-auto px-4 py-14 bg-gray-50 dark:bg-gray-900">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Career Progression at QCI</h2>
          <p className="text-gray-500 dark:text-gray-400">The same four-level ladder exists in every department — giving you the flexibility to specialise or transfer domains.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {Object.entries(DEPT_CONFIG).map(([dept, cfg]) => (
            <div key={dept} className="flex flex-col">
              {/* Dept header */}
              <div className={`bg-gradient-to-r ${cfg.bg} rounded-2xl p-5 mb-1 shadow-lg`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cfg.icon}</span>
                  <div>
                    <h3 className="text-xl font-black text-white">{dept}</h3>
                    <p className="text-white/70 text-xs">{cfg.domain}</p>
                  </div>
                </div>
              </div>

              {/* Level cards */}
              {LEVELS.map((level, idx) => (
                <React.Fragment key={level.title}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.color }}>{idx + 1}</span>
                          <h4 className="font-bold text-gray-900 dark:text-white">{level.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 ml-7">
                          <span className="flex items-center gap-1"><Briefcase size={10} />{level.exp}</span>
                          <span className="flex items-center gap-1"><IndianRupee size={10} />{level.salary}</span>
                        </div>
                      </div>
                      <Link to={`/browse?department=${dept}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold flex items-center gap-1"
                        style={{ color: cfg.color }}>
                        View <ArrowRight size={10} />
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed ml-7 mb-2">{level.description}</p>
                    <div className="flex flex-wrap gap-1 ml-7">
                      {level.skills.slice(0, 3).map(s => (
                        <span key={s} className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{s}</span>
                      ))}
                    </div>
                  </div>
                  {idx < LEVELS.length - 1 && (
                    <div className="flex justify-center py-1.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-px h-3 bg-gray-300" />
                        <ChevronDown size={14} className="text-gray-400" />
                        <p className="text-xs text-gray-400 font-medium">Grow</p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              <Link to={`/browse?department=${dept}`}
                className="mt-3 text-center text-sm font-semibold py-3 rounded-xl border-2 transition-all hover:text-white"
                style={{ borderColor: cfg.color, color: cfg.color } as any}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = cfg.color; (e.target as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = cfg.color; }}>
                View All {dept} Openings →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div className="max-w-5xl mx-auto px-4 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">Roles Comparison at a Glance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Experience</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Salary Band</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">NABH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">NABET</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">NABL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {LEVELS.map(l => (
                  <tr key={l.title} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{l.exp}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{l.salary}</td>
                    {(['NABH', 'NABET', 'NABL'] as const).map(d => (
                      <td key={d} className="px-4 py-3">
                        <Link to={`/browse?department=${d}`}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: DEPT_CONFIG[d].color }}>
                          {stats?.byDepartment[d] ? 'Hiring →' : 'View'}
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
