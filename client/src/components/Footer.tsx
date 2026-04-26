import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Mail, Phone, Linkedin, Twitter, ExternalLink } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const DEPT_INFO = [
  { name: 'NABH', full: 'National Accreditation Board for Hospitals & Healthcare Providers', color: 'text-blue-400' },
  { name: 'NABET', full: 'National Accreditation Board for Education and Training', color: 'text-purple-400' },
  { name: 'NABL', full: 'National Accreditation Board for Testing and Calibration Laboratories', color: 'text-orange-400' },
];

export default function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg leading-tight">
                {settings.site_name.split(' ').slice(0, 2).join(' ')}<br />
                <span className="text-blue-400 text-sm font-normal">{settings.site_name.split(' ').slice(2).join(' ')}</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{settings.footer_about}</p>
            <div className="flex gap-3">
              {settings.footer_linkedin && (
                <a href={settings.footer_linkedin} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                  <Linkedin size={16} />
                </a>
              )}
              {settings.footer_twitter && (
                <a href={settings.footer_twitter} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 hover:bg-sky-500 rounded-lg flex items-center justify-center transition-colors">
                  <Twitter size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/', label: 'Browse Jobs' },
                { to: '/resume-match', label: 'Resume Matcher' },
                { to: '/register', label: 'Create Account' },
                { to: '/login', label: 'Sign In' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>{l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Our Boards</h3>
            <ul className="space-y-3 text-sm">
              {DEPT_INFO.map(d => (
                <li key={d.name}>
                  <Link to={`/?category=Operations`} className="group">
                    <span className={`font-semibold ${d.color}`}>{d.name}</span>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5 leading-tight">{d.full}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {settings.footer_address && (
                <li className="flex items-start gap-2.5 text-gray-400">
                  <MapPin size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{settings.footer_address}</span>
                </li>
              )}
              {settings.footer_email && (
                <li>
                  <a href={`mailto:${settings.footer_email}`}
                    className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors">
                    <Mail size={15} className="text-blue-400 flex-shrink-0" />
                    {settings.footer_email}
                  </a>
                </li>
              )}
              {settings.footer_phone && (
                <li>
                  <a href={`tel:${settings.footer_phone}`}
                    className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors">
                    <Phone size={15} className="text-blue-400 flex-shrink-0" />
                    {settings.footer_phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>{settings.site_tagline}</span>
            <span className="text-gray-700">|</span>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
