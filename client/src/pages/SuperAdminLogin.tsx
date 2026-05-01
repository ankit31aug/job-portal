import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Crown, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'super_admin') navigate('/superadmin');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      const stored = localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : null;
      if (u?.role !== 'super_admin') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Access denied. This portal is for Super Admins only.');
        return;
      }
      navigate('/superadmin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg mb-4">
            <Crown size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Admin Portal</h1>
          <p className="text-purple-300 mt-1 text-sm">Quality Council of India — System Administration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Super Admin Email</label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="superadmin@qci.org"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoComplete="email"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all text-sm">
              {loading ? 'Signing in...' : 'Sign In to Super Admin'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={14} /> Back to main site
            </Link>
            <Link to="/admin-login" className="text-sm text-gray-500 hover:text-gray-700">HR Admin →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
