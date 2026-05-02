import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Mail, Phone,
  Linkedin, Twitter, Instagram, Facebook, Youtube,
  Moon, Sun, ExternalLink,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_COL_WHO = [
  { label: 'About QCI', to: '/about' },
  { label: 'Leadership', to: '/about#leadership' },
  { label: 'Our Boards', to: '/about#boards' },
  { label: 'Vision & Mission', href: 'https://www.qcin.org/who-we-are/vision-mission' },
  { label: 'Quality Movement', href: 'https://www.qcin.org/who-we-are/quality-movement-in-india' },
];

const DEFAULT_COL_ORG = [
  { label: 'NABH', href: 'https://www.nabh.co/', desc: 'Healthcare' },
  { label: 'NABL', href: 'https://www.nabl-india.org/', desc: 'Laboratories' },
  { label: 'NABCB', href: 'https://nabcb.qcin.org/', desc: 'Certification' },
  { label: 'NABET', href: 'https://www.nabet.org.in/', desc: 'Education' },
  { label: 'NBQP', href: 'https://qcin.org/nbqp', desc: 'Quality Promotion' },
];

const DEFAULT_COL_WORK = [
  { label: 'Browse All Jobs', to: '/browse' },
  { label: 'Career Paths', to: '/careers' },
  { label: 'Resume Matcher', to: '/resume-match' },
  { label: 'Create Account', to: '/register' },
  { label: 'ZED Certification', href: 'https://zed.org.in/' },
  { label: 'Gunvatta Gurukul', href: 'https://gunvattagurukul.qcin.org/' },
];

const DEFAULT_COL_GOV = [
  { label: 'Annual Reports', href: 'https://www.qcin.org/governance-and-compliance/annual-reports' },
  { label: 'MoU & Agreements', href: 'https://www.qcin.org/governance-and-compliance' },
  { label: 'RTI', href: 'https://www.qcin.org/governance-and-compliance/rti' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
];

const DEFAULT_REGIONAL = [
  { city: 'Delhi HQ', addr: 'J 200, Block J, Nauroji Nagar, World Trade Centre, New Delhi – 110029', phone: '011-26186680 to 83' },
  { city: 'Ahmedabad', addr: 'B-302, Safal Profitaire, Corporate Road, Prahlad Nagar, Ahmedabad – 380015', phone: '079-29701600' },
  { city: 'Bengaluru', addr: '111, 4th Cross, Sadashivanagar, Bengaluru – 560080', phone: '080-23617591' },
  { city: 'Kolkata', addr: 'GN-38/2, Sector V, Salt Lake City, Kolkata – 700091', phone: '033-40630021' },
];

function tryParseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
      <span className="w-4 h-0.5 bg-brand-400 rounded-full" />
      {children}
    </h3>
  );
}

function FooterLink({ to, href, children }: { to?: string; href?: string; children: React.ReactNode }) {
  const cls = 'text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1';
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children} <ExternalLink size={10} className="opacity-50" />
    </a>
  );
}

