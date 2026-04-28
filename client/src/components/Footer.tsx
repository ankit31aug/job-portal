import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Mail, Phone, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const BOARDS = [
  { name: 'NABCB', full: 'National Accreditation Board for Certification Bodies', color: 'text-violet-400' },
  { name: 'NABET', full: 'National Accreditation Board for Education and Training', color: 'text-violet-400' },
  { name: 'NABL', full: 'National Accreditation Board for Testing and Calibration Laboratories', color: 'text-orange-400' },
  { name: 'NABH', full: 'National Accreditation Board for Hospitals & Healthcare Providers', color: 'text-teal-400' },
  { name: 'NBQP', full: 'National Board for Quality Promotion', color: 'text-rose-400' },
];

const DIVISIONS = [
  { name: 'PADD', full: 'Project Analysis and Documentation Division' },
  { name: 'PPID', full: 'Project Planning & Implementation Division' },
  { name: 'NDIE', full: 'National Division for Industry Excellence' },
];

export default function Footer({ isHome = false }: { isHome?: boolean }) {
  const { settings } = useSettings();

  const socials = [
    { key: 'footer_linkedin', icon: <Linkedin size={15} />, hover: 'hover:bg-blue-600', href: settings.footer_linkedin || '#' },
    { key: 'footer_twitter', icon: <Twitter size={15} />, hover: 'hover:bg-sky-500', href: settings.footer_twitter || '#' },
    { key: 'footer_instagram', icon: <Instagram size={15} />, hover: 'hover:bg-pink-600', href: settings.footer_instagram || '#' },
    { key: 'footer_facebook', icon: <Facebook size={15} />, hover: 'hover:bg-blue-700', href: settings.footer_facebook || '#' },
  ];

  if (isHome) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Quality Council of India</span>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/browse" className="hover:text-white transition-colors">Browse Jobs</Link>
            <Link to="/about" className="hover:text-white transition-colors">About QCI</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>
          <Link to="/register"
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors">
            Get Started
          </Link>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Brand — 2 cols */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg leading-tight">
                {settings.site_name.split(' ').slice(0, 2).join(' ')}<br />
                <span className="text-violet-400 text-sm font-normal">{settings.site_name.split(' ').slice(2).join(' ')}</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5 max-w-xs">{settings.footer_about}</p>

            {/* Social icons — always visible */}
            <div className="flex gap-2 mb-4">
              {socials.map(s => (
                <a key={s.key} href={s.href}
                  target={s.href !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className={`w-8 h-8 bg-gray-800 ${s.hover} rounded-lg flex items-center justify-center transition-colors`}>
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Divisions */}
            <div className="mt-4">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Divisions</p>
              <div className="space-y-1">
                {DIVISIONS.map(d => (
                  <div key={d.name} className="flex items-start gap-1.5">
                    <span className="text-violet-500 text-xs font-bold mt-0.5 flex-shrink-0">{d.name}</span>
                    <span className="text-gray-600 text-xs leading-tight">{d.full}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/browse', label: 'Browse Jobs' },
                { to: '/careers', label: 'Career Paths' },
                { to: '/about', label: 'About QCI' },
                { to: '/resume-match', label: 'Resume Matcher' },
                { to: '/register', label: 'Create Account' },
                { to: '/login', label: 'Sign In' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-violet-500 rounded-full flex-shrink-0"></span>{l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Boards */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Our Boards</h3>
            <ul className="space-y-3 text-sm">
              {BOARDS.map(d => (
                <li key={d.name}>
                  <Link to={`/browse?department=${d.name}`} className="group">
                    <span className={`font-semibold ${d.color}`}>{d.name}</span>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5 leading-tight">{d.full}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {settings.footer_address && (
            <div className="flex items-start gap-2.5 text-gray-400">
              <MapPin size={15} className="text-violet-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed text-xs">{settings.footer_address}</span>
            </div>
          )}
          {settings.footer_email && (
            <a href={`mailto:${settings.footer_email}`}
              className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors">
              <Mail size={15} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs">{settings.footer_email}</span>
            </a>
          )}
          {settings.footer_phone && (
            <a href={`tel:${settings.footer_phone}`}
              className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors">
              <Phone size={15} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs">{settings.footer_phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Quality Council of India. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>{settings.site_tagline}</span>
            <span className="text-gray-700">|</span>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Use</a>
            <Link to="/about" className="hover:text-gray-300 transition-colors">About QCI</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
