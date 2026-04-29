import { Link } from 'react-router-dom';
import {
  Briefcase, MapPin, Mail, Clock, Users,
  Linkedin, Twitter, Instagram, Facebook,
  Moon, Sun, ChevronRight,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const BOARDS = [
  { name: 'NABCB', full: 'National Accreditation Board for Certification Bodies',      color: 'bg-blue-500/10 text-blue-400   border-blue-500/20' },
  { name: 'NABET', full: 'National Accreditation Board for Education and Training',     color: 'bg-brand-500/10 text-brand-400 border-brand-500/20' },
  { name: 'NABL',  full: 'National Accreditation Board for Testing & Calibration Labs', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { name: 'NABH',  full: 'National Accreditation Board for Hospitals & Healthcare',     color: 'bg-teal-500/10 text-teal-400   border-teal-500/20' },
  { name: 'NBQP',  full: 'National Board for Quality Promotion',                        color: 'bg-rose-500/10 text-rose-400   border-rose-500/20' },
];

const QUICK_LINKS = [
  { to: '/browse',       label: 'Browse Jobs' },
  { to: '/careers',      label: 'Career Paths' },
  { to: '/about',        label: 'About QCI' },
  { to: '/resume-match', label: 'Resume Matcher' },
  { to: '/register',     label: 'Create Account' },
  { to: '/login',        label: 'Sign In' },
];

const CONTACT_CARDS = [
  {
    icon: <MapPin size={18} />,
    bg: 'bg-brand-500/10',
    accent: 'text-brand-400',
    label: 'Our Office',
    lines: ['QCI World Trade Centre', 'J 200, Block J, Nauroji Nagar', 'New Delhi – 110029'],
  },
  {
    icon: <Clock size={18} />,
    bg: 'bg-emerald-500/10',
    accent: 'text-emerald-400',
    label: 'Working Hours',
    lines: ['Monday – Friday', '9:00 am – 5:30 pm'],
  },
  {
    icon: <Mail size={18} />,
    bg: 'bg-sky-500/10',
    accent: 'text-sky-400',
    label: 'General Enquiry',
    lines: ['info@qcin.org', '011-26186680 to 83'],
  },
  {
    icon: <Users size={18} />,
    bg: 'bg-violet-500/10',
    accent: 'text-violet-400',
    label: 'HR & Careers',
    lines: ['hrcareers@qcin.org', 'media@qcin.org'],
  },
];

export default function Footer({ isHome = false }: { isHome?: boolean }) {
  const { settings } = useSettings();
  const { dark, toggleDark } = useTheme();

  const socials = [
    { key: 'linkedin',  icon: <Linkedin size={15} />,  label: 'LinkedIn',  bg: 'hover:bg-blue-600',  href: settings.footer_linkedin  || '#' },
    { key: 'twitter',   icon: <Twitter size={15} />,   label: 'Twitter',   bg: 'hover:bg-sky-500',   href: settings.footer_twitter   || '#' },
    { key: 'instagram', icon: <Instagram size={15} />, label: 'Instagram', bg: 'hover:bg-pink-600',  href: settings.footer_instagram || '#' },
    { key: 'facebook',  icon: <Facebook size={15} />,  label: 'Facebook',  bg: 'hover:bg-blue-700',  href: settings.footer_facebook  || '#' },
  ];

  /* ── Slim home footer ─────────────────────────────────────────── */
  if (isHome) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Quality Council of India</span>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/browse" className="hover:text-white transition-colors">Browse Jobs</Link>
            <Link to="/about"  className="hover:text-white transition-colors">About QCI</Link>
            <a href="#"        className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/register"
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Full footer ──────────────────────────────────────────────── */
  return (
    <footer className="bg-[#0a1628] text-gray-300 relative overflow-hidden">

      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* ── Main grid ── */}
      <div className="relative max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">

          {/* Brand — 4 cols */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/40">
                <Briefcase size={22} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-white font-extrabold text-base tracking-tight">Quality Council</p>
                <p className="text-brand-400 text-sm font-medium">of India — Careers</p>
              </div>
            </Link>

            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-sm">
              {settings.footer_about}
            </p>

            {/* Socials */}
            <div className="flex gap-2 mb-8">
              {socials.map(s => (
                <a key={s.key} href={s.href}
                  target={s.href !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  title={s.label}
                  className={`w-9 h-9 bg-white/5 border border-white/10 ${s.bg} rounded-xl flex items-center justify-center transition-all hover:border-transparent hover:scale-105`}>
                  {s.icon}
                </a>
              ))}
            </div>

          </div>

          {/* Quick Links — 2 cols */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-brand-500 rounded-full"></span>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={13} className="text-brand-500 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Boards — 6 cols */}
          <div className="lg:col-span-6">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-brand-500 rounded-full"></span>
              Our Boards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOARDS.map(b => (
                <Link key={b.name} to={`/browse?department=${b.name}`}
                  className={`group flex items-start gap-3 p-3 rounded-xl border ${b.color} bg-opacity-10 hover:bg-opacity-20 transition-all`}>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md border ${b.color} flex-shrink-0 mt-0.5`}>
                    {b.name}
                  </span>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 leading-snug transition-colors">{b.full}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact cards ── */}
      <div className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACT_CARDS.map(c => (
              <div key={c.label}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 ${c.accent}`}>
                  {c.icon}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${c.accent}`}>{c.label}</p>
                  {c.lines.map((line, i) => (
                    <p key={i} className="text-xs text-gray-400 leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} <span className="text-gray-400">Quality Council of India.</span> All rights reserved.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-gray-600">{settings.site_tagline}</span>
            <span className="text-gray-700">·</span>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Use</a>
            <Link to="/about" className="hover:text-gray-300 transition-colors">About QCI</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