export default function Footer({ isHome = false }: { isHome?: boolean }) {
  const { settings } = useSettings();
  const { dark, toggleDark } = useTheme();

  const socials = [
    { icon: <Linkedin size={15} />,  label: 'LinkedIn',  hover: 'hover:bg-blue-600',  href: settings.footer_linkedin  || 'https://www.linkedin.com/company/quality-council-of-india/' },
    { icon: <Twitter size={15} />,   label: 'Twitter',   hover: 'hover:bg-sky-500',   href: settings.footer_twitter   || 'https://twitter.com/qci_india' },
    { icon: <Instagram size={15} />, label: 'Instagram', hover: 'hover:bg-pink-600',  href: settings.footer_instagram || 'https://www.instagram.com/qualitycouncilofindia/' },
    { icon: <Facebook size={15} />,  label: 'Facebook',  hover: 'hover:bg-blue-700',  href: settings.footer_facebook  || 'https://www.facebook.com/QualityCouncilOfIndia/' },
    { icon: <Youtube size={15} />,   label: 'YouTube',   hover: 'hover:bg-red-600',   href: settings.footer_youtube   || 'https://www.youtube.com/@qualitycouncilofindia' },
  ];

  const colWho     = tryParseJson<typeof DEFAULT_COL_WHO>(settings.footer_links_who,   DEFAULT_COL_WHO);
  const colOrg     = tryParseJson<typeof DEFAULT_COL_ORG>(settings.footer_links_org,   DEFAULT_COL_ORG);
  const colWork    = tryParseJson<typeof DEFAULT_COL_WORK>(settings.footer_links_work, DEFAULT_COL_WORK);
  const colGov     = tryParseJson<typeof DEFAULT_COL_GOV>(settings.footer_links_gov,   DEFAULT_COL_GOV);
  const regional   = tryParseJson<typeof DEFAULT_REGIONAL>(settings.footer_regional_offices, DEFAULT_REGIONAL);
  const copyright  = settings.footer_copyright || 'Quality Council of India. All rights reserved.';
  const tagline    = settings.footer_tagline   || 'Creating an Ecosystem for Quality';

  /* ── Slim home footer ─────────────────────────────────────────── */
  if (isHome) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} Quality Council of India</span>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/browse" className="hover:text-gray-900 dark:hover:text-white transition-colors">Browse Jobs</Link>
            <Link to="/about"  className="hover:text-gray-900 dark:hover:text-white transition-colors">About QCI</Link>
            <a href="#"        className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
    <footer className="bg-[#01274e] dark:bg-[#000d1e] text-gray-300 relative overflow-hidden transition-colors">

      {/* Decorative glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-700/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* ── Top strip ── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://nbqp.qci.org.in/wp-content/uploads/2023/06/qci-logo-updated.png"
              alt="QCI Logo"
              className="h-12 w-auto object-contain brightness-0 invert"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-tight">
              <p className="text-white font-extrabold text-base tracking-tight">Quality Council <span className="text-brand-400">of India</span></p>
              <p className="text-brand-400 text-[10px] font-bold uppercase tracking-widest">1QCI Portal · One Destination for Quality India</p>
            </div>
          </Link>
          <div className="flex gap-2">
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                className={`w-8 h-8 bg-white/10 border border-white/10 text-gray-400 ${s.hover} hover:text-white rounded-lg flex items-center justify-center transition-all hover:border-transparent hover:scale-105`}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5-column nav grid ── */}
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">

          {/* WHO WE ARE */}
          <div>
            <FooterHeading>Who We Are</FooterHeading>
            <ul className="space-y-2.5">
              {colWho.map(l => (
                <li key={l.label}><FooterLink to={(l as any).to} href={(l as any).href}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* THE ORGANISATION */}
          <div>
            <FooterHeading>The Organisation</FooterHeading>
            <ul className="space-y-2.5">
              {colOrg.map(l => (
                <li key={l.label}>
                  <a href={(l as any).href} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                    <span className="font-semibold text-brand-400 group-hover:text-brand-300">{l.label}</span>
                    {(l as any).desc && <span className="text-xs text-gray-600">· {(l as any).desc}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* WORK WITH US */}
          <div>
            <FooterHeading>Work With Us</FooterHeading>
            <ul className="space-y-2.5">
              {colWork.map(l => (
                <li key={l.label}><FooterLink to={(l as any).to} href={(l as any).href}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* GOVERNANCE & COMPLIANCE */}
          <div>
            <FooterHeading>Governance</FooterHeading>
            <ul className="space-y-2.5">
              {colGov.map(l => (
                <li key={l.label}><FooterLink href={(l as any).href}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* CONNECT WITH US */}
          <div>
            <FooterHeading>Connect With Us</FooterHeading>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">General</p>
                  <a href={`mailto:${settings.footer_email || 'info@qcin.org'}`} className="text-sm text-gray-300 hover:text-white transition-colors">{settings.footer_email || 'info@qcin.org'}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">HR & Careers</p>
                  <a href="mailto:hrcareers@qcin.org" className="text-sm text-gray-300 hover:text-white transition-colors">hrcareers@qcin.org</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Telephone</p>
                  <a href={`tel:${(settings.footer_phone || '011-26186680').replace(/[^0-9]/g, '')}`} className="text-sm text-gray-300 hover:text-white transition-colors">{settings.footer_phone || '011-26186680 to 83'}</a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ExternalLink size={14} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Main Website</p>
                  <a href="https://www.qcin.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-300 hover:text-white transition-colors">www.qcin.org</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Regional Offices ── */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
            <MapPin size={11} className="text-brand-400" /> Regional Offices
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regional.map(r => (
              <div key={r.city} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.07] transition-colors">
                <p className="text-white font-bold text-sm mb-1">{r.city}</p>
                <p className="text-gray-500 text-xs leading-relaxed mb-2">{r.addr}</p>
                <a href={`tel:${r.phone.replace(/[^0-9]/g, '')}`}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                  <Phone size={10} /> {r.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} <span className="text-gray-400">{copyright}</span>
            &nbsp;·&nbsp; <span className="italic text-gray-600">{tagline}</span>
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <button onClick={toggleDark}
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
              {dark ? <Sun size={12} /> : <Moon size={12} />}
              {dark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <span className="text-gray-700">·</span>
            <Link to="/about" className="hover:text-gray-300 transition-colors">About QCI</Link>
            <a href="https://www.qcin.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">qcin.org</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
