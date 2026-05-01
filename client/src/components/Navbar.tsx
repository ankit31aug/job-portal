import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import {
  ChevronDown, Menu, X, Sun, Moon, LogOut, LayoutDashboard,
  ShieldCheck, ExternalLink, Briefcase, TrendingUp, FileText,
  PlusCircle, Users, Globe, Phone, Crown,
} from 'lucide-react';

const BOARDS = [
  {
    name: 'NABH',
    full: 'National Accreditation Board for Hospitals & Healthcare Providers',
    tagline: 'Elevating Quality in Healthcare Across Nation',
    color: 'text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500',
    jobs: '/browse?department=NABH',
    website: 'https://www.nabh.co/',
  },
  {
    name: 'NABL',
    full: 'National Accreditation Board for Testing & Calibration Laboratories',
    tagline: 'Ensuring Safety, Accuracy & Trust Nationwide',
    color: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    jobs: '/browse?department=NABL',
    website: 'https://www.nabl-india.org/',
  },
  {
    name: 'NABCB',
    full: 'National Accreditation Board for Certification Bodies',
    tagline: 'Accredited Once, Accepted Everywhere',
    color: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
    jobs: '/browse?department=NABCB',
    website: 'https://nabcb.qcin.org/',
  },
  {
    name: 'NABET',
    full: 'National Accreditation Board for Education and Training',
    tagline: 'Striving for Quality in Education & Environment',
    color: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    jobs: '/browse?department=NABET',
    website: 'https://www.nabet.org.in/',
  },
  {
    name: 'NBQP',
    full: 'National Board for Quality Promotion',
    tagline: 'Harnessing the Power of Collaboration for Quality',
    color: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    jobs: '/browse?department=NBQP',
    website: 'https://qcin.org/nbqp',
  },
];

const CAREERS_LINKS = [
  { to: '/browse',       icon: <Briefcase size={16} />,   label: 'Browse All Jobs',      desc: 'Explore every open role across all boards' },
  { to: '/careers',      icon: <TrendingUp size={16} />,  label: 'Career Paths',         desc: 'Coordinator to Manager — mapped out' },
  { to: '/resume-match', icon: <FileText size={16} />,    label: 'Resume Matcher',       desc: 'See which QCI roles match your profile' },
];

const ABOUT_LINKS = [
  { to: '/about',   label: 'About QCI',       desc: 'Our mission, vision & 27-year journey' },
  { to: '/about#leadership', label: 'Leadership', desc: 'Chairman, Secretary General & more' },
  { to: '/about#boards',     label: 'Our Boards',   desc: 'NABH, NABL, NABCB, NABET, NBQP' },
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

function NavDropdown({
  label, children, isOpen, onToggle,
}: { label: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLDivElement>(null!);
  useClickOutside(ref, () => isOpen && onToggle());
  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 text-sm font-medium transition-colors px-1 py-1 rounded
          ${isOpen ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400'}`}
      >
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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null!);

  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setOpenDropdown(null); }, [location.pathname]);

  const toggle = (name: string) => setOpenDropdown(prev => prev === name ? null : name);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20">
                <Briefcase size={20} className="text-white" />
              </div>
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
            <div className="hidden lg:flex items-center gap-1">

              {/* Who We Are */}
              <NavDropdown label="Who We Are" isOpen={openDropdown === 'about'} onToggle={() => toggle('about')}>
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

              {/* Our Boards — mega dropdown */}
              <NavDropdown label="Our Boards" isOpen={openDropdown === 'boards'} onToggle={() => toggle('boards')}>
                <div className="w-[680px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-5">
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
                          <Link to={board.jobs}
                            onClick={() => setOpenDropdown(null)}
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
                    {/* Last item spans full width */}
                    <div className="col-span-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-700 dark:text-brand-300">Browse All Board Careers</p>
                        <p className="text-xs text-brand-500/70 dark:text-brand-400/70">See every open role across all 5 boards</p>
                      </div>
                      <Link to="/browse" onClick={() => setOpenDropdown(null)}
                        className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                        Browse All →
                      </Link>
                    </div>
                  </div>
                </div>
              </NavDropdown>

              {/* Careers */}
              <NavDropdown label="Careers" isOpen={openDropdown === 'careers'} onToggle={() => toggle('careers')}>
                <div className="w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 overflow-hidden">
                  {CAREERS_LINKS.map(link => (
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
                      <Link to="/post-job"
                        onClick={() => setOpenDropdown(null)}
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

              {/* HR Panel (HR role only) */}
              {user?.role === 'hr' && (
                <Link to="/admin"
                  className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 px-1 py-1 transition-colors">
                  <ShieldCheck size={15} /> HR Panel
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-2">
              <button onClick={toggleDark}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
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
                          <LayoutDashboard size={15} /> Dashboard
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register"
                    className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-brand-500/20">
                    Get Started
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

              {/* Who We Are */}
              <MobileSection
                label="Who We Are"
                isOpen={mobileSection === 'about'}
                onToggle={() => setMobileSection(s => s === 'about' ? null : 'about')}>
                {ABOUT_LINKS.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    {l.label}
                  </Link>
                ))}
              </MobileSection>

              {/* Our Boards */}
              <MobileSection
                label="Our Boards"
                isOpen={mobileSection === 'boards'}
                onToggle={() => setMobileSection(s => s === 'boards' ? null : 'boards')}>
                {BOARDS.map(b => (
                  <Link key={b.name} to={b.jobs} onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                    <span className="font-semibold">{b.name}</span>
                    <span className="text-xs text-gray-400 truncate">— {b.tagline}</span>
                  </Link>
                ))}
              </MobileSection>

              {/* Careers */}
              <MobileSection
                label="Careers"
                isOpen={mobileSection === 'careers'}
                onToggle={() => setMobileSection(s => s === 'careers' ? null : 'careers')}>
                {CAREERS_LINKS.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                    {l.label}
                  </Link>
                ))}
                {user?.role === 'employer' && (
                  <Link to="/post-job" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2 text-sm text-emerald-600 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                    + Post a Job
                  </Link>
                )}
              </MobileSection>

              {/* HR Panel */}
              {user?.role === 'hr' && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                  <ShieldCheck size={15} /> HR Admin Panel
                </Link>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
                {/* Dark mode toggle */}
                <button onClick={toggleDark}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                  {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>

                {user ? (
                  <>
                    {user.role !== 'hr' && (
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-3 pt-1">
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl">
                      Get Started
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
