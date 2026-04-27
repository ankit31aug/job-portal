import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, Briefcase, Users, Award, BookOpen, FlaskConical, TrendingUp, Star, CheckCircle } from 'lucide-react';
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

const WHY_ITEMS = [
  { icon: <Award size={22} className="text-blue-500" />, title: 'National Impact', desc: 'Your work directly influences quality standards across India\'s hospitals, labs, and educational institutions.' },
  { icon: <TrendingUp size={22} className="text-emerald-500" />, title: 'Clear Career Growth', desc: 'Structured 4-level career ladder in every department — from Coordinator to Project Manager with defined salary bands.' },
  { icon: <BookOpen size={22} className="text-purple-500" />, title: 'Domain Expertise', desc: 'Become a certified quality expert in NABH, NABET, or NABL — credentials respected across industry and government.' },
  { icon: <Users size={22} className="text-orange-500" />, title: 'Collaborative Culture', desc: 'Work with multi-disciplinary teams of healthcare professionals, educators, and scientists on nation-wide quality missions.' },
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
    <div className="bg-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden text-white py-20 px-4"
        style={{ background: `linear-gradient(135deg, ${settings.hero_gradient_from} 0%, ${settings.hero_gradient_to} 100%)` }}>
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
              className="bg-white text-blue-700 font-bold px-7 py-3.5 rounded-2xl shadow-xl hover:bg-blue-50 transition-colors text-sm">
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
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Active Roles', value: stats?.total ?? 0, icon: <Briefcase size={20} className="text-blue-500" /> },
            { label: 'Total Openings', value: stats?.totalOpenings ?? 0, icon: <Users size={20} className="text-emerald-500" /> },
            { label: 'Departments', value: 3, icon: <Award size={20} className="text-purple-500" /> },
            { label: 'Career Levels', value: 4, icon: <TrendingUp size={20} className="text-orange-500" /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              {s.icon}
              <p className="text-3xl font-black text-gray-900"><AnimatedCounter target={s.value} /></p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Where You'll Work</p>
            <h2 className="text-3xl font-black text-gray-900 mb-3">Three Boards. One Mission.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">QCI operates through three national accreditation boards, each shaping quality standards in a critical sector of India.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['NABH', 'NABET', 'NABL'] as const).map(dept => (
              <DepartmentCard key={dept} dept={dept}
                openRoles={stats?.byDepartment[dept] ?? 0}
                openings={stats?.openingsByDept[dept] ?? 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED JOBS ── */}
      {featuredJobs.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-1">Latest Openings</p>
                <h2 className="text-2xl font-black text-gray-900">Highlighted Opportunities</h2>
              </div>
              <Link to="/browse" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                View all jobs <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
            <div className="text-center mt-8">
              <Link to="/browse"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors">
                Browse All Jobs <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── WHY QCI ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-2">Why Choose QCI</p>
            <h2 className="text-3xl font-black text-gray-900 mb-3">A Career That Means Something</h2>
            <p className="text-gray-500 max-w-xl mx-auto">More than a job — a mandate to improve quality standards across India's most important sectors.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_ITEMS.map(item => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
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
