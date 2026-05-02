import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState<'email'|'password'|null>(null);

  useEffect(() => {
    if (user?.role === 'hr') navigate('/admin', { replace: true });
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
      if (u?.role !== 'hr') {
        logout();
        setError('Access denied. This portal is for HR Admins only.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #059669, transparent 70%)', animationDelay: '1.5s' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} />
            <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <ShieldCheck size={36} className="text-white drop-shadow" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">HR Admin Portal</h1>
          <p className="text-emerald-300 text-sm font-medium">Quality Council of India — Internal HR System</p>
          <div className="inline-flex items-center gap-1.5 mt-3 bg-white/10 border border-white/10 text-white/60 text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
            <Lock size={10} />
            HR Personnel Only
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl shadow-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>

          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)' }} />

          <div className="p-8">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-red-300 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">HR Email Address</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focused === 'email' ? 'ring-2 ring-emerald-400 ring-offset-0' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.08)', border: focused === 'email' ? '1px solid rgba(52,211,153,0.6)' : '1px solid rgba(255,255,255,0.12)' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="hr-admin@qci.org"
                    autoComplete="email"
                    className="w-full px-4 py-3.5 text-sm bg-transparent outline-none rounded-xl text-white placeholder-white/30"
                    style={{ caretColor: '#34d399' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Password</label>
                <div className={`relative rounded-xl transition-all duration-200 ${focused === 'password' ? 'ring-2 ring-emerald-400 ring-offset-0' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.08)', border: focused === 'password' ? '1px solid rgba(52,211,153,0.6)' : '1px solid rgba(255,255,255,0.12)' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-12 text-sm bg-transparent outline-none rounded-xl text-white placeholder-white/30"
                    style={{ caretColor: '#34d399' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-white/80 transition-colors">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="relative w-full py-4 rounded-xl font-bold text-white text-sm overflow-hidden transition-all duration-200 disabled:opacity-60 active:scale-[0.98] mt-2"
                style={{ background: loading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #059669, #047857)' }}>
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      Sign In to HR Panel
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          <div className="px-8 py-4 flex justify-between items-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
            <Link to="/"
              className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft size={13} /> Back to portal
            </Link>
            <Link to="/superadmin-login"
              className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Super Admin →
            </Link>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          All access attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
}
