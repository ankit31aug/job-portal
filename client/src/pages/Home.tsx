import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, ArrowRight, Briefcase, Users, Award, BookOpen, TrendingUp,
  Star, Layers, ExternalLink, Building2, FlaskConical, GraduationCap,
  HeartPulse, BadgeCheck, ChevronRight, Globe, Shield,
} from 'lucide-react';
import api from '../utils/api';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import { useSettings } from '../context/SettingsContext';

interface JobStats {
  byDepartment: Record<string, number>;
  openingsByDept: Record<string, number>;
  total: number;
  totalOpenings: number;
}

function AnimatedCounter({ target, suffix = '', duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = Date.now();
      const tick = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
        else setCount(target);
      };
      requestAnimationFrame(tick);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

// The 5 boards with official taglines, colors, and website links
const BOARDS = [
  {
    name: 'NABH',
    full: 'National Accreditation Board for Hospitals & Healthcare Providers',
    tagline: 'Elevating Quality in Healthcare Across Nation',
    icon: <HeartPulse size={28} />,
    gradient: 'from-teal-600 via-teal-500 to-cyan-500',
    textColor: 'text-teal-600',
    bgLight: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    tag: 'Healthcare',
    website: 'https://www.nabh.co/',
  },
  {
    name: 'NABL',
    full: 'National Accreditation Board for Testing & Calibration Laboratories',
    tagline: 'Ensuring Safety, Accuracy & Trust Nationwide',
    icon: <FlaskConical size={28} />,
    gradient: 'from-orange-600 via-orange-500 to-amber-400',
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    tag: 'Laboratories',
    website: 'https://www.nabl-india.org/',
  },
  {
    name: 'NABCB',
    full: 'National Accreditation Board for Certification Bodies',
    tagline: 'Accredited Once, Accepted Everywhere',
    icon: <BadgeCheck size={28} />,
    gradient: 'from-blue-700 via-blue-600 to-indigo-500',
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    tag: 'Certification',
    website: 'https://nabcb.qcin.org/',
  },
  {
    name: 'NABET',
    full: 'National Accreditation Board for Education and Training',
    tagline: 'Striving for Quality in Education & Environment',
    icon: <GraduationCap size={28} />,
    gradient: 'from-violet-700 via-violet-600 to-purple-500',
    textColor: 'text-violet-600',
    bgLight: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    tag: 'Education & Training',
    website: 'https://www.nabet.org.in/',
  },
  {
    name: 'NBQP',
    full: 'National Board for Quality Promotion',
    tagline: 'Harnessing the Power of Collaboration for Quality',
    icon: <Star size={28} />,
    gradient: 'from-rose-600 via-rose-500 to-pink-400',
    textColor: 'text-rose-600',
    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
    borderColor: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    tag: 'Quality Promotion',
    website: 'https://qcin.org/nbqp',
  },
];

const DIVISIONS = [
  { acronym: 'PADD', full: 'Project Analysis & Documentation Division', icon: '📋', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800', accent: 'text-blue-700 dark:text-blue-400' },
  { acronym: 'PPID', full: 'Project Planning & Implementation Division', icon: '🗂️', color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800', accent: 'text-violet-700 dark:text-violet-400' },
  { acronym: 'NDIE', full: 'National Division for Industry Excellence', icon: '🏭', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800', accent: 'text-emerald-700 dark:text-emerald-400' },
  { acronym: 'TCB',  full: 'Training Certification Board (NABET)', icon: '🎯', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800', accent: 'text-purple-700 dark:text-purple-400' },
  { acronym: 'SPD',  full: 'Standards & Product Division', icon: '📐', color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800', accent: 'text-cyan-700 dark:text-cyan-400' },
  { acronym: 'IT',   full: 'Information Technology Division', icon: '💻', color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800', accent: 'text-sky-700 dark:text-sky-400' },
  { acronym: 'Media',   full: 'Media & Communications Division', icon: '📡', color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-800', accent: 'text-pink-700 dark:text-pink-400' },
  { acronym: 'Finance', full: 'Accounts & Finance Department', icon: '💰', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800', accent: 'text-green-700 dark:text-green-400' },
  { acronym: 'HR',      full: 'HR & Admin Department', icon: '👥', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800', accent: 'text-orange-700 dark:text-orange-400' },
];

const INITIATIVES = [
  {
    emoji: '🎓', tag: 'Student Programme', title: 'Gunvatta Gurukul',
    desc: 'QCI\'s flagship student initiative — 100 seats every two months for hands-on quality management training.',
    badges: ['100 seats/batch', 'Every 2 months', 'Certificate'],
    gradient: 'from-amber-500 to-red-500',
    href: 'https://gunvattagurukul.qcin.org/',
  },
  {
    emoji: '🌾', tag: 'Rural Outreach', title: 'Sarpanch Samwaad',
    desc: 'Connecting Gram Panchayat leaders with quality frameworks to drive governance at the grassroot level.',
    badges: ['Gram Panchayats', 'Quality Governance', 'Rural Impact'],
    gradient: 'from-green-600 to-teal-500',
    href: 'https://qcin.org/sarpanch-samvaad/',
  },
  {
    emoji: '🏙️', tag: 'Smart City', title: 'Quality City Nashik',
    desc: 'Transforming Nashik into India\'s first Quality City — embedding standards across civic services and industry.',
    badges: ['Nashik', 'Civic Quality', 'Model City'],
    gradient: 'from-violet-600 to-pink-500',
    href: 'https://qcin.org/quality-city-nashik/',
  },
  {
    emoji: '🏭', tag: 'Make in India', title: 'ZED Certification',
    desc: 'Zero Defect Zero Effect — MSME certification programme targeting 1.25 million MSMEs for international quality standards.',
    badges: ['1.25M MSMEs', 'Zero Defect', 'Make in India'],
    gradient: 'from-teal-600 to-blue-600',
    href: 'https://zed.org.in/',
  },
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
      <section className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(150deg, #012249 0%, #01417C 40%, #0a5da6 70%, #3791E5 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -left-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-blue-400/10" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-7">
              <Globe size={13} className="text-blue-300" />
              <span>Established 1997 · Ministry of Commerce &amp; Industry, Government of India</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
              One Portal.<br />
              <span className="text-blue-300">All of Quality India.</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              {settings.hero_subtitle || 'Search careers across NABH, NABL, NABCB, NABET & NBQP — every board, every division, all in one place.'}
            </p>

            {/* Search */}
            <form onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-7">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/20">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Role, board, skill, or department…"
                  className="flex-1 outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent" />
              </div>
              <button type="submit"
                className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl transition-colors text-sm whitespace-nowrap">
                Search Jobs
              </button>
            </form>

            {/* Quick filter tags */}
            <div className="flex flex-wrap justify-center gap-2">
              {['NABH', 'NABET', 'NABL', 'NABCB', 'NBQP', 'Coordinator', 'Manager', 'Analyst'].map(tag => (
                <button key={tag}
                  onClick={() => navigate(`/browse?search=${tag}`)}
                  className="bg-white/12 hover:bg-white/22 border border-white/20 text-white/90 text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
          <svg viewBox="0 0 1440 40" preserveAspectRatio="none" className="w-full h-full fill-white dark:fill-gray-900">
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </section>

      {/* ── QCI IMPACT STATS ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 pt-2 pb-2">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-7">
            QCI's National Impact at a Glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: 500000, suffix: '+', label: 'MSMEs Certified', icon: <Building2 size={20} className="text-brand-500" />, sub: 'Under ZED Programme' },
              { value: 29000, suffix: '+', label: 'Healthcare Entities', icon: <HeartPulse size={20} className="text-teal-500" />, sub: 'Accredited by NABH' },
              { value: 14000, suffix: '+', label: 'Laboratories', icon: <FlaskConical size={20} className="text-orange-500" />, sub: 'Accredited by NABL' },
              { value: 45000, suffix: '+', label: 'Professionals Trained', icon: <GraduationCap size={20} className="text-violet-500" />, sub: 'Across programmes' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-1">
                  {s.icon}
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{s.label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live portal stats */}
      {stats && stats.total > 0 && (
        <div className="bg-brand-700 dark:bg-brand-900 text-white py-3">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <strong><AnimatedCounter target={stats.total} /></strong>&nbsp;Active Roles
            </div>
            <span className="text-white/30 hidden sm:block">·</span>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-300" />
              <strong><AnimatedCounter target={stats.totalOpenings} /></strong>&nbsp;Total Openings
            </div>
            <span className="text-white/30 hidden sm:block">·</span>
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-blue-300" />
              5 Boards &amp; 9 Divisions
            </div>
            <Link to="/browse"
              className="ml-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors flex items-center gap-1">
              View All <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}

      {/* ── OUR BOARDS ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Shield size={12} /> Five National Accreditation Boards
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
              Five Boards. One Standard.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              QCI operates through five national boards, each setting international quality benchmarks in a critical sector of India's economy. Explore careers and official board websites from one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOARDS.map(board => (
              <div key={board.name}
                className={`group bg-white dark:bg-gray-800 rounded-2xl border ${board.borderColor} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}>

                {/* Color header bar */}
                <div className={`h-1.5 bg-gradient-to-r ${board.gradient}`} />

                <div className="p-6">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${board.gradient} flex items-center justify-center text-white shadow-md`}>
                      {board.icon}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${board.badgeBg}`}>
                      {board.tag}
                    </span>
                  </div>

                  {/* Name & tagline */}
                  <h3 className={`text-2xl font-black mb-1 ${board.textColor}`}>{board.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 leading-snug">{board.full}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed mb-5">
                    "{board.tagline}"
                  </p>

                  {/* Job count badge */}
                  {stats?.byDepartment[board.name] ? (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${board.bgLight} ${board.textColor}`}>
                      <Briefcase size={11} />
                      {stats.byDepartment[board.name]} open role{stats.byDepartment[board.name] !== 1 ? 's' : ''}
                      {stats.openingsByDept[board.name] ? ` · ${stats.openingsByDept[board.name]} openings` : ''}
                    </div>
                  ) : null}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Link to={`/browse?department=${board.name}`}
                      className={`flex-1 text-center text-sm font-bold py-2.5 rounded-xl bg-gradient-to-r ${board.gradient} text-white hover:opacity-90 transition-opacity`}>
                      View Careers
                    </Link>
                    <a href={board.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <ExternalLink size={13} />
                      Website
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Sixth card — browse all */}
            <div className="bg-gradient-to-br from-brand-700 to-brand-500 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg shadow-brand-500/20">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Layers size={24} />
                </div>
                <h3 className="text-2xl font-black mb-2">All Boards</h3>
                <p className="text-white/75 text-sm leading-relaxed mb-4">
                  Browse every open role across all five boards and nine divisions in one unified view.
                </p>
                {stats && (
                  <p className="text-white/60 text-xs mb-6">
                    {stats.total} active roles · {stats.totalOpenings} total openings
                  </p>
                )}
              </div>
              <Link to="/browse"
                className="flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm">
                Browse All Jobs <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVISIONS ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Layers size={12} /> Operating Divisions
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              Nine Divisions. Where Projects Come to Life.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              Beyond accreditation, QCI's divisions implement quality improvement programmes for government, industry, and consumers across India.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {DIVISIONS.map(div => {
              const openRoles = stats?.byDepartment[div.acronym] ?? 0;
              return (
                <div key={div.acronym}
                  onClick={() => navigate(`/browse?department=${div.acronym}`)}
                  className={`rounded-2xl border p-5 cursor-pointer hover:shadow-lg transition-all duration-200 group ${div.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{div.icon}</span>
                    {openRoles > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-gray-900/50 ${div.accent}`}>
                        {openRoles}
                      </span>
                    )}
                  </div>
                  <h3 className={`font-black text-base mb-1 ${div.accent}`}>{div.acronym}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{div.full}</p>
                  <div className={`mt-3 flex items-center gap-1 text-[11px] font-semibold ${div.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    View Roles <ChevronRight size={10} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      {featuredJobs.length > 0 && (
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-2">Latest Openings</p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Featured Opportunities</h2>
              </div>
              <Link to="/browse"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
            <div className="text-center mt-8">
              <Link to="/browse"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-brand-500/20">
                Browse All Jobs <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FLAGSHIP INITIATIVES ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              ✨ Nation Building Flagships
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              Beyond the Office. Beyond the Ordinary.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              QCI's initiatives that engage students, villages, and cities in the quality movement across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {INITIATIVES.map(item => (
              <div key={item.title} className="rounded-2xl overflow-hidden shadow-lg group">
                <div className={`p-6 h-full flex flex-col bg-gradient-to-br ${item.gradient}`}>
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <span className="inline-flex w-fit items-center bg-white/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white mb-3">
                    {item.tag}
                  </span>
                  <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed flex-1 mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.badges.map(b => (
                      <span key={b} className="bg-white/20 text-white/90 text-[10px] font-medium px-2.5 py-1 rounded-full">{b}</span>
                    ))}
                  </div>
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-xs w-fit">
                    Learn More <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY QCI ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-2">Why Choose QCI</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">A Career That Means Something</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              More than a job — a mandate to improve quality standards across India's most critical sectors.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: <Award size={22} className="text-brand-500" />, title: 'National Impact', desc: 'Your work directly influences quality standards across India\'s hospitals, labs, and educational institutions.', link: '/browse', cta: 'See Open Roles' },
              { icon: <TrendingUp size={22} className="text-emerald-500" />, title: 'Clear Career Growth', desc: 'Structured 4-level career ladder in every department — from Coordinator to Project Manager with defined salary bands.', link: '/careers', cta: 'Explore Career Paths' },
              { icon: <BookOpen size={22} className="text-purple-500" />, title: 'Domain Expertise', desc: 'Become a certified quality expert in NABH, NABET, or NABL — credentials respected across industry and government.', link: '/careers', cta: 'View Specialisations' },
              { icon: <Users size={22} className="text-orange-500" />, title: 'Collaborative Culture', desc: 'Work with multi-disciplinary teams of healthcare professionals, educators, and scientists on nation-wide quality missions.', link: '/about', cta: 'About QCI' },
            ].map(item => (
              <div key={item.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 flex gap-4 cursor-pointer group"
                onClick={() => navigate(item.link)}>
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 dark:text-brand-300 group-hover:gap-2 transition-all">
                    {item.cta} <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-16 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #012249 0%, #01417C 50%, #3791E5 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Join India's Quality Movement</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Be Part of Quality India</h2>
          <p className="text-white/70 text-lg mb-9 leading-relaxed">
            Open roles across all five boards and nine divisions. Upload your resume and let our matcher find the best fit.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/browse"
              className="bg-white text-brand-800 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2 shadow-xl">
              Browse Open Roles <ArrowRight size={16} />
            </Link>
            <Link to="/resume-match"
              className="bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors">
              Match My Resume
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
