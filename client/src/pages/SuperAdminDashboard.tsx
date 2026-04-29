import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, Briefcase, FileText, Settings, Image, LayoutGrid, ShieldCheck, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, LogOut, ChevronUp, ChevronDown, Eye, EyeOff, X, Check, Sun, Moon, KeyRound, Copy, Table2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PERMISSIONS = [
  { key: 'manage_jobs', label: 'Manage Jobs', desc: 'Post, edit, deactivate jobs' },
  { key: 'view_applications', label: 'View Applications', desc: 'See all applicants' },
  { key: 'update_application_status', label: 'Update Application Status', desc: 'Shortlist, interview, hire, reject' },
  { key: 'manage_users', label: 'Manage Users', desc: 'View and manage user accounts' },
  { key: 'manage_settings', label: 'Manage Settings', desc: 'Edit site content and branding' },
  { key: 'manage_gallery', label: 'Manage Gallery', desc: 'Add/edit gallery images' },
];

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'hr-roles', label: 'HR Roles', icon: ShieldCheck },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'boards', label: 'Boards', icon: LayoutGrid },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);

  // Jobs
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobTotal, setJobTotal] = useState(0);
  const [jobPage, setJobPage] = useState(1);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [usersView, setUsersView] = useState<'list' | 'credentials'>('list');

  // Set Password
  const [pwUserId, setPwUserId] = useState<number | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [showPwValue, setShowPwValue] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // HR Roles
  const [hrRoles, setHrRoles] = useState<any[]>([]);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [editingRole, setEditingRole] = useState<any>(null);

  // Create HR User
  const [showCreateHR, setShowCreateHR] = useState(false);
  const [hrForm, setHrForm] = useState({ name: '', email: '', password: '', phone: '', hr_role_id: '' });
  const [showHrPw, setShowHrPw] = useState(false);

  // Gallery
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', category: 'general', display_order: '0' });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Boards
  const [boards, setBoards] = useState<any[]>([]);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [boardForm, setBoardForm] = useState<any>({});
  const [boardFile, setBoardFile] = useState<File | null>(null);
  const boardRef = useRef<HTMLInputElement>(null);

  // Settings
  const [siteSettings, setSiteSettings] = useState<any[]>([]);
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Messages
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'super_admin') { navigate('/superadmin-login'); return; }
    loadStats();
  }, [user]);

  useEffect(() => {
    if (tab === 'jobs') loadJobs();
    if (tab === 'users') loadUsers();
    if (tab === 'hr-roles') loadHrRoles();
    if (tab === 'gallery') loadGallery();
    if (tab === 'boards') loadBoards();
    if (tab === 'settings') loadSettings();
  }, [tab]);

  const flash = (m: string, isErr = false) => {
    isErr ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  const loadStats   = async () => { try { const { data } = await api.get('/superadmin/stats'); setStats(data); } catch (_) {} };
  const loadJobs    = async (p = 1) => { const { data } = await api.get('/superadmin/jobs', { params: { page: p, limit: 20, search: jobSearch || undefined } }); setJobs(data.jobs); setJobTotal(data.total); setJobPage(p); };
  const loadUsers   = async () => { const { data } = await api.get('/superadmin/users', { params: { search: userSearch || undefined, role: userFilter || undefined } }); setUsers(data.users); setUserTotal(data.total); };
  const loadHrRoles = async () => { const { data } = await api.get('/superadmin/hr-roles'); setHrRoles(data); };
  const loadGallery = async () => { const { data } = await api.get('/superadmin/gallery'); setGallery(data); };
  const loadBoards  = async () => { const { data } = await api.get('/superadmin/boards'); setBoards(data); };
  const loadSettings = async () => {
    try {
      const { data } = await api.get('/superadmin/settings');
      setSiteSettings(data);
      setSettingsEdits(Object.fromEntries(data.map((s: any) => [s.key, s.value ?? ''])));
    } catch (e: any) { flash('Failed to load settings', true); }
  };

  // ── Job Actions ────────────────────────────────────────────────────────
  const toggleJob = async (job: any) => {
    await api.put(`/superadmin/jobs/${job.id}`, { ...job, is_active: job.is_active ? 0 : 1 });
    loadJobs(jobPage);
  };

  // ── HR Role Actions ────────────────────────────────────────────────────
  const saveRole = async () => {
    try {
      if (editingRole) { await api.put(`/superadmin/hr-roles/${editingRole.id}`, roleForm); }
      else { await api.post('/superadmin/hr-roles', roleForm); }
      setRoleForm({ name: '', description: '', permissions: [] }); setEditingRole(null);
      loadHrRoles(); flash('HR Role saved successfully');
    } catch (e: any) { flash(e.response?.data?.error || 'Failed to save role', true); }
  };

  const deleteRole = async (id: number) => {
    if (!confirm('Delete this HR role? Assigned users will lose their role.')) return;
    await api.delete(`/superadmin/hr-roles/${id}`);
    loadHrRoles(); flash('HR Role deleted');
  };

  const togglePermission = (perm: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm]
    }));
  };

  // ── User Actions ────────────────────────────────────────────────────────
  const updateUserRole = async (userId: number, role: string, hr_role_id?: number) => {
    await api.put(`/superadmin/users/${userId}/role`, { role, hr_role_id });
    loadUsers(); flash('User role updated');
  };

  const createHrUser = async () => {
    try {
      await api.post('/superadmin/users/create-hr', hrForm);
      setHrForm({ name: '', email: '', password: '', phone: '', hr_role_id: '' });
      setShowCreateHR(false); loadUsers(); flash('HR user created successfully');
    } catch (e: any) { flash(e.response?.data?.error || 'Failed to create HR user', true); }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Permanently delete this user?')) return;
    try { await api.delete(`/superadmin/users/${id}`); loadUsers(); flash('User deleted'); }
    catch (e: any) { flash(e.response?.data?.error || 'Cannot delete', true); }
  };

  const saveUserPassword = async () => {
    if (!pwUserId || !pwValue) return;
    setPwSaving(true);
    try {
      await api.put(`/superadmin/users/${pwUserId}/password`, { password: pwValue });
      setPwUserId(null); setPwValue(''); flash('Password updated');
    } catch (e: any) { flash(e.response?.data?.error || 'Failed to update password', true); }
    finally { setPwSaving(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => flash('Copied to clipboard'));
  };

  // ── Gallery Actions ────────────────────────────────────────────────────
  const saveGallery = async () => {
    const fd = new FormData();
    Object.entries(galleryForm).forEach(([k, v]) => fd.append(k, v));
    if (galleryFile) fd.append('image', galleryFile);
    try {
      if (editingGallery) { await api.put(`/superadmin/gallery/${editingGallery.id}`, fd); }
      else { await api.post('/superadmin/gallery', fd); }
      setGalleryForm({ title: '', description: '', category: 'general', display_order: '0' });
      setGalleryFile(null); setEditingGallery(null); if (galleryRef.current) galleryRef.current.value = '';
      loadGallery(); flash('Gallery item saved');
    } catch (_) { flash('Failed to save gallery item', true); }
  };

  const deleteGallery = async (id: number) => {
    if (!confirm('Delete this gallery item?')) return;
    await api.delete(`/superadmin/gallery/${id}`); loadGallery(); flash('Deleted');
  };

  const moveGallery = async (idx: number, dir: -1 | 1) => {
    const updated = [...gallery];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= updated.length) return;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const items = updated.map((g, i) => ({ id: g.id, display_order: i }));
    await api.put('/superadmin/gallery/reorder/batch', { items });
    loadGallery();
  };

  // ── Board Actions ──────────────────────────────────────────────────────
  const startEditBoard = (board: any) => {
    setEditingBoard(board);
    setBoardForm({ name: board.name, full_name: board.full_name, description: board.description || '', color: board.color, display_order: board.display_order, is_active: board.is_active });
    setBoardFile(null);
  };

  const saveBoard = async () => {
    const fd = new FormData();
    Object.entries(boardForm).forEach(([k, v]) => fd.append(k, String(v)));
    if (boardFile) fd.append('image', boardFile);
    try {
      await api.put(`/superadmin/boards/${editingBoard.id}`, fd);
      setEditingBoard(null); setBoardFile(null); loadBoards(); flash('Board updated');
    } catch (_) { flash('Failed to update board', true); }
  };

  const moveBoard = async (idx: number, dir: -1 | 1) => {
    const updated = [...boards];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= updated.length) return;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const items = updated.map((b, i) => ({ id: b.id, display_order: i + 1 }));
    await api.put('/superadmin/boards/reorder/batch', { items });
    loadBoards();
  };

  // ── Settings Actions ────────────────────────────────────────────────────
  const saveSettings = async () => {
    if (Object.keys(settingsEdits).length === 0) {
      flash('Settings not loaded yet. Please wait.', true);
      return;
    }
    setSettingsSaving(true);
    try {
      await api.put('/superadmin/settings', settingsEdits);
      flash('Settings saved successfully');
    } catch (e: any) {
      flash(e.response?.data?.error || 'Failed to save settings', true);
    } finally {
      setSettingsSaving(false);
    }
  };

  const CATEGORIES = [...new Set(siteSettings.map(s => s.category))];

  // ── Shared class helpers ────────────────────────────────────────────────
  const card   = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl';
  const input  = 'bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const label  = 'text-gray-600 dark:text-gray-400 text-xs mb-1 block';
  const title  = 'text-gray-900 dark:text-white font-semibold';
  const muted  = 'text-gray-500 dark:text-gray-500';

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-950 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-gradient-to-b from-violet-950 to-purple-950 border-r border-violet-800/40 flex flex-col">
        <div className="p-4 border-b border-violet-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Crown size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Super Admin</p>
              <p className="text-purple-400 text-xs truncate">{user?.name}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${tab === t.id ? 'bg-violet-600 text-white' : 'text-purple-300 hover:bg-violet-800/40 hover:text-white'}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-violet-800/40 space-y-0.5">
          <button onClick={toggleDark}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-300 hover:text-white rounded-lg hover:bg-violet-800/40 transition-all">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-all">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-gray-900 dark:text-white font-semibold">{TABS.find(t => t.id === tab)?.label}</h1>
          <div className="flex gap-2 items-center">
            {msg && <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1"><Check size={14} />{msg}</span>}
            {error && <span className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1"><X size={14} />{error}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-950">

          {/* ── DASHBOARD ───────────────────────────────────────────────── */}
          {tab === 'dashboard' && stats && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: stats.totalUsers, color: 'from-blue-600 to-blue-700' },
                  { label: 'Active Jobs', value: stats.totalJobs, color: 'from-violet-600 to-violet-700' },
                  { label: 'Applications', value: stats.totalApplications, color: 'from-orange-500 to-orange-600' },
                  { label: 'Hired', value: stats.hired, color: 'from-green-600 to-green-700' },
                  { label: 'HR Roles', value: stats.hrRoles, color: 'from-teal-600 to-teal-700' },
                  { label: 'Gallery Items', value: stats.galleryItems, color: 'from-pink-600 to-pink-700' },
                ].map(s => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${card} p-5`}>
                  <h3 className={`${title} mb-3`}>Quick Access</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {TABS.filter(t => t.id !== 'dashboard').map(t => (
                      <button key={t.id} onClick={() => setTab(t.id)}
                        className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors">
                        <t.icon size={14} className="text-violet-500" /> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`${card} p-5`}>
                  <h3 className={`${title} mb-3`}>Credentials</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Role</span><span className="text-violet-500 font-medium">Super Admin</span></div>
                    <div className="flex justify-between text-gray-500"><span>Email</span><span className="text-gray-700 dark:text-gray-300">{user?.email}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Access</span><span className="text-green-600 dark:text-green-400">Full System Control</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── JOBS ────────────────────────────────────────────────────── */}
          {tab === 'jobs' && (
            <div>
              <div className="flex gap-3 mb-4">
                <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadJobs(1)}
                  placeholder="Search jobs..." className={`flex-1 ${input}`} />
                <button onClick={() => loadJobs(1)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">Search</button>
              </div>
              <p className={`${muted} text-sm mb-3`}>{jobTotal} total jobs</p>
              <div className="space-y-2">
                {jobs.map(j => (
                  <div key={j.id} className={`${card} p-4 flex items-center gap-4 ${!j.is_active ? 'border-red-300 dark:border-red-900/40' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 dark:text-white font-medium truncate">{j.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${j.is_active ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>{j.is_active ? 'Active' : 'Inactive'}</span>
                        {j.department && j.department !== 'General' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400">{j.department}</span>}
                      </div>
                      <p className={`${muted} text-xs mt-0.5`}>{j.company} · {j.location} · {j.application_count} applications</p>
                    </div>
                    <button onClick={() => toggleJob(j)} className={`p-2 rounded-lg transition-colors ${j.is_active ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                      {j.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                {Array.from({ length: Math.ceil(jobTotal / 20) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => loadJobs(p)} className={`w-8 h-8 rounded text-sm ${jobPage === p ? 'bg-violet-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ───────────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div>
              {/* Toolbar */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()}
                  placeholder="Search users..." className={`flex-1 min-w-40 ${input}`} />
                <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={input}>
                  <option value="">All Roles</option>
                  {['jobseeker','employer','hr','super_admin'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => loadUsers()} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">Search</button>
                <button onClick={() => setShowCreateHR(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                  <Plus size={14} /> Create HR
                </button>
                {/* View toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                  <button onClick={() => setUsersView('list')}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1 ${usersView === 'list' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <Users size={12} /> List
                  </button>
                  <button onClick={() => setUsersView('credentials')}
                    className={`px-3 py-1.5 text-xs flex items-center gap-1 ${usersView === 'credentials' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    <KeyRound size={12} /> Credentials
                  </button>
                </div>
              </div>

              {/* Create HR form */}
              {showCreateHR && (
                <div className={`${card} border-emerald-300 dark:border-emerald-700/40 p-5 mb-4`}>
                  <h3 className={`${title} mb-3`}>Create HR User</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Full Name" value={hrForm.name} onChange={e => setHrForm(p => ({ ...p, name: e.target.value }))} className={input} />
                    <input placeholder="Email" value={hrForm.email} onChange={e => setHrForm(p => ({ ...p, email: e.target.value }))} className={input} />
                    <div className="relative">
                      <input type={showHrPw ? 'text' : 'password'} placeholder="Password" value={hrForm.password} onChange={e => setHrForm(p => ({ ...p, password: e.target.value }))} className={`w-full pr-8 ${input}`} />
                      <button type="button" onClick={() => setShowHrPw(!showHrPw)} className="absolute right-2 top-2 text-gray-400">{showHrPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                    <input placeholder="Phone (optional)" value={hrForm.phone} onChange={e => setHrForm(p => ({ ...p, phone: e.target.value }))} className={input} />
                    <select value={hrForm.hr_role_id} onChange={e => setHrForm(p => ({ ...p, hr_role_id: e.target.value }))} className={`col-span-2 ${input}`}>
                      <option value="">No HR Role (assign later)</option>
                      {hrRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={createHrUser} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">Create User</button>
                    <button onClick={() => setShowCreateHR(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <p className={`${muted} text-sm mb-3`}>{userTotal} total users</p>

              {/* ── LIST VIEW ── */}
              {usersView === 'list' && (
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.id} className={`${card} p-4 flex items-center gap-4`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-gray-900 dark:text-white font-medium">{u.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.role === 'super_admin' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' : u.role === 'hr' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : u.role === 'employer' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{u.role}</span>
                          {u.hr_role_name && <span className="text-xs text-violet-500">({u.hr_role_name})</span>}
                        </div>
                        <p className={`${muted} text-xs`}>{u.email} · {u.city || 'No city'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {u.role === 'hr' && (
                          <select defaultValue={u.hr_role_id || ''} onChange={e => updateUserRole(u.id, 'hr', parseInt(e.target.value) || undefined)}
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-white text-xs">
                            <option value="">No Role</option>
                            {hrRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        )}
                        <button onClick={() => { setPwUserId(u.id); setPwValue(''); setShowPwValue(false); }}
                          className="p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg" title="Set Password">
                          <KeyRound size={14} />
                        </button>
                        {u.role !== 'super_admin' && (
                          <button onClick={() => deleteUser(u.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── CREDENTIALS VIEW ── */}
              {usersView === 'credentials' && (
                <div className={`${card} overflow-hidden`}>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-300 text-xs font-medium">Credentials are sensitive — do not share this view. Passwords shown here are set values; stored passwords are encrypted.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">ID</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">Name</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">Login Email</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">Role</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">HR Role</th>
                          <th className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">Set Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                            <td className="px-4 py-2.5 text-gray-500 dark:text-gray-500 text-xs font-mono">#{u.id}</td>
                            <td className="px-4 py-2.5">
                              <p className="text-gray-900 dark:text-white font-medium text-sm">{u.name}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{u.email}</span>
                                <button onClick={() => copyToClipboard(u.email)} className="text-gray-400 hover:text-violet-500 transition-colors">
                                  <Copy size={11} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.role === 'super_admin' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' : u.role === 'hr' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : u.role === 'employer' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{u.role}</span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-violet-500">{u.hr_role_name || '—'}</td>
                            <td className="px-4 py-2.5">
                              {pwUserId === u.id ? (
                                <div className="flex items-center gap-1">
                                  <div className="relative">
                                    <input type={showPwValue ? 'text' : 'password'} value={pwValue}
                                      onChange={e => setPwValue(e.target.value)}
                                      placeholder="New password"
                                      className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs w-32 pr-6 text-gray-900 dark:text-white" />
                                    <button type="button" onClick={() => setShowPwValue(v => !v)} className="absolute right-1.5 top-1.5 text-gray-400">
                                      {showPwValue ? <EyeOff size={11} /> : <Eye size={11} />}
                                    </button>
                                  </div>
                                  <button onClick={saveUserPassword} disabled={pwSaving || !pwValue}
                                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs">
                                    {pwSaving ? '…' : 'Set'}
                                  </button>
                                  <button onClick={() => setPwUserId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={12} /></button>
                                </div>
                              ) : (
                                <button onClick={() => { setPwUserId(u.id); setPwValue(''); setShowPwValue(false); }}
                                  className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                                  <KeyRound size={11} /> Set Password
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inline set-password panel (List view) */}
              {pwUserId !== null && usersView === 'list' && (
                <div className={`${card} border-amber-300 dark:border-amber-700/40 p-4 mt-3 flex items-center gap-3`}>
                  <KeyRound size={16} className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Set new password for <strong>{users.find(u => u.id === pwUserId)?.name}</strong>
                  </p>
                  <div className="relative flex-1 max-w-xs">
                    <input type={showPwValue ? 'text' : 'password'} value={pwValue}
                      onChange={e => setPwValue(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className={`w-full pr-8 ${input}`} />
                    <button type="button" onClick={() => setShowPwValue(v => !v)} className="absolute right-2 top-2 text-gray-400">
                      {showPwValue ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button onClick={saveUserPassword} disabled={pwSaving || !pwValue}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                    {pwSaving ? 'Saving…' : 'Update'}
                  </button>
                  <button onClick={() => { setPwUserId(null); setPwValue(''); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
              )}
            </div>
          )}

          {/* ── HR ROLES ─────────────────────────────────────────────────── */}
          {tab === 'hr-roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${card} p-5`}>
                <h3 className={`${title} mb-4`}>{editingRole ? 'Edit HR Role' : 'Create New HR Role'}</h3>
                <input placeholder="Role Name (e.g. Assessment Coordinator)" value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} className={`w-full mb-3 ${input}`} />
                <textarea placeholder="Description (optional)" value={roleForm.description} onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))} rows={2} className={`w-full mb-4 resize-none ${input}`} />
                <p className={`${label} font-medium`}>Permissions</p>
                <div className="space-y-2 mb-4">
                  {PERMISSIONS.map(p => (
                    <label key={p.key} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={roleForm.permissions.includes(p.key)} onChange={() => togglePermission(p.key)}
                        className="mt-0.5 accent-violet-500" />
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{p.label}</p>
                        <p className={`${muted} text-xs`}>{p.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveRole} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">
                    {editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                  {editingRole && (
                    <button onClick={() => { setEditingRole(null); setRoleForm({ name: '', description: '', permissions: [] }); }}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {hrRoles.length === 0 && <p className={`${muted} text-sm`}>No HR roles created yet.</p>}
                {hrRoles.map(r => (
                  <div key={r.id} className={`${card} p-4`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{r.name}</p>
                        {r.description && <p className={`${muted} text-xs mt-0.5`}>{r.description}</p>}
                        <p className="text-violet-500 text-xs mt-1">{r.assigned_count} HR user{r.assigned_count !== 1 ? 's' : ''} assigned</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingRole(r); setRoleForm({ name: r.name, description: r.description || '', permissions: r.permissions || [] }); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => deleteRole(r.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(r.permissions || []).map((p: string) => (
                        <span key={p} className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{PERMISSIONS.find(x => x.key === p)?.label || p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GALLERY ─────────────────────────────────────────────────── */}
          {tab === 'gallery' && (
            <div>
              <div className={`${card} p-5 mb-5`}>
                <h3 className={`${title} mb-3`}>{editingGallery ? 'Edit Gallery Item' : 'Add Gallery Item'}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input placeholder="Title*" value={galleryForm.title} onChange={e => setGalleryForm(p => ({ ...p, title: e.target.value }))} className={input} />
                  <input placeholder="Category (e.g. events, awards)" value={galleryForm.category} onChange={e => setGalleryForm(p => ({ ...p, category: e.target.value }))} className={input} />
                  <textarea placeholder="Description" value={galleryForm.description} onChange={e => setGalleryForm(p => ({ ...p, description: e.target.value }))} rows={2} className={`resize-none col-span-2 ${input}`} />
                  <input ref={galleryRef} type="file" accept="image/*" onChange={e => setGalleryFile(e.target.files?.[0] || null)} className={`col-span-2 ${input}`} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveGallery} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">{editingGallery ? 'Update' : 'Add Item'}</button>
                  {editingGallery && <button onClick={() => { setEditingGallery(null); setGalleryForm({ title: '', description: '', category: 'general', display_order: '0' }); }} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((g, idx) => (
                  <div key={g.id} className={`${card} overflow-hidden`}>
                    {g.image_path ? (
                      <img src={g.image_path} alt={g.title} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400"><Image size={24} /></div>
                    )}
                    <div className="p-3">
                      <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{g.title}</p>
                      <p className={`${muted} text-xs`}>{g.category}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <button onClick={() => moveGallery(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                        <button onClick={() => moveGallery(idx, 1)} disabled={idx === gallery.length - 1} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                        <button onClick={() => { setEditingGallery(g); setGalleryForm({ title: g.title, description: g.description || '', category: g.category, display_order: String(g.display_order) }); }} className="p-1 text-blue-500 hover:text-blue-400 ml-auto"><Edit2 size={14} /></button>
                        <button onClick={() => deleteGallery(g.id)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <p className={`${muted} text-sm col-span-full`}>No gallery items yet.</p>}
              </div>
            </div>
          )}

          {/* ── BOARDS ──────────────────────────────────────────────────── */}
          {tab === 'boards' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {boards.map((b, idx) => (
                  <div key={b.id} className={`${card} p-4 flex items-center gap-4`}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveBoard(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                      <button onClick={() => moveBoard(idx, 1)} disabled={idx === boards.length - 1} className="text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                    </div>
                    {b.image_path ? (
                      <img src={b.image_path} alt={b.code} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold">{b.code.slice(0, 2)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium text-sm">{b.code} — {b.name}</p>
                      <p className={`${muted} text-xs truncate`}>{b.full_name}</p>
                      <span className={`text-xs ${b.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{b.board_type} · {b.is_active ? 'visible' : 'hidden'}</span>
                    </div>
                    <button onClick={() => startEditBoard(b)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={14} /></button>
                  </div>
                ))}
              </div>

              {editingBoard && (
                <div className={`${card} border-violet-300 dark:border-violet-700/40 p-5`}>
                  <h3 className={`${title} mb-3`}>Edit: {editingBoard.code}</h3>
                  <div className="space-y-3">
                    <input placeholder="Display Name" value={boardForm.name} onChange={e => setBoardForm((p: any) => ({ ...p, name: e.target.value }))} className={`w-full ${input}`} />
                    <input placeholder="Full Name" value={boardForm.full_name} onChange={e => setBoardForm((p: any) => ({ ...p, full_name: e.target.value }))} className={`w-full ${input}`} />
                    <textarea placeholder="Description" value={boardForm.description} onChange={e => setBoardForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} className={`w-full resize-none ${input}`} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Color</label>
                        <input placeholder="e.g. #1a56db" value={boardForm.color} onChange={e => setBoardForm((p: any) => ({ ...p, color: e.target.value }))} className={`w-full ${input}`} />
                      </div>
                      <div>
                        <label className={label}>Visibility</label>
                        <select value={boardForm.is_active} onChange={e => setBoardForm((p: any) => ({ ...p, is_active: e.target.value }))} className={`w-full ${input}`}>
                          <option value="1">Visible</option>
                          <option value="0">Hidden</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={label}>Board Image (optional)</label>
                      <input ref={boardRef} type="file" accept="image/*" onChange={e => setBoardFile(e.target.files?.[0] || null)} className={`w-full ${input}`} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveBoard} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">Save Board</button>
                      <button onClick={() => setEditingBoard(null)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ─────────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div>
              {siteSettings.length === 0 && (
                <p className={`${muted} text-sm mb-4`}>Loading settings…</p>
              )}
              {CATEGORIES.map(cat => (
                <div key={cat} className={`${card} p-5 mb-4`}>
                  <h3 className={`${title} mb-4 capitalize`}>{cat}</h3>
                  <div className="space-y-3">
                    {siteSettings.filter(s => s.category === cat).map(s => (
                      <div key={s.key}>
                        <label className={label}>{s.label || s.key}</label>
                        {(s.value?.length > 80 || s.key.includes('about') || s.key.includes('subtitle')) ? (
                          <textarea value={settingsEdits[s.key] ?? ''} onChange={e => setSettingsEdits(p => ({ ...p, [s.key]: e.target.value }))} rows={3} className={`w-full resize-none ${input}`} />
                        ) : (
                          <input value={settingsEdits[s.key] ?? ''} onChange={e => setSettingsEdits(p => ({ ...p, [s.key]: e.target.value }))} className={`w-full ${input}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {siteSettings.length > 0 && (
                <button onClick={saveSettings} disabled={settingsSaving}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  {settingsSaving ? 'Saving…' : 'Save All Settings'}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
