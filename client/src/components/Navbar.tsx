import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { useLang, LANGUAGES, LangCode } from '../context/LanguageContext';
import {
  ChevronDown, Menu, X, Sun, Moon, LogOut, LayoutDashboard,
  ShieldCheck, ExternalLink, Briefcase, TrendingUp, FileText,
  PlusCircle, Phone, Globe, Newspaper, Download, Scale,
  MapPin, Mail, MessageSquare, Languages,
} from 'lucide-react';

const BOARDS = [
  { name: 'NABH',  full: 'National Accreditation Board for Hospitals & Healthcare Providers', tagline: 'Elevating Quality in Healthcare', color: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500', jobs: '/browse?department=NABH',  website: 'https://www.nabh.co/' },
  { name: 'NABL',  full: 'National Accreditation Board for Testing & Calibration Laboratories', tagline: 'Ensuring Safety, Accuracy & Trust', color: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', jobs: '/browse?department=NABL',  website: 'https://www.nabl-india.org/' },
  { name: 'NABCB', full: 'National Accreditation Board for Certification Bodies', tagline: 'Accredited Once, Accepted Everywhere', color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500',   jobs: '/browse?department=NABCB', website: 'https://nabcb.qcin.org/' },
  { name: 'NABET', full: 'National Accreditation Board for Education and Training', tagline: 'Striving for Quality in Education & Environment', color: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', jobs: '/browse?department=NABET', website: 'https://www.nabet.org.in/' },
  { name: 'NBQP',  full: 'National Board for Quality Promotion', tagline: 'Harnessing Collaboration for Quality', color: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', jobs: '/browse?department=NBQP', website: 'https://qcin.org/nbqp' },
];

const ABOUT_LINKS = [
  { to: '/about',             label: 'About QCI',    desc: 'Our mission, vision & 27-year journey' },
  { to: '/about#leadership',  label: 'Leadership',   desc: 'Chairperson, Secretary General & more' },
  { to: '/about#boards',      label: 'Our Boards',   desc: 'NABH, NABL, NABCB, NABET, NBQP' },
];

function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function NavDropdown({ label, children, isOpen, onToggle }: {
  label: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null!);
  useClickOutside(ref, () => isOpen && onToggle());
  return (
    <div ref={ref} className="relative">
      <button onClick={onToggle}
        className={`flex items-center gap-1 text-sm font-medium transition-colors px-1 py-1 rounded
          ${isOpen ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400'}`}>
        {label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { dark, toggleDark } = useTheme();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null!);
  const langRef = useRef<HTMLDivElement>(null!);

  useClickOutside(userMenuRef, () => setUserMenuOpen(false));
  useClickOutside(langRef, () => setLangOpen(false));

  useEffect(() => { setMobileOpen(false); setOpenDropdown(null); }, [location.pathname]);

  const toggle = (name: string) => setOpenDropdown(prev => prev === name ? null : name);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === lang)!;

  return (
    <>
      {/* ── Top utility bar ── */}
      <div className="bg-brand-700 dark:bg-brand-900 text-white/90 text-xs hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <span className="font-medium tracking-wide">
            1QCI Portal &nbsp;·&nbsp; One Destination for Quality India
          </span>
          <div className="flex items-center gap-5">
            <a href="tel:01126186680" className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone size={11} /> 011-26186680
            </a>
            <a href="mailto:info@qcin.org" className="hover:text-white transition-colors">info@qcin.org</a>
            <a href="https://www.qcin.org" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors">
              <Globe size={11} /> qcin.org
            </a>
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img
                src="https://nbqp.qci.org.in/wp-content/uploads/2023/06/qci-logo-updated.png"
                alt="QCI Logo"
                className="h-10 w-auto object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="leading-tight">
                <p className="text-gray-900 dark:text-white font-extrabold text-sm tracking-tight">
                  Quality Council <span className="text-brand-500">of India</span>
                </p>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-widest">
                  1QCI Portal
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">

              {/* Who We Are */}
              <NavDropdown label={t.nav_who_we_are} isOpen={openDropdown === 'about'} onToggle={() => toggle('about')}>
                <div className="w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 overflow-hidden">
                  {ABOUT_LINKS.map(link => (
                    <Link key={link.to} to={link.to}
                      onClick={() => setOpenDropdown(null)}
                      className="flex flex-col px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{link.label}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{link.desc}</span>
                    </Link>
                  ))}
                  <div className="mx-4 my-2 border-t border-gray-100 dark:border-gray-700" />
                  <a href="https://www.qcin.org" target="_blank" rel="noopener noreferrer"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-500 dark:text-gray-400">
                    <ExternalLink size={13} /> Visit qcin.org
                  </a>
                </div>
              </NavDropdown>

              {/* Our Boards — mega dropdown (no "Browse All" footer) */}
              <NavDropdown label={t.nav_our_boards} isOpen={openDropdown === 'boards'} onToggle={() => toggle('boards')}>
                <div className="w-[660px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                    Five National Accreditation Boards
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {BOARDS.map(board => (
                      <div key={board.name}
                        className="rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${board.dot}`} />
                          <span className={`font-black text-base ${board.color}`}>{board.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mb-2">{board.tagline}</p>
                        <div className="flex gap-2">
                          <Link to={board.jobs} onClick={() => setOpenDropdown(null)}
                            className={`text-[11px] font-semibold ${board.color} hover:underline`}>
                            View Jobs →
                          </Link>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <a href={board.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            Website <ExternalLink size={10} className="ml-0.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </NavDropdown>

              {/* Careers */}
              <NavDropdown label={t.nav_careers} isOpen={openDropdown === 'careers'} onToggle={() => toggle('careers')}>
                <div className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 overflow-hidden">
                  {[
                    { to: '/browse',       icon: <Briefcase size={16} />,  label: t.browse_all_jobs,  desc: 'Explore every open role across all boards' },
                    { to: '/careers',      icon: <TrendingUp size={16} />, label: t.career_paths,     desc: 'Coordinator to Manager — mapped out' },
                    { to: '/resume-match', icon: <FileText size={16} />,   label: t.resume_matcher,   desc: 'See which QCI roles match your profile' },
                  ].map(link => (
                    <Link key={link.to} to={link.to}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-brand-100">
                        {link.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{link.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
                      </div>
                    </Link>
                  ))}
                  {user?.role === 'employer' && (
                    <>
                      <div className="mx-4 my-1 border-t border-gray-100 dark:border-gray-700" />
                      <Link to="/post-job" onClick={() => setOpenDropdown(null)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <PlusCircle size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-emerald-600">Post a Job</p>
                          <p className="text-xs text-gray-400 mt-0.5">Create a new listing for your department</p>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              </NavDropdown>

              {/* Media */}
              <NavDropdown label={t.nav_media} isOpen={openDropdown === 'media'} onToggle={() => toggle('media')}>
                <div className="w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2">
                  {[
                    { href: 'https://www.qcin.org/press-releases', icon: <Newspaper size={14} />,   label: t.media_press,        color: 'text-blue-500' },
                    { href: 'https://www.qcin.org/publications',   icon: <FileText size={14} />,    label: t.media_publications, color: 'text-indigo-500' },
                    { href: 'https://www.qcin.org/annual-reports', icon: <Download size={14} />,    label: t.media_reports,      color: 'text-orange-500' },
                    { href: 'https://www.qcin.org/gallery',        icon: <Globe size={14} />,       label: t.media_gallery,      color: 'text-teal-500' },
                    { href: 'https://www.youtube.com/@qualitycouncilofindia', icon: <Globe size={14} />, label: t.media_videos, color: 'text-red-500' },
                    { href: 'https://www.qcin.org/newsletter',     icon: <Mail size={14} />,        label: t.media_newsletter,   color: 'text-emerald-500' },
                  ].map(item => (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                      <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 font-medium">{item.label}</span>
                      <ExternalLink size={10} className="ml-auto text-gray-300 group-hover:text-gray-500" />
                    </a>
                  ))}
                </div>
              </NavDropdown>

              {/* Governance */}
              <NavDropdown label={t.nav_governance} isOpen={openDropdown === 'governance'} onToggle={() => toggle('governance')}>
                <div className="w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2">
                  {[
                    { href: 'https://www.qcin.org/rti',             icon: <Scale size={14} />,    label: t.gov_rti,            color: 'text-blue-600' },
                    { href: 'https://www.qcin.org/annual-reports',  icon: <Download size={14} />, label: t.gov_annual_reports, color: 'text-orange-500' },
                    { href: 'https://www.qcin.org/audit-reports',   icon: <FileText size={14} />, label: t.gov_audit,          color: 'text-red-500' },
                    { href: 'https://www.qcin.org/ethics',          icon: <ShieldCheck size={14} />, label: t.gov_ethics,      color: 'text-emerald-600' },
                    { href: 'https://www.qcin.org/policies',        icon: <FileText size={14} />, label: t.gov_policies,       color: 'text-indigo-500' },
                    { href: 'https://www.qcin.org/compliance',      icon: <Scale size={14} />,    label: t.gov_compliance,     color: 'text-teal-600' },
                  ].map(item => (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                      <span className={`${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 font-medium">{item.label}</span>
                      <ExternalLink size={10} className="ml-auto text-gray-300 group-hover:text-gray-500" />
                    </a>
                  ))}
                </div>
              </NavDropdown>

              {/* Connect With Us */}
              <NavDropdown label={t.nav_connect} isOpen={openDropdown === 'connect'} onToggle={() => toggle('connect')}>
                <div className="w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2">
                  {[
                    { icon: <MapPin size={14} />,      label: t.contact_offices, desc: settings.contact_address || 'New Delhi HQ & Regional Offices', color: 'text-red-500' },
                    { icon: <Mail size={14} />,         label: t.contact_email,   desc: settings.contact_email_general || 'info@qcin.org',             color: 'text-blue-500' },
                    { icon: <Phone size={14} />,        label: t.contact_phone,   desc: settings.contact_phone || '011-26186680',                      color: 'text-green-500' },
                    { icon: <MessageSquare size={14} />, label: t.contact_feedback, desc: 'Share your experience or suggestions',                      color: 'text-violet-500' },
                  ].map(item => (
                    <div key={item.label}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-default">
                      <span className={`mt-0.5 flex-shrink-0 ${item.color}`}>{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mx-4 my-2 border-t border-gray-100 dark:border-gray-700" />
                  <div className="px-4 py-2 flex items-center gap-3">
                    {[
                      { href: settings.footer_linkedin || 'https://www.linkedin.com/company/quality-council-of-india/', label: 'LinkedIn', color: 'bg-blue-600' },
                      { href: settings.footer_twitter  || 'https://twitter.com/qci_india', label: 'Twitter', color: 'bg-sky-500' },
                      { href: settings.footer_instagram || 'https://www.instagram.com/qualitycouncilofindia/', label: 'Instagram', color: 'bg-pink-600' },
                      { href: settings.footer_facebook  || 'https://www.facebook.com/QualityCouncilOfIndia/', label: 'Facebook', color: 'bg-blue-700' },
                    ].map(s => (
                      <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
                        className={`${s.color} text-white text-[10px] font-bold px-2 py-1 rounded hover:opacity-90 transition-opacity`}>
                        {s.label[0]}
                      </a>
                    ))}
                  </div>
                </div>
              </NavDropdown>

              {/* HR Panel */}
              {user?.role === 'hr' && (
                <Link to="/admin"
                  className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 px-1 py-1 transition-colors">
                  <ShieldCheck size={15} /> HR Panel
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-1">

              {/* Language selector */}
              <div className="relative" ref={langRef}>
                <button onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-semibold">
                  <Languages size={15} />
                  <span>{currentLang.native}</span>
                  <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                    {LANGUAGES.map(l => (
                      <button key={l.code}
                        onClick={() => { setLang(l.code as LangCode); setLangOpen(false); }}
                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors
                          ${lang === l.code
                            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}>
                        <span>{l.flag}</span>
                        <span>{l.native}</span>
                        {lang === l.code && <span className="ml-auto text-brand-500 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleDark}
                title={dark ? 'Light mode' : 'Dark mode'}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {dark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full pl-1 pr-3 py-1 transition-colors">
                    <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name.split(' ')[0]}</span>
                    <ChevronDown size={13} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">{user.role.replace('_', ' ')}</p>
                      </div>
                      {user.role === 'hr' ? (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                          <ShieldCheck size={15} /> HR Admin Panel
                        </Link>
                      ) : (
                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <LayoutDashboard size={15} /> {t.nav_dashboard}
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut size={15} /> {t.nav_sign_out}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {t.nav_sign_in}
                  </Link>
                  <Link to="/register"
                    className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-brand-500/20">
                    {t.nav_get_started}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              <MobileSection label={t.nav_who_we_are} isOpen={mobileSection === 'about'} onToggle={() => setMobileSection(s => s === 'about' ? null : 'about')}>
                {ABOUT_LINKS.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{l.label}</Link>
                ))}
              </MobileSection>

              <MobileSection label={t.nav_our_boards} isOpen={mobileSection === 'boards'} onToggle={() => setMobileSection(s => s === 'boards' ? null : 'boards')}>
                {BOARDS.map(b => (
                  <Link key={b.name} to={b.jobs} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                    <span className="font-semibold">{b.name}</span>
                  </Link>
                ))}
              </MobileSection>

              <MobileSection label={t.nav_careers} isOpen={mobileSection === 'careers'} onToggle={() => setMobileSection(s => s === 'careers' ? null : 'careers')}>
                <Link to="/browse" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.browse_all_jobs}</Link>
                <Link to="/careers" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.career_paths}</Link>
                <Link to="/resume-match" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.resume_matcher}</Link>
              </MobileSection>

              <MobileSection label={t.nav_media} isOpen={mobileSection === 'media'} onToggle={() => setMobileSection(s => s === 'media' ? null : 'media')}>
                <a href="https://www.qcin.org/press-releases" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.media_press}</a>
                <a href="https://www.qcin.org/publications" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.media_publications}</a>
                <a href="https://www.qcin.org/annual-reports" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.media_reports}</a>
              </MobileSection>

              <MobileSection label={t.nav_governance} isOpen={mobileSection === 'governance'} onToggle={() => setMobileSection(s => s === 'governance' ? null : 'governance')}>
                <a href="https://www.qcin.org/rti" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.gov_rti}</a>
                <a href="https://www.qcin.org/annual-reports" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.gov_annual_reports}</a>
                <a href="https://www.qcin.org/policies" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{t.gov_policies}</a>
              </MobileSection>

              <MobileSection label={t.nav_connect} isOpen={mobileSection === 'connect'} onToggle={() => setMobileSection(s => s === 'connect' ? null : 'connect')}>
                <div className="px-4 py-2 text-xs text-gray-500">{settings.contact_address || 'J 200, World Trade Centre, New Delhi'}</div>
                <a href={`mailto:${settings.contact_email_general || 'info@qcin.org'}`} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{settings.contact_email_general || 'info@qcin.org'}</a>
                <a href={`tel:${settings.contact_phone?.replace(/\s/g,'') || '01126186680'}`} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">{settings.contact_phone || '011-26186680'}</a>
              </MobileSection>

              {user?.role === 'hr' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                  <ShieldCheck size={15} /> HR Admin Panel
                </Link>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3 space-y-1">
                {/* Language selector mobile */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <Languages size={15} className="text-gray-400" />
                  <span className="text-xs text-gray-500 font-semibold">Language:</span>
                  {LANGUAGES.map(l => (
                    <button key={l.code}
                      onClick={() => setLang(l.code as LangCode)}
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors
                        ${lang === l.code ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                      {l.native}
                    </button>
                  ))}
                </div>

                <button onClick={toggleDark}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                  {dark ? 'Light Mode' : 'Dark Mode'}
                </button>

                {user ? (
                  <>
                    {user.role !== 'hr' && (
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <LayoutDashboard size={15} /> {t.nav_dashboard}
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <LogOut size={15} /> {t.nav_sign_out}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-3 pt-1">
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300">
                      {t.nav_sign_in}
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl">
                      {t.nav_get_started}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function MobileSection({ label, isOpen, onToggle, children }: {
  label: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={onToggle}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm font-semibold rounded-lg transition-colors
          ${isOpen ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
        {label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-brand-100 dark:border-brand-800 pl-2">
          {children}
        </div>
      )}
    </div>
  );
}
