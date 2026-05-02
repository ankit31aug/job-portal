import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, ArrowRight, Briefcase, Users, Award, TrendingUp,
  Star, Layers, ExternalLink, Building2, FlaskConical, GraduationCap,
  HeartPulse, BadgeCheck, ChevronRight, Globe, Shield,
  FileText, Sparkles,
  BookMarked, Target,
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

const BOARDS = [
  { name: 'NABH',  full: 'National Accreditation Board for Hospitals & Healthcare Providers',      tagline: 'Elevating Quality in Healthcare Across India',       icon: <HeartPulse size={26} />,   gradient: 'from-teal-600 via-teal-500 to-cyan-500',        textColor: 'text-teal-600',   bgLight: 'bg-teal-50 dark:bg-teal-900/20',     borderColor: 'border-teal-200 dark:border-teal-800',     badgeBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',    tag: 'Healthcare',          website: 'https://www.nabh.co/' },
  { name: 'NABL',  full: 'National Accreditation Board for Testing & Calibration Laboratories',   tagline: 'Ensuring Safety, Accuracy & Trust Nationwide',       icon: <FlaskConical size={26} />, gradient: 'from-orange-600 via-orange-500 to-amber-400',    textColor: 'text-orange-600', bgLight: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800', badgeBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', tag: 'Laboratories',        website: 'https://www.nabl-india.org/' },
  { name: 'NABCB', full: 'National Accreditation Board for Certification Bodies',                  tagline: 'Accredited Once, Accepted Everywhere',               icon: <BadgeCheck size={26} />,   gradient: 'from-blue-700 via-blue-600 to-indigo-500',      textColor: 'text-blue-600',   bgLight: 'bg-blue-50 dark:bg-blue-900/20',     borderColor: 'border-blue-200 dark:border-blue-800',     badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',     tag: 'Certification',       website: 'https://nabcb.qcin.org/' },
  { name: 'NABET', full: 'National Accreditation Board for Education and Training',               tagline: 'Striving for Quality in Education & Environment',    icon: <GraduationCap size={26} />, gradient: 'from-violet-700 via-violet-600 to-purple-500',  textColor: 'text-violet-600', bgLight: 'bg-violet-50 dark:bg-violet-900/20', borderColor: 'border-violet-200 dark:border-violet-800', badgeBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300', tag: 'Education & Training', website: 'https://www.nabet.org.in/' },
  { name: 'NBQP',  full: 'National Board for Quality Promotion',                                  tagline: 'Harnessing the Power of Collaboration for Quality',  icon: <Star size={26} />,         gradient: 'from-rose-600 via-rose-500 to-pink-400',        textColor: 'text-rose-600',   bgLight: 'bg-rose-50 dark:bg-rose-900/20',     borderColor: 'border-rose-200 dark:border-rose-800',     badgeBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',     tag: 'Quality Promotion',   website: 'https://qcin.org/nbqp' },
];

const DIVISIONS = [
  { acronym: 'PADD', full: 'Project Analysis & Documentation Division',   icon: '📋', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',       accent: 'text-blue-700 dark:text-blue-400',    ring: 'group-hover:ring-blue-200 dark:group-hover:ring-blue-700' },
  { acronym: 'PPID', full: 'Project Planning & Implementation Division',  icon: '🗂️', color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800', accent: 'text-violet-700 dark:text-violet-400', ring: 'group-hover:ring-violet-200 dark:group-hover:ring-violet-700' },
  { acronym: 'NDIE', full: 'National Division for Industry Excellence',   icon: '🏭', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800', accent: 'text-emerald-700 dark:text-emerald-400', ring: 'group-hover:ring-emerald-200 dark:group-hover:ring-emerald-700' },
  { acronym: 'SPD',  full: 'Standards & Product Division',                icon: '📐', color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800',         accent: 'text-cyan-700 dark:text-cyan-400',    ring: 'group-hover:ring-cyan-200 dark:group-hover:ring-cyan-700' },
];

const WHAT_WE_DO = [
  { icon: <HeartPulse size={22} />, color: 'from-teal-500 to-cyan-500', iconBg: 'bg-teal-100 dark:bg-teal-900/40', iconColor: 'text-teal-700 dark:text-teal-300', title: 'Accreditation', desc: 'Setting international quality benchmarks for hospitals, testing laboratories, and certification bodies across India through NABH, NABL, and NABCB.', href: 'https://www.qcin.org/what-we-do' },
  { icon: <GraduationCap size={22} />, color: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-100 dark:bg-violet-900/40', iconColor: 'text-violet-700 dark:text-violet-300', title: 'Education & Training', desc: 'NABET accredits vocational training providers, environmental auditors, and quality system lead auditors under national and international standards.', href: 'https://www.nabet.org.in/' },
  { icon: <Award size={22} />, color: 'from-rose-500 to-pink-500', iconBg: 'bg-rose-100 dark:bg-rose-900/40', iconColor: 'text-rose-700 dark:text-rose-300', title: 'Quality Promotion', desc: "NBQP drives India's quality culture through national quality awards, quality movements, and awareness campaigns for consumers and industry.", href: 'https://qcin.org/nbqp' },
  { icon: <BadgeCheck size={22} />, color: 'from-blue-500 to-indigo-500', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-700 dark:text-blue-300', title: 'Certification', desc: 'Third-party product and management system certification for MSMEs and large enterprises seeking domestic compliance and global export readiness.', href: 'https://nabcb.qcin.org/' },
  { icon: <Globe size={22} />, color: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-700 dark:text-emerald-300', title: 'International Recognition', desc: 'MoUs with IAF, ILAC, and APAC for mutual recognition of accreditation — making Indian certifications and test reports accepted worldwide.', href: 'https://www.qcin.org/what-we-do' },
  { icon: <TrendingUp size={22} />, color: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-700 dark:text-amber-300', title: 'Capacity Building', desc: 'Training MSMEs, government bodies, and industry professionals in quality management systems — enabling compliance, competitiveness, and export readiness.', href: 'https://www.qcin.org/what-we-do' },
];


export default function Home() {
  const navigate = useNavigate();
  const { settings, parseJSON } = useSettings();
  const [search, setSearch] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);

  const announcements = parseJSON<any[]>(settings.home_announcements, []);
  const events        = parseJSON<any[]>(settings.home_events, []);
  const initiatives   = parseJSON<any[]>(settings.home_initiatives, []);

  const impactStats = [
    { value: +settings.home_stat1_value || 500000, suffix: '+', label: settings.home_stat1_label, sub: settings.home_stat1_sub, icon: <Building2 size={20} className="text-brand-500" /> },
    { value: +settings.home_stat2_value || 29000,  suffix: '+', label: settings.home_stat2_label, sub: settings.home_stat2_sub, icon: <HeartPulse size={20} className="text-teal-500" /> },
    { value: +settings.home_stat3_value || 14000,  suffix: '+', label: settings.home_stat3_label, sub: settings.home_stat3_sub, icon: <FlaskConical size={20} className="text-orange-500" /> },
    { value: +settings.home_stat4_value || 45000,  suffix: '+', label: settings.home_stat4_label, sub: settings.home_stat4_sub, icon: <GraduationCap size={20} className="text-violet-500" /> },
  ];


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
        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-cyan-400/10 blur-2xl" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <Globe size={12} className="text-blue-300" />
              <span>{settings.home_hero_badge}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
              {settings.home_hero_title_1}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                {settings.home_hero_title_2}
              </span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              {settings.home_hero_subtitle}
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-7">
              <div className="flex-1 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/30 ring-2 ring-white/20 focus-within:ring-white/60 transition-all">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={settings.home_search_placeholder}
                  className="flex-1 outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent" />
              </div>
              <button type="submit"
                className="bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-bold px-7 py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 transition-all text-sm whitespace-nowrap">
                Search Jobs
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-2">
              {['NABH', 'NABET', 'NABL', 'NABCB', 'NBQP', 'Coordinator', 'Manager', 'Analyst'].map(tag => (
                <button key={tag} onClick={() => navigate(`/browse?search=${tag}`)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white/90 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-full fill-white dark:fill-gray-900">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </section>

      {/* ── IMPACT STATS ── */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-8">
            QCI's National Impact at a Glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {impactStats.map(s => (
              <div key={s.label} className="group flex flex-col items-center gap-1.5">
                <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-200">
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

      {/* ── LIVE PORTAL STATS BAR ── */}
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
              5 Boards &amp; 4 Core Divisions
            </div>
            <span className="ml-2 bg-white/10 border border-white/20 text-white/60 text-xs px-3 py-1 rounded-full">
              Updated daily
            </span>
          </div>
        </div>
      )}

      {/* ── WHAT WE DO ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Target size={12} /> What We Do
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
              Six Pillars. One Mission.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              QCI works across six domains to elevate quality standards across India's economy — from hospitals and labs to MSMEs, rural governance, and international trade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_WE_DO.map(item => (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer"
                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden">
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className={`w-11 h-11 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-between gap-2">
                    {item.title}
                    <ExternalLink size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS ── */}
      <section className="py-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Announcements
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Latest from QCI</h2>
            </div>
            <a href="https://www.qcin.org/press-release" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
              View all <ArrowRight size={13} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((item: any) => (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer"
                className={`group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 border-l-4 ${item.color} p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{item.tag}</span>
                  <span className="text-[10px] text-gray-400">{item.date}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE ORGANISATION ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Shield size={12} /> The Organisation
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
              Five National Boards. One Standard.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              QCI operates through five autonomous national boards, each setting international quality benchmarks in a critical sector. Explore careers and official board websites from one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BOARDS.map(board => (
              <div key={board.name}
                className={`group bg-white dark:bg-gray-800 rounded-2xl border ${board.borderColor} shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-default`}>
                <div className={`h-1.5 bg-gradient-to-r ${board.gradient}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${board.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      {board.icon}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${board.badgeBg}`}>{board.tag}</span>
                  </div>
                  <h3 className={`text-2xl font-black mb-1 ${board.textColor}`}>{board.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2 leading-snug">{board.full}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed mb-5">"{board.tagline}"</p>
                  {stats?.byDepartment[board.name] ? (
                    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${board.bgLight} ${board.textColor}`}>
                      <Briefcase size={11} />
                      {stats.byDepartment[board.name]} open role{stats.byDepartment[board.name] !== 1 ? 's' : ''}
                      {stats.openingsByDept[board.name] ? ` · ${stats.openingsByDept[board.name]} openings` : ''}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Link to={`/browse?department=${board.name}`}
                      className={`flex-1 text-center text-sm font-bold py-2.5 rounded-xl bg-gradient-to-r ${board.gradient} text-white hover:opacity-90 active:scale-95 transition-all duration-200`}>
                      View Careers
                    </Link>
                    <a href={board.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <ExternalLink size={13} /> Website
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Browse all card — the whole card is the CTA */}
            <Link to="/browse" className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg shadow-brand-500/20 hover:shadow-2xl hover:shadow-brand-500/30 hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Layers size={24} />
                </div>
                <h3 className="text-2xl font-black mb-2">All Boards</h3>
                <p className="text-white/75 text-sm leading-relaxed mb-4">
                  Browse every open role across all five boards in one unified view — filter by board, division, or role type.
                </p>
                {stats && (
                  <p className="text-white/60 text-xs">
                    {stats.total} active roles · {stats.totalOpenings} total openings
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-1 text-white/70 group-hover:text-white text-sm font-semibold transition-colors">
                Explore all roles <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── OPERATING DIVISIONS ── */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Layers size={12} /> Operating Divisions
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              Four Core Divisions. Where Projects Come to Life.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              Beyond accreditation, QCI's four divisions implement quality improvement programmes across government, industry, and consumers nationwide.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {DIVISIONS.map(div => {
              const openRoles = stats?.byDepartment[div.acronym] ?? 0;
              return (
                <div key={div.acronym}
                  onClick={() => navigate(`/browse?department=${div.acronym}`)}
                  className={`group rounded-2xl border p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-2 ring-transparent ${div.ring} ${div.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{div.icon}</span>
                    {openRoles > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/60 ${div.accent}`}>
                        {openRoles}
                      </span>
                    )}
                  </div>
                  <h3 className={`font-black text-base mb-1 ${div.accent}`}>{div.acronym}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{div.full}</p>
                  <div className={`mt-3 flex items-center gap-1 text-[11px] font-semibold ${div.accent} opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-[-4px] group-hover:translate-x-0`}>
                    View Roles <ChevronRight size={10} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NATION BUILDING FLAGSHIPS (below divisions per layout) ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Sparkles size={12} /> Nation Building Flagships
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
              Beyond the Office. Beyond the Ordinary.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              QCI's initiatives that engage students, villages, and cities in the quality movement — building a quality-first India from the ground up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {initiatives.map((item: any) => (
              <div key={item.title} className="rounded-2xl overflow-hidden shadow-lg group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300">
                <div className={`p-6 h-full flex flex-col bg-gradient-to-br ${item.gradient}`}>
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                  <span className="inline-flex w-fit items-center bg-white/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white mb-3">
                    {item.tag}
                  </span>
                  <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed flex-1 mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {item.badges.map((b: string) => (
                      <span key={b} className="bg-white/20 text-white/90 text-[10px] font-medium px-2.5 py-1 rounded-full">{b}</span>
                    ))}
                  </div>
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200 text-xs w-fit">
                    Learn More <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      {featuredJobs.length > 0 && (
        <section className="py-16 px-4 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-2">Latest Openings</p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Featured Opportunities</h2>
              </div>
              <span className="hidden sm:block text-sm text-gray-400 dark:text-gray-500">
                {featuredJobs.length} featured {featuredJobs.length === 1 ? 'role' : 'roles'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── EVENTS & COVERAGES ── */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                📅 Events &amp; Coverages
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Upcoming &amp; Recent Events</h2>
            </div>
            <a href="https://www.qcin.org/events" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
              All Events <ArrowRight size={13} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {events.map((ev: any) => (
              <div key={ev.title} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="bg-gradient-to-br from-brand-700 to-brand-500 p-4 flex items-start justify-between">
                  <div>
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{ev.type}</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-white text-2xl font-black">{ev.month}</span>
                      <span className="text-white/70 text-sm">{ev.year}</span>
                    </div>
                  </div>
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{ev.emoji}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">{ev.title}</h3>
                  <p className="text-[11px] text-brand-500 font-semibold mb-2">📍 {ev.location}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{ev.desc}</p>
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
              { icon: <Award size={22} className="text-brand-500" />, title: 'National Impact', desc: "Your work directly influences quality standards across India's hospitals, labs, and educational institutions.", link: '/about', cta: 'Our Mission' },
              { icon: <TrendingUp size={22} className="text-emerald-500" />, title: 'Clear Career Growth', desc: 'Structured 4-level career ladder — from Coordinator to Project Manager with defined salary bands.', link: '/careers', cta: 'Explore Career Paths' },
              { icon: <BookMarked size={22} className="text-purple-500" />, title: 'Domain Expertise', desc: 'Become a certified quality expert in NABH, NABET, or NABL — credentials respected across industry and government.', link: '/careers', cta: 'View Specialisations' },
              { icon: <Users size={22} className="text-orange-500" />, title: 'Collaborative Culture', desc: 'Work with multi-disciplinary teams of healthcare professionals, educators, and scientists on nationwide quality missions.', link: '/about', cta: 'About QCI' },
            ].map(item => (
              <div key={item.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex gap-4 cursor-pointer group"
                onClick={() => navigate(item.link)}>
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 dark:text-brand-300 group-hover:gap-2 transition-all duration-200">
                    {item.cta} <ArrowRight size={11} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-20 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #012249 0%, #01417C 50%, #3791E5 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Join India's Quality Movement</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{settings.home_cta_title}</h2>
          <p className="text-white/70 text-lg mb-9 leading-relaxed">{settings.home_cta_subtitle}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/browse"
              className="bg-white text-brand-800 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 active:scale-95 transition-all duration-200 inline-flex items-center gap-2 shadow-xl">
              Browse Open Roles <ArrowRight size={16} />
            </Link>
            <Link to="/resume-match"
              className="bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-200 active:scale-95">
              Match My Resume
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
