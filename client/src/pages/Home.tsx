import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, Briefcase, Users, Award, BookOpen, FlaskConical, TrendingUp, Star, CheckCircle, Building2, Layers } from 'lucide-react';
import api from '../utils/api';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import DepartmentCard from '../components/DepartmentCard';
import { useSettings } from '../context/SettingsContext';

interface JobStats { byDepartment: Record<string, number>; openingsByDept: Record<string, number>; total: number; totalOpenings: number; }

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = Date.now();
      const tick = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        setCount(Math.floor(progress * target));
        if (progress < 1) requestAnimationFrame(tick);
        else setCount(target);
      };
      requestAnimationFrame(tick);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count}</span>;
}

const DIVISIONS = [
  { acronym: 'PADD', full: 'Project Analysis & Documentation Division', desc: 'Manages voluntary conformity assessment frameworks including IndiaGHP and Ayush Mark.', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800', accent: 'text-blue-700 dark:text-blue-400', icon: '📋' },
  { acronym: 'PPID', full: 'Project Planning & Implementation Division', desc: 'Executes quality projects for central and state governments across India.', color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800', accent: 'text-violet-700 dark:text-violet-400', icon: '🗂️' },
  { acronym: 'NDIE', full: 'National Division for Industry Excellence', desc: 'Enhances industrial quality standards through benchmarking and best practices.', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800', accent: 'text-emerald-700 dark:text-emerald-400', icon: '🏭' },
  { acronym: 'TCB', full: 'Training Certification Board (under NABET)', desc: 'Certifies training organisations and individual trainers across industry and academia.', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800', accent: 'text-purple-700 dark:text-purple-400', icon: '🎯' },
  { acronym: 'SPD', full: 'Standards & Product Division', desc: 'Develops and promotes voluntary product standards to enable global competitiveness.', color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800', accent: 'text-cyan-700 dark:text-cyan-400', icon: '📐' },
  { acronym: 'IT', full: 'Information Technology Division', desc: 'Drives digital quality infrastructure and IT-enabled quality management systems.', color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800', accent: 'text-sky-700 dark:text-sky-400', icon: '💻' },
  { acronym: 'Media', full: 'Media & Communications Division', desc: 'Leads quality awareness campaigns and knowledge dissemination through media outreach.', color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800', accent: 'text-pink-700 dark:text-pink-400', icon: '📡' },
];

const WHY_ITEMS = [
  { icon: <Award size={22} className="text-violet-500" />, title: 'National Impact', desc: 'Your work directly influences quality standards across India\'s hospitals, labs, and educational institutions.', link: '/browse', cta: 'See Open Roles' },
  { icon: <TrendingUp size={22} className="text-emerald-500" />, title: 'Clear Career Growth', desc: 'Structured 4-level career ladder in every department — from Coordinator to Project Manager with defined salary bands.', link: '/careers', cta: 'Explore Career Paths' },
  { icon: <BookOpen size={22} className="text-purple-500" />, title: 'Domain Expertise', desc: 'Become a certified quality expert in NABH, NABET, or NABL — credentials respected across industry and government.', link: '/careers', cta: 'View Specialisations' },
  { icon: <Users size={22} className="text-orange-500" />, title: 'Collaborative Culture', desc: 'Work with multi-disciplinary teams of healthcare professionals, educators, and scientists on nation-wide quality missions.', link: '/about', cta: 'About QCI' },
];

export default function Home() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);

  useEffect(() => {
    api.get('/jobs?limit=6').then(({ data }) => setFeaturedJobs(data.jobs)).catch(() => {});
    api.get('/jobs/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/browse${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden text-white py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #c026d3 100%)' }}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 0%, transparent 50%), radial-gradient(circle at 75% 20%, white 0%, transparent 40%)' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Star size={14} className="text-yellow-300" />
            India's National Accreditation Body — {stats?.total ?? 0}+ active roles
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
            {settings.hero_title}
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            {settings.hero_subtitle}
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-xl">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Role, skill, or department…"
                className="flex-1 outline-none text-gray-800 placeholder-gray-400 text-sm" />
            </div>
            <button type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl transition-colors text-sm">
              Find Jobs
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['NABH', 'NABET', 'NABL', 'Coordinator', 'Analyst', 'Manager'].map(tag => (
              <button key={tag} onClick={() => navigate(`/browse?search=${tag}`)}
                className="bg-white/15 hover:bg-white/25 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Active Roles', value: stats?.total ?? 0, icon: <Briefcase size={20} className="text-violet-500" /> },
            { label: 'Total Openings', value: stats?.totalOpenings ?? 0, icon: <Users size={20} className="text-emerald-500" /> },
            { label: 'Boards', value: 5, icon: <Award size={20} className="text-purple-500" /> },
            { label: 'Career Levels', value: 4, icon: <TrendingUp size={20} className="text-orange-500" /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              {s.icon}
              <p className="text-3xl font-black text-gray-900 dark:text-white"><AnimatedCounter target={s.value} /></p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOARDS & DIVISIONS ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          {/* Boards heading */}
          <div className="text-center mb-10">
            <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Where You'll Work</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Five Boards. One Mission.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">QCI operates through five national accreditation boards, each shaping quality standards in a critical sector of India.</p>
          </div>

          {/* 5 board cards — all 5 in one row on large screens */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {(['NABCB', 'NABH', 'NABET', 'NABL', 'NBQP'] as const).map(dept => (
              <DepartmentCard key={dept} dept={dept}
                openRoles={stats?.byDepartment[dept] ?? 0}
                openings={stats?.openingsByDept[dept] ?? 0} />
            ))}
          </div>

          {/* Divisions heading */}
          <div className="text-center mt-14 mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-3">
              <Layers size={13} /> Operating Divisions
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Seven Divisions. Where Projects Come to Life.</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">Beyond accreditation, QCI's divisions implement quality programmes for government and industry.</p>
          </div>

          {/* Division cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {DIVISIONS.map(div => {
              const openRoles = stats?.byDepartment[div.acronym] ?? 0;
              return (
                <div key={div.acronym}
                  className={`rounded-2xl border p-6 ${div.color} cursor-pointer hover:shadow-lg transition-all duration-200 group`}
                  onClick={() => navigate(`/browse?department=${div.acronym}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{div.icon}</span>
                    {openRoles > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-gray-900/40 ${div.accent}`}>
                        {openRoles} role{openRoles !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <h3 className={`text-lg font-black mb-0.5 ${div.accent}`}>{div.acronym}</h3>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{div.full}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{div.desc}</p>
                  <div className={`flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all ${div.accent}`}>
                    Explore Roles <ArrowRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GUNVATTA GURUKUL ── */}
      <section className="py-14 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 60%, #7c3aed 100%)' }}>
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="text-5xl flex-shrink-0">🎓</div>
              <div className="flex-1 text-white">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest mb-3">
                  Student Programme
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">Gunvatta Gurukul</h2>
                <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-xl">
                  QCI's flagship student engagement initiative — we onboard <strong className="text-white">100 students</strong> every two months
                  for hands-on quality management training, live project experience, and mentorship from QCI experts.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Open to all disciplines', '100 seats per batch', 'Batch every 2 months', 'Certificate of completion'].map(tag => (
                    <span key={tag} className="bg-white/20 text-white/90 text-xs font-medium px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <a href="#"
                  className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3.5 rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-lg">
                  Apply Now <ArrowRight size={15} />
                </a>
                <p className="text-white/60 text-xs text-center mt-2">Link coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      {featuredJobs.length > 0 && (
        <section className="py-16 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-1">Latest Openings</p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Highlighted Opportunities</h2>
              </div>
              <Link to="/browse" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700">
                View all jobs <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
            <div className="text-center mt-8">
              <Link to="/browse"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors">
                Browse All Jobs <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── WHY QCI ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-2">Why Choose QCI</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">A Career That Means Something</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">More than a job — a mandate to improve quality standards across India's most important sectors.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_ITEMS.map(item => (
              <div key={item.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4 cursor-pointer group"
                onClick={() => navigate(item.link)}>
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:gap-2 transition-all">
                    {item.cta} <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAREER PATHS CTA ── */}
      <section className="py-14 px-4 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Plan Your Future</p>
          <h2 className="text-3xl font-black text-white mb-4">See Where a QCI Career Takes You</h2>
          <p className="text-slate-300 text-lg mb-8">Explore the complete career ladder — Coordinator to Project Manager — across NABH, NABET, and NABL.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/careers"
              className="bg-white text-slate-900 font-bold px-7 py-3.5 rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
              Explore Career Paths <ArrowRight size={16} />
            </Link>
            <Link to="/browse"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2">
              Browse Open Roles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
