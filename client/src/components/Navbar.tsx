import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Menu, X, User, LogOut, PlusCircle, LayoutDashboard, Search, FileText, ShieldCheck, TrendingUp, Moon, Sun } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <Briefcase size={28} className="text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {settings.site_name.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="text-blue-600">{settings.site_name.split(' ').slice(-1)}</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/browse" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white font-medium transition-colors">Browse Jobs</Link>
            <Link to="/careers" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white font-medium transition-colors flex items-center gap-1">
              <TrendingUp size={16} />Career Paths
            </Link>
            <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white font-medium transition-colors">About QCI</Link>
            <Link to="/resume-match" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white font-medium transition-colors flex items-center gap-1">
              <FileText size={16} />Resume Match
            </Link>
            {user?.role === 'employer' && (
              <Link to="/post-job" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white font-medium transition-colors flex items-center gap-1">
                <PlusCircle size={16} />Post a Job
              </Link>
            )}
            {user?.role === 'hr' && (
              <Link to="/admin" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors flex items-center gap-1">
                <ShieldCheck size={16} />HR Panel
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleDark}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-3 py-2 transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name.split(' ')[0]}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                    </div>
                    {user?.role === 'hr' ? (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <ShieldCheck size={16} />HR Admin Panel
                      </Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <LayoutDashboard size={16} />Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <LogOut size={16} />Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-600">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-1">
            <Link to="/browse" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Browse Jobs</Link>
            <Link to="/careers" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Career Paths</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">About QCI</Link>
            <Link to="/resume-match" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Resume Match</Link>
            {user?.role === 'employer' && (
              <Link to="/post-job" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Post a Job</Link>
            )}
            {user?.role === 'hr' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg font-medium">HR Admin Panel</Link>
            )}
            {user ? (
              <>
                {user.role !== 'hr' && (
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Dashboard</Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">Sign In</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
