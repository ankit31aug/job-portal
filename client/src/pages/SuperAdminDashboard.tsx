import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Users, Briefcase, FileText, Settings, Image, LayoutGrid, ShieldCheck,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, LogOut, ChevronUp, ChevronDown,
  Eye, EyeOff, X, Check, Sun, Moon, KeyRound, Copy, PanelBottom, GitBranch,
  Palette, Globe, Phone, Mail, MapPin,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Module-based permission groups ────────────────────────────────────────────
const PERMISSION_GROUPS = [
  {
    group: 'Jobs', icon: Briefcase, color: 'blue',
    permissions: [
      { key: 'view_jobs',   label: 'View Jobs',              desc: 'Browse job listings in the admin panel' },
      { key: 'create_jobs', label: 'Post New Jobs',          desc: 'Add new job openings' },
      { key: 'edit_jobs',   label: 'Edit Jobs',              desc: 'Modify existing job posts' },
      { key: 'delete_jobs', label: 'Delete / Deactivate',    desc: 'Remove or hide job listings' },
    ],
  },
  {
    group: 'Applications', icon: FileText, color: 'orange',
    permissions: [
      { key: 'view_applications',         label: 'View Applications', desc: 'See all applicants and their details' },
      { key: 'update_application_status', label: 'Update Status',     desc: 'Shortlist, interview, hire, or reject candidates' },
      { key: 'download_resumes',          label: 'Download Resumes',  desc: 'Access and download candidate CV files' },
    ],
  },
  {
    group: 'Users', icon: Users, color: 'emerald',
    permissions: [
      { key: 'manage_users',    label: 'Manage Users',    desc: 'View and edit all user accounts' },
      { key: 'create_users',    label: 'Create Accounts', desc: 'Add new HR or employer accounts' },
      { key: 'reset_passwords', label: 'Reset Passwords', desc: 'Change passwords for any user' },
    ],
  },
  {
    group: 'Content & Branding', icon: Palette, color: 'violet',
    permissions: [
      { key: 'manage_branding',       label: 'Site Branding',    desc: 'Edit site name, tagline, and colours' },
      { key: 'manage_home_content',   label: 'Home Page',        desc: 'Edit hero section, stats, announcements, and events' },
      { key: 'manage_about_content',  label: 'About Page',       desc: 'Edit mission, leadership, milestones, and testimonials' },
      { key: 'manage_footer',         label: 'Footer',           desc: 'Edit footer links, contact info, and social media' },
      { key: 'manage_contact',        label: 'Contact Info',     desc: 'Edit office address, phone numbers, and email' },
      { key: 'publish_announcements', label: 'Announcements',    desc: 'Post and manage news and updates' },
    ],
  },
  {
    group: 'Media', icon: Image, color: 'pink',
    permissions: [
      { key: 'manage_gallery', label: 'Gallery', desc: 'Upload and manage the photo gallery' },
      { key: 'manage_boards',  label: 'Boards',  desc: 'Edit board names, descriptions, and images' },
    ],
  },
];

const PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);

const GROUP_COLORS: Record<string, string> = {
  blue:    'text-blue-700   dark:text-blue-300   bg-blue-50   dark:bg-blue-900/20   border-blue-200   dark:border-blue-800/40',
  orange:  'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40',
  emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40',
  violet:  'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40',
  pink:    'text-pink-700   dark:text-pink-300   bg-pink-50   dark:bg-pink-900/20   border-pink-200   dark:border-pink-800/40',
};

// ── Sidebar navigation tabs ───────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard',          icon: LayoutGrid },
  { id: 'jobs',      label: 'Jobs',                icon: Briefcase },
  { id: 'users',     label: 'Users',               icon: Users },
  { id: 'hr-roles',  label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'gallery',   label: 'Gallery',             icon: Image },
  { id: 'boards',    label: 'Boards',              icon: LayoutGrid },
  { id: 'footer',    label: 'Footer Editor',       icon: PanelBottom },
  { id: 'settings',  label: 'Settings',            icon: Settings },
];

// ── Build a depth-ordered role tree for the hierarchy thread view ─────────────
const buildRoleTree = (
  roles: any[], parentId: number | null = null, depth = 0,
): Array<{ role: any; depth: number }> =>
  roles
    .filter(r => (r.parent_role_id ?? null) === parentId)
    .flatMap(r => [{ role: r, depth }, ...buildRoleTree(roles, r.id, depth + 1)]);

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);

  // ── Jobs state ───────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState('');
  const [jobTotal, setJobTotal] = useState(0);
  const [jobPage, setJobPage] = useState(1);

  // ── Users state ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [usersView, setUsersView] = useState<'list' | 'credentials'>('list');
  const [pwUserId, setPwUserId] = useState<number | null>(null);
  const [pwValue, setPwValue] = useState('');
  const [showPwValue, setShowPwValue] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // ── HR Roles state ───────────────────────────────────────────────────────────
  const [hrRoles, setHrRoles] = useState<any[]>([]);
  const [roleForm, setRoleForm] = useState({
    name: '', description: '', permissions: [] as string[],
    parent_role_id: '' as string | number,
    color: '#6366f1',
  });
  const [editingRole, setEditingRole] = useState<any>(null);
  const [showCreateHR, setShowCreateHR] = useState(false);
  const [hrForm, setHrForm] = useState({ name: '', email: '', password: '', phone: '', hr_role_id: '' });
  const [showHrPw, setShowHrPw] = useState(false);

  // ── Gallery state ────────────────────────────────────────────────────────────
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', category: 'general', display_order: '0' });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Boards state ─────────────────────────────────────────────────────────────
  const [boards, setBoards] = useState<any[]>([]);
  const [editingBoard, setEditingBoard] = useState<any>(null);
  const [boardForm, setBoardForm] = useState<any>({});
  const [boardFile, setBoardFile] = useState<File | null>(null);
  const boardRef = useRef<HTMLInputElement>(null);

  // ── Settings / Footer (shared) ───────────────────────────────────────────────
  const [siteSettings, setSiteSettings] = useState<any[]>([]);
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsPage, setSettingsPage] = useState<'general' | 'home' | 'about' | 'contact'>('general');

  // ── Flash messages ───────────────────────────────────────────────────────────
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'super_admin') { navigate('/superadmin-login'); return; }
    loadStats();
  }, [user]);

  useEffect(() => {
    if (tab === 'jobs')                    loadJobs();
    if (tab === 'users')                   loadUsers();
    if (tab === 'hr-roles')                loadHrRoles();
    if (tab === 'gallery')                 loadGallery();
    if (tab === 'boards')                  loadBoards();
    if (tab === 'settings' || tab === 'footer') loadSettings();
  }, [tab]);

  const flash = (m: string, isErr = false) => {
    isErr ? setError(m) : setMsg(m);
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  // ── Data loaders ─────────────────────────────────────────────────────────────
  const loadStats    = async () => { try { const { data } = await api.get('/superadmin/stats'); setStats(data); } catch (_) {} };
  const loadJobs     = async (p = 1) => { const { data } = await api.get('/superadmin/jobs', { params: { page: p, limit: 20, search: jobSearch || undefined } }); setJobs(data.jobs); setJobTotal(data.total); setJobPage(p); };
  const loadUsers    = async () => { const { data } = await api.get('/superadmin/users', { params: { search: userSearch || undefined, role: userFilter || undefined } }); setUsers(data.users); setUserTotal(data.total); };
  const loadHrRoles  = async () => { const { data } = await api.get('/superadmin/hr-roles'); setHrRoles(data); };
  const loadGallery  = async () => { const { data } = await api.get('/superadmin/gallery'); setGallery(data); };
  const loadBoards   = async () => { const { data } = await api.get('/superadmin/boards'); setBoards(data); };
  const loadSettings = async () => {
    try {
      const { data } = await api.get('/superadmin/settings');
      setSiteSettings(data);
      setSettingsEdits(Object.fromEntries(data.map((s: any) => [s.key, s.value ?? ''])));
    } catch { flash('Failed to load settings', true); }
  };

  // ── Job actions ──────────────────────────────────────────────────────────────
  const toggleJob = async (job: any) => {
    await api.put(`/superadmin/jobs/${job.id}`, { ...job, is_active: job.is_active ? 0 : 1 });
    loadJobs(jobPage);
  };

  // ── HR Role actions ───────────────────────────────────────────────────────────
  const saveRole = async () => {
    try {
      const payload = {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        parent_role_id: roleForm.parent_role_id ? parseInt(String(roleForm.parent_role_id)) : null,
        color: roleForm.color || '#6366f1',
      };
      if (editingRole) await api.put(`/superadmin/hr-roles/${editingRole.id}`, payload);
      else             await api.post('/superadmin/hr-roles', payload);
      setRoleForm({ name: '', description: '', permissions: [], parent_role_id: '', color: '#6366f1' });
      setEditingRole(null);
      loadHrRoles(); flash('Role saved');
    } catch (e: any) { flash(e.response?.data?.error || 'Failed to save role', true); }
  };

  const deleteRole = async (id: number) => {
    if (!confirm('Delete this role? Assigned users will lose their role.')) return;
    await api.delete(`/superadmin/hr-roles/${id}`);
    loadHrRoles(); flash('Role deleted');
  };

  const togglePermission = (perm: string) =>
    setRoleForm(p => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter(k => k !== perm)
        : [...p.permissions, perm],
    }));

  const toggleGroup = (keys: string[]) => {
    const allOn = keys.every(k => roleForm.permissions.includes(k));
    setRoleForm(p => ({
      ...p,
      permissions: allOn
        ? p.permissions.filter(k => !keys.includes(k))
        : [...new Set([...p.permissions, ...keys])],
    }));
  };

  // ── User actions ──────────────────────────────────────────────────────────────
  const updateUserRole = async (userId: number, role: string, hr_role_id?: number) => {
    await api.put(`/superadmin/users/${userId}/role`, { role, hr_role_id });
    loadUsers(); flash('User role updated');
  };

  const createHrUser = async () => {
    try {
      await api.post('/superadmin/users/create-hr', hrForm);
      setHrForm({ name: '', email: '', password: '', phone: '', hr_role_id: '' });
      setShowCreateHR(false); loadUsers(); flash('HR user created');
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
    } catch (e: any) { flash(e.response?.data?.error || 'Failed', true); }
    finally { setPwSaving(false); }
  };

  const copyToClipboard = (text: string) =>
    navigator.clipboard.writeText(text).then(() => flash('Copied'));

  // ── Gallery actions ───────────────────────────────────────────────────────────
  const saveGallery = async () => {
    const fd = new FormData();
    Object.entries(galleryForm).forEach(([k, v]) => fd.append(k, v));
    if (galleryFile) fd.append('image', galleryFile);
    try {
      if (editingGallery) await api.put(`/superadmin/gallery/${editingGallery.id}`, fd);
      else                await api.post('/superadmin/gallery', fd);
      setGalleryForm({ title: '', description: '', category: 'general', display_order: '0' });
      setGalleryFile(null); setEditingGallery(null);
      if (galleryRef.current) galleryRef.current.value = '';
      loadGallery(); flash('Gallery item saved');
    } catch { flash('Failed to save gallery item', true); }
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
    await api.put('/superadmin/gallery/reorder/batch', { items: updated.map((g, i) => ({ id: g.id, display_order: i })) });
    loadGallery();
  };

  // ── Board actions ─────────────────────────────────────────────────────────────
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
    } catch { flash('Failed to update board', true); }
  };

  const moveBoard = async (idx: number, dir: -1 | 1) => {
    const updated = [...boards];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= updated.length) return;
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    await api.put('/superadmin/boards/reorder/batch', { items: updated.map((b, i) => ({ id: b.id, display_order: i + 1 })) });
    loadBoards();
  };

  // ── Settings / Footer actions ─────────────────────────────────────────────────
  const saveSettings = async () => {
    if (Object.keys(settingsEdits).length === 0) { flash('Settings not loaded yet', true); return; }
    setSettingsSaving(true);
    try {
      await api.put('/superadmin/settings', settingsEdits);
      flash('Saved successfully');
    } catch (e: any) { flash(e.response?.data?.error || 'Failed to save', true); }
    finally { setSettingsSaving(false); }
  };

  const formatJson = (key: string) => {
    try { setSettingsEdits(p => ({ ...p, [key]: JSON.stringify(JSON.parse(p[key] || '[]'), null, 2) })); flash('JSON formatted'); }
    catch { flash('Invalid JSON', true); }
  };

  const se  = (key: string) => settingsEdits[key] ?? '';
  const setse = (key: string, val: string) => setSettingsEdits(p => ({ ...p, [key]: val }));

  // ── CSS helpers ───────────────────────────────────────────────────────────────
  const card  = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl';
  const inp   = 'bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500';
  const lbl   = 'text-gray-600 dark:text-gray-400 text-xs mb-1 block';
  const ttl   = 'text-gray-900 dark:text-white font-semibold';
  const muted = 'text-gray-500 dark:text-gray-500';

  // ── Shared settings-field renderer ────────────────────────────────────────────
  const sf = (key: string, fieldLabel: string, type: 'text' | 'url' | 'color' | 'textarea' | 'json', hint?: string) => (
    <div key={key} className="space-y-1">
      <div className="flex items-center justify-between">
        <label className={lbl}>{fieldLabel}</label>
        {type === 'json' && (
          <div className="flex gap-1">
            <button type="button" onClick={() => formatJson(key)} className="text-xs text-violet-500 hover:text-violet-400 px-2 py-0.5 rounded border border-violet-300 dark:border-violet-700">Format</button>
            <button type="button" onClick={() => { try { JSON.parse(se(key)); flash('Valid JSON ✓'); } catch (e: any) { flash(`Invalid: ${e.message}`, true); } }} className="text-xs text-green-600 hover:text-green-500 px-2 py-0.5 rounded border border-green-300 dark:border-green-700">Validate</button>
          </div>
        )}
      </div>
      {type === 'json' ? (
        <textarea value={se(key)} onChange={e => setse(key, e.target.value)} rows={12} className={`w-full resize-y font-mono text-xs leading-relaxed ${inp}`} />
      ) : type === 'textarea' ? (
        <textarea value={se(key)} onChange={e => setse(key, e.target.value)} rows={3} className={`w-full resize-none ${inp}`} />
      ) : type === 'color' ? (
        <div className="flex gap-2 items-center">
          <input type="color" value={se(key) || '#3791E5'} onChange={e => setse(key, e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-gray-300 dark:border-gray-700 p-0.5 bg-transparent" />
          <input value={se(key)} onChange={e => setse(key, e.target.value)} className={`flex-1 ${inp}`} placeholder="#xxxxxx" />
        </div>
      ) : (
        <input value={se(key)} onChange={e => setse(key, e.target.value)} className={`w-full ${inp}`} />
      )}
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-950 flex overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
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

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-gray-900 dark:text-white font-semibold">{TABS.find(t => t.id === tab)?.label}</h1>
          <div className="flex gap-2 items-center">
            {msg   && <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1"><Check size={14}/>{msg}</span>}
            {error && <span className="text-red-600   dark:text-red-400   text-sm flex items-center gap-1"><X     size={14}/>{error}</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-950">

          {/* ═══ DASHBOARD ═══════════════════════════════════════════════════ */}
          {tab === 'dashboard' && stats && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: 'Total Users',   value: stats.totalUsers,       color: 'from-blue-600 to-blue-700' },
                  { label: 'Active Jobs',   value: stats.totalJobs,        color: 'from-violet-600 to-violet-700' },
                  { label: 'Applications', value: stats.totalApplications, color: 'from-orange-500 to-orange-600' },
                  { label: 'Hired',         value: stats.hired,            color: 'from-green-600 to-green-700' },
                  { label: 'HR Roles',      value: stats.hrRoles,          color: 'from-teal-600 to-teal-700' },
                  { label: 'Gallery Items', value: stats.galleryItems,     color: 'from-pink-600 to-pink-700' },
                ].map(s => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white`}>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${card} p-5`}>
                  <h3 className={`${ttl} mb-3`}>Quick Access</h3>
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
                  <h3 className={`${ttl} mb-3`}>System Access</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Role</span><span className="text-violet-500 font-medium">Super Admin</span></div>
                    <div className="flex justify-between text-gray-500"><span>Email</span><span className="text-gray-700 dark:text-gray-300">{user?.email}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Access</span><span className="text-green-600 dark:text-green-400">Full System Control</span></div>
                    <div className="flex justify-between text-gray-500"><span>HR Roles Defined</span><span className="text-gray-700 dark:text-gray-300">{stats.hrRoles}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ JOBS ════════════════════════════════════════════════════════ */}
          {tab === 'jobs' && (
            <div>
              <div className="flex gap-3 mb-4">
                <input value={jobSearch} onChange={e => setJobSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadJobs(1)}
                  placeholder="Search jobs…" className={`flex-1 ${inp}`} />
                <button onClick={() => loadJobs(1)} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">Search</button>
              </div>
              <p className={`${muted} text-sm mb-3`}>{jobTotal} total jobs</p>
              <div className="space-y-2">
                {jobs.map(j => (
                  <div key={j.id} className={`${card} p-4 flex items-center gap-4 ${!j.is_active ? 'border-red-300 dark:border-red-900/40' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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

          {/* ═══ USERS ═══════════════════════════════════════════════════════ */}
          {tab === 'users' && (
            <div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()}
                  placeholder="Search users…" className={`flex-1 min-w-40 ${inp}`} />
                <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={inp}>
                  <option value="">All Roles</option>
                  {['jobseeker','employer','hr','super_admin'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => loadUsers()} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">Search</button>
                <button onClick={() => setShowCreateHR(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                  <Plus size={14} /> Create HR
                </button>
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

              {showCreateHR && (
                <div className={`${card} border-emerald-300 dark:border-emerald-700/40 p-5 mb-4`}>
                  <h3 className={`${ttl} mb-3`}>Create HR User</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Full Name" value={hrForm.name} onChange={e => setHrForm(p => ({ ...p, name: e.target.value }))} className={inp} />
                    <input placeholder="Email" value={hrForm.email} onChange={e => setHrForm(p => ({ ...p, email: e.target.value }))} className={inp} />
                    <div className="relative">
                      <input type={showHrPw ? 'text' : 'password'} placeholder="Password" value={hrForm.password} onChange={e => setHrForm(p => ({ ...p, password: e.target.value }))} className={`w-full pr-8 ${inp}`} />
                      <button type="button" onClick={() => setShowHrPw(!showHrPw)} className="absolute right-2 top-2 text-gray-400">{showHrPw ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                    </div>
                    <input placeholder="Phone (optional)" value={hrForm.phone} onChange={e => setHrForm(p => ({ ...p, phone: e.target.value }))} className={inp} />
                    <select value={hrForm.hr_role_id} onChange={e => setHrForm(p => ({ ...p, hr_role_id: e.target.value }))} className={`col-span-2 ${inp}`}>
                      <option value="">No Role (assign later)</option>
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
                          <button onClick={() => deleteUser(u.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={15}/></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {usersView === 'credentials' && (
                <div className={`${card} overflow-hidden`}>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/40 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-300 text-xs font-medium">Sensitive view — stored passwords are encrypted. Do not share this screen.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                          {['ID','Name','Login Email','Role','HR Role','Set Password'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                            <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">#{u.id}</td>
                            <td className="px-4 py-2.5"><p className="text-gray-900 dark:text-white font-medium text-sm">{u.name}</p></td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{u.email}</span>
                                <button onClick={() => copyToClipboard(u.email)} className="text-gray-400 hover:text-violet-500"><Copy size={11}/></button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.role === 'super_admin' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' : u.role === 'hr' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{u.role}</span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-violet-500">{u.hr_role_name || '—'}</td>
                            <td className="px-4 py-2.5">
                              {pwUserId === u.id ? (
                                <div className="flex items-center gap-1">
                                  <div className="relative">
                                    <input type={showPwValue ? 'text' : 'password'} value={pwValue} onChange={e => setPwValue(e.target.value)}
                                      placeholder="New password" className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs w-32 pr-6 text-gray-900 dark:text-white" />
                                    <button type="button" onClick={() => setShowPwValue(v => !v)} className="absolute right-1.5 top-1.5 text-gray-400">{showPwValue ? <EyeOff size={11}/> : <Eye size={11}/>}</button>
                                  </div>
                                  <button onClick={saveUserPassword} disabled={pwSaving || !pwValue} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs">{pwSaving ? '…' : 'Set'}</button>
                                  <button onClick={() => setPwUserId(null)} className="text-gray-400 p-1"><X size={12}/></button>
                                </div>
                              ) : (
                                <button onClick={() => { setPwUserId(u.id); setPwValue(''); setShowPwValue(false); }}
                                  className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700">
                                  <KeyRound size={11}/> Set Password
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

              {pwUserId !== null && usersView === 'list' && (
                <div className={`${card} border-amber-300 dark:border-amber-700/40 p-4 mt-3 flex items-center gap-3`}>
                  <KeyRound size={16} className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Set new password for <strong>{users.find(u => u.id === pwUserId)?.name}</strong></p>
                  <div className="relative flex-1 max-w-xs">
                    <input type={showPwValue ? 'text' : 'password'} value={pwValue} onChange={e => setPwValue(e.target.value)}
                      placeholder="New password (min 6 chars)" className={`w-full pr-8 ${inp}`} />
                    <button type="button" onClick={() => setShowPwValue(v => !v)} className="absolute right-2 top-2 text-gray-400">{showPwValue ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                  </div>
                  <button onClick={saveUserPassword} disabled={pwSaving || !pwValue} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm">{pwSaving ? 'Saving…' : 'Update'}</button>
                  <button onClick={() => { setPwUserId(null); setPwValue(''); }} className="text-gray-400"><X size={16}/></button>
                </div>
              )}
            </div>
          )}

          {/* ═══ ROLES & PERMISSIONS ════════════════════════════════════════ */}
          {tab === 'hr-roles' && (
            <div>
              {/* Hierarchy thread */}
              <div className={`${card} p-5 mb-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch size={16} className="text-violet-500" />
                  <h3 className={ttl}>Role Hierarchy</h3>
                  <span className={`text-xs ${muted}`}>— Thread view showing parent → child chains</span>
                </div>
                {/* Root: Super Admin */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Crown size={14} className="text-white" />
                  </div>
                  <div>
                    <span className="text-yellow-700 dark:text-yellow-400 font-bold text-sm">Super Admin</span>
                    <span className={`text-xs ${muted} ml-2`}>Full system access · Cannot be restricted</span>
                  </div>
                </div>
                {hrRoles.length === 0 ? (
                  <p className={`${muted} text-sm ml-10`}>No HR roles yet. Create one using the form below.</p>
                ) : (
                  <div className="ml-4 border-l-2 border-violet-200 dark:border-violet-800/50 pl-5 space-y-2">
                    {buildRoleTree(hrRoles).map(({ role: r, depth }) => (
                      <div key={r.id} style={{ marginLeft: depth * 20 }} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${r.color || '#6366f1'}22`, border: `2px solid ${r.color || '#6366f1'}` }}>
                          <ShieldCheck size={12} style={{ color: r.color || '#6366f1' }} />
                        </div>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">{r.name}</span>
                        {r.parent_role_name && <span className={`text-xs ${muted}`}>← {r.parent_role_name}</span>}
                        <span className="text-xs text-violet-500 ml-auto">
                          {(r.permissions || []).length} perm · {r.assigned_count} user{r.assigned_count !== 1 ? 's' : ''}
                        </span>
                        <button onClick={() => { setEditingRole(r); setRoleForm({ name: r.name, description: r.description || '', permissions: r.permissions || [], parent_role_id: r.parent_role_id || '', color: r.color || '#6366f1' }); }}
                          className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"><Edit2 size={12}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create / Edit Role form */}
                <div className={`${card} p-5`}>
                  <h3 className={`${ttl} mb-4`}>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>

                  <div className="space-y-3 mb-5">
                    <div>
                      <label className={lbl}>Role Name *</label>
                      <input placeholder="e.g. Assessment Coordinator" value={roleForm.name}
                        onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} className={`w-full ${inp}`} />
                    </div>
                    <div>
                      <label className={lbl}>Description</label>
                      <textarea placeholder="What can this role do?" value={roleForm.description}
                        onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))}
                        rows={2} className={`w-full resize-none ${inp}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lbl}>Reports To (Parent Role)</label>
                        <select value={String(roleForm.parent_role_id)}
                          onChange={e => setRoleForm(p => ({ ...p, parent_role_id: e.target.value }))}
                          className={`w-full ${inp}`}>
                          <option value="">— Direct under Super Admin</option>
                          {hrRoles.filter(r => !editingRole || r.id !== editingRole.id).map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Role Colour</label>
                        <div className="flex gap-2">
                          <input type="color" value={roleForm.color} onChange={e => setRoleForm(p => ({ ...p, color: e.target.value }))}
                            className="w-10 h-9 rounded cursor-pointer border border-gray-300 dark:border-gray-700 p-0.5 bg-transparent" />
                          <input value={roleForm.color} onChange={e => setRoleForm(p => ({ ...p, color: e.target.value }))}
                            className={`flex-1 ${inp}`} placeholder="#6366f1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module-grouped permissions */}
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Module Permissions
                  </p>
                  <div className="space-y-2 mb-5">
                    {PERMISSION_GROUPS.map(g => {
                      const keys = g.permissions.map(p => p.key);
                      const allOn  = keys.every(k => roleForm.permissions.includes(k));
                      const someOn = keys.some(k => roleForm.permissions.includes(k));
                      return (
                        <div key={g.group} className={`rounded-lg border p-3 ${GROUP_COLORS[g.color]}`}>
                          <label className="flex items-center gap-2 cursor-pointer mb-2 select-none">
                            <input type="checkbox" checked={allOn}
                              ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                              onChange={() => toggleGroup(keys)} className="accent-violet-600" />
                            <span className="font-semibold text-sm">{g.group}</span>
                            <span className="text-xs opacity-60 ml-auto">{keys.filter(k => roleForm.permissions.includes(k)).length}/{keys.length}</span>
                          </label>
                          <div className="space-y-1.5 ml-5">
                            {g.permissions.map(p => (
                              <label key={p.key} className="flex items-start gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={roleForm.permissions.includes(p.key)}
                                  onChange={() => togglePermission(p.key)} className="mt-0.5 accent-violet-600" />
                                <div>
                                  <p className="text-sm text-gray-800 dark:text-gray-200">{p.label}</p>
                                  <p className="text-xs opacity-60">{p.desc}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={saveRole} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </button>
                    {editingRole && (
                      <button onClick={() => { setEditingRole(null); setRoleForm({ name: '', description: '', permissions: [], parent_role_id: '', color: '#6366f1' }); }}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
                    )}
                  </div>
                </div>

                {/* Existing roles list */}
                <div className="space-y-3">
                  {hrRoles.length === 0 && <p className={`${muted} text-sm`}>No roles yet. Create one to get started.</p>}
                  {hrRoles.map(r => (
                    <div key={r.id} className={`${card} p-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${r.color || '#6366f1'}22`, border: `2px solid ${r.color || '#6366f1'}` }}>
                            <ShieldCheck size={15} style={{ color: r.color || '#6366f1' }} />
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-semibold text-sm">{r.name}</p>
                            {r.description && <p className={`${muted} text-xs`}>{r.description}</p>}
                            <p className="text-violet-500 text-xs mt-0.5">
                              {r.assigned_count} user{r.assigned_count !== 1 ? 's' : ''} · {(r.permissions || []).length} permission{(r.permissions || []).length !== 1 ? 's' : ''}
                              {r.parent_role_name && <span className={`${muted} ml-1`}>· reports to {r.parent_role_name}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingRole(r); setRoleForm({ name: r.name, description: r.description || '', permissions: r.permissions || [], parent_role_id: r.parent_role_id || '', color: r.color || '#6366f1' }); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"><Edit2 size={14}/></button>
                          <button onClick={() => deleteRole(r.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-11">
                        {(r.permissions || []).map((p: string) => (
                          <span key={p} className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">
                            {PERMISSIONS.find(x => x.key === p)?.label || p}
                          </span>
                        ))}
                        {(r.permissions || []).length === 0 && <span className={`text-xs ${muted}`}>No permissions assigned</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ GALLERY ═════════════════════════════════════════════════════ */}
          {tab === 'gallery' && (
            <div>
              <div className={`${card} p-5 mb-5`}>
                <h3 className={`${ttl} mb-3`}>{editingGallery ? 'Edit Gallery Item' : 'Add Gallery Item'}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input placeholder="Title *" value={galleryForm.title} onChange={e => setGalleryForm(p => ({ ...p, title: e.target.value }))} className={inp} />
                  <input placeholder="Category (e.g. events, awards)" value={galleryForm.category} onChange={e => setGalleryForm(p => ({ ...p, category: e.target.value }))} className={inp} />
                  <textarea placeholder="Description" value={galleryForm.description} onChange={e => setGalleryForm(p => ({ ...p, description: e.target.value }))} rows={2} className={`resize-none col-span-2 ${inp}`} />
                  <input ref={galleryRef} type="file" accept="image/*" onChange={e => setGalleryFile(e.target.files?.[0] || null)} className={`col-span-2 ${inp}`} />
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
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400"><Image size={24}/></div>
                    )}
                    <div className="p-3">
                      <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{g.title}</p>
                      <p className={`${muted} text-xs`}>{g.category}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <button onClick={() => moveGallery(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp size={14}/></button>
                        <button onClick={() => moveGallery(idx, 1)} disabled={idx === gallery.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown size={14}/></button>
                        <button onClick={() => { setEditingGallery(g); setGalleryForm({ title: g.title, description: g.description || '', category: g.category, display_order: String(g.display_order) }); }} className="p-1 text-blue-500 ml-auto"><Edit2 size={14}/></button>
                        <button onClick={() => deleteGallery(g.id)} className="p-1 text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <p className={`${muted} text-sm col-span-full`}>No gallery items yet.</p>}
              </div>
            </div>
          )}

          {/* ═══ BOARDS ══════════════════════════════════════════════════════ */}
          {tab === 'boards' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {boards.map((b, idx) => (
                  <div key={b.id} className={`${card} p-4 flex items-center gap-4`}>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveBoard(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronUp size={14}/></button>
                      <button onClick={() => moveBoard(idx, 1)} disabled={idx === boards.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronDown size={14}/></button>
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
                    <button onClick={() => startEditBoard(b)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={14}/></button>
                  </div>
                ))}
              </div>
              {editingBoard && (
                <div className={`${card} border-violet-300 dark:border-violet-700/40 p-5`}>
                  <h3 className={`${ttl} mb-3`}>Edit: {editingBoard.code}</h3>
                  <div className="space-y-3">
                    <input placeholder="Display Name" value={boardForm.name} onChange={e => setBoardForm((p: any) => ({ ...p, name: e.target.value }))} className={`w-full ${inp}`} />
                    <input placeholder="Full Name" value={boardForm.full_name} onChange={e => setBoardForm((p: any) => ({ ...p, full_name: e.target.value }))} className={`w-full ${inp}`} />
                    <textarea placeholder="Description" value={boardForm.description} onChange={e => setBoardForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} className={`w-full resize-none ${inp}`} />
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={lbl}>Colour</label><input placeholder="#1a56db" value={boardForm.color} onChange={e => setBoardForm((p: any) => ({ ...p, color: e.target.value }))} className={`w-full ${inp}`} /></div>
                      <div><label className={lbl}>Visibility</label>
                        <select value={boardForm.is_active} onChange={e => setBoardForm((p: any) => ({ ...p, is_active: e.target.value }))} className={`w-full ${inp}`}>
                          <option value="1">Visible</option>
                          <option value="0">Hidden</option>
                        </select>
                      </div>
                    </div>
                    <div><label className={lbl}>Board Image (optional)</label><input ref={boardRef} type="file" accept="image/*" onChange={e => setBoardFile(e.target.files?.[0] || null)} className={`w-full ${inp}`} /></div>
                    <div className="flex gap-2">
                      <button onClick={saveBoard} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm">Save Board</button>
                      <button onClick={() => setEditingBoard(null)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ FOOTER EDITOR ══════════════════════════════════════════════ */}
          {tab === 'footer' && (
            <div className="space-y-6">
              <div className={`${card} p-4 border-l-4 border-violet-500`}>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  All changes here update the public-facing footer immediately after you click <strong>Save Footer</strong>. No code editing required.
                </p>
              </div>

              {/* Social media */}
              <div className={`${card} p-5`}>
                <h3 className={`${ttl} mb-1`}>Social Media Links</h3>
                <p className={`${muted} text-xs mb-4`}>Leave blank to hide that icon from the footer. Use the full URL including https://</p>
                <div className="space-y-3">
                  {[
                    { key: 'footer_linkedin',  label: 'LinkedIn',   bg: 'bg-blue-600',  icon: '🔗', ph: 'https://linkedin.com/company/...' },
                    { key: 'footer_twitter',   label: 'Twitter / X',bg: 'bg-gray-800',  icon: '𝕏',  ph: 'https://twitter.com/...' },
                    { key: 'footer_instagram', label: 'Instagram',  bg: 'bg-pink-600',  icon: '📷', ph: 'https://instagram.com/...' },
                    { key: 'footer_facebook',  label: 'Facebook',   bg: 'bg-blue-700',  icon: '👍', ph: 'https://facebook.com/...' },
                    { key: 'footer_youtube',   label: 'YouTube',    bg: 'bg-red-600',   icon: '▶',  ph: 'https://youtube.com/@...' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center text-white text-sm flex-shrink-0`}>{s.icon}</div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 flex-shrink-0">{s.label}</label>
                      <input value={se(s.key)} onChange={e => setse(s.key, e.target.value)} placeholder={s.ph} className={`flex-1 ${inp}`} />
                      {se(s.key) && <a href={se(s.key)} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-500 hover:text-violet-400 flex-shrink-0">Preview ↗</a>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className={`${card} p-5`}>
                <h3 className={`${ttl} mb-4`}>Contact Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`${lbl} flex items-center gap-1`}><Mail size={11}/> General Email</label>
                      <input value={se('footer_email')} onChange={e => setse('footer_email', e.target.value)} placeholder="info@qcin.org" className={`w-full ${inp}`} />
                    </div>
                    <div>
                      <label className={`${lbl} flex items-center gap-1`}><Phone size={11}/> Phone Number</label>
                      <input value={se('footer_phone')} onChange={e => setse('footer_phone', e.target.value)} placeholder="011-..." className={`w-full ${inp}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`${lbl} flex items-center gap-1`}><MapPin size={11}/> Office Address</label>
                    <textarea value={se('footer_address')} onChange={e => setse('footer_address', e.target.value)} rows={2} className={`w-full resize-none ${inp}`} />
                  </div>
                  <div>
                    <label className={`${lbl} flex items-center gap-1`}><Globe size={11}/> About Text (shown in footer)</label>
                    <textarea value={se('footer_about')} onChange={e => setse('footer_about', e.target.value)} rows={4} className={`w-full resize-none ${inp}`} />
                  </div>
                </div>
              </div>

              {/* Bottom bar text */}
              <div className={`${card} p-5`}>
                <h3 className={`${ttl} mb-4`}>Bottom Bar</h3>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Copyright Text <span className="text-gray-400">(leave blank to auto-generate)</span></label>
                    <input value={se('footer_copyright')} onChange={e => setse('footer_copyright', e.target.value)}
                      placeholder={`© ${new Date().getFullYear()} Quality Council of India. All rights reserved.`} className={`w-full ${inp}`} />
                  </div>
                  <div>
                    <label className={lbl}>Tagline <span className="text-gray-400">(shown in italics next to copyright)</span></label>
                    <input value={se('footer_tagline')} onChange={e => setse('footer_tagline', e.target.value)}
                      placeholder="Creating an Ecosystem for Quality" className={`w-full ${inp}`} />
                  </div>
                </div>
              </div>

              {/* Regional offices */}
              <div className={`${card} p-5`}>
                <h3 className={`${ttl} mb-1`}>Regional Offices</h3>
                <p className={`${muted} text-xs mb-3`}>JSON array — each item needs: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">city</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">addr</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">phone</code></p>
                <div className="flex gap-1 mb-2">
                  <button onClick={() => formatJson('footer_regional_offices')} className="text-xs text-violet-500 hover:text-violet-400 px-2 py-0.5 rounded border border-violet-300 dark:border-violet-700">Format</button>
                  <button onClick={() => { try { JSON.parse(se('footer_regional_offices')); flash('Valid JSON ✓'); } catch (e: any) { flash(`Invalid: ${e.message}`, true); } }} className="text-xs text-green-600 hover:text-green-500 px-2 py-0.5 rounded border border-green-300 dark:border-green-700">Validate</button>
                </div>
                <textarea value={se('footer_regional_offices')} onChange={e => setse('footer_regional_offices', e.target.value)} rows={10} className={`w-full resize-y font-mono text-xs ${inp}`} />
              </div>

              {/* Navigation columns */}
              <div className={`${card} p-5`}>
                <h3 className={`${ttl} mb-1`}>Navigation Columns</h3>
                <p className={`${muted} text-xs mb-4`}>Each column is a JSON array of links. Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">"to"</code> for internal pages, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">"href"</code> for external URLs.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { key: 'footer_links_who',  label: 'Who We Are' },
                    { key: 'footer_links_org',  label: 'The Organisation' },
                    { key: 'footer_links_work', label: 'Work With Us' },
                    { key: 'footer_links_gov',  label: 'Governance' },
                  ].map(col => (
                    <div key={col.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`${lbl} mb-0`}>{col.label}</label>
                        <div className="flex gap-1">
                          <button onClick={() => formatJson(col.key)} className="text-xs text-violet-500 hover:text-violet-400 px-1.5 py-0.5 rounded border border-violet-300 dark:border-violet-700">Fmt</button>
                          <button onClick={() => { try { JSON.parse(se(col.key)); flash('Valid ✓'); } catch (e: any) { flash(`Invalid: ${e.message}`, true); } }} className="text-xs text-green-600 hover:text-green-500 px-1.5 py-0.5 rounded border border-green-300 dark:border-green-700">Chk</button>
                        </div>
                      </div>
                      <textarea value={se(col.key)} onChange={e => setse(col.key, e.target.value)} rows={8} className={`w-full resize-y font-mono text-xs ${inp}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={saveSettings} disabled={settingsSaving}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                  {settingsSaving ? 'Saving…' : 'Save Footer'}
                </button>
                <p className={`${muted} text-xs`}>Changes apply site-wide immediately after saving.</p>
              </div>
            </div>
          )}

          {/* ═══ SETTINGS ═══════════════════════════════════════════════════ */}
          {tab === 'settings' && (() => (
            <div>
              <div className="flex gap-1 mb-6 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 w-fit flex-wrap">
                {([
                  { id: 'general', label: 'General' },
                  { id: 'home',    label: 'Home Page' },
                  { id: 'about',   label: 'About Page' },
                  { id: 'contact', label: 'Contact' },
                ] as const).map(p => (
                  <button key={p.id} onClick={() => setSettingsPage(p.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${settingsPage === p.id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {siteSettings.length === 0 && (
                <div className={`${card} p-5`}><p className={`${muted} text-sm`}>Loading settings…</p></div>
              )}

              {siteSettings.length > 0 && (
                <>
                  {settingsPage === 'general' && (
                    <div className="space-y-5">
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Site Identity</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {sf('site_name',       'Site Name',        'text')}
                          {sf('site_tagline',    'Site Tagline',     'text')}
                          {sf('default_company', 'Default Company',  'text')}
                          {sf('default_location','Default Location', 'text')}
                          {sf('currency_symbol', 'Currency Symbol',  'text')}
                          {sf('primary_color',   'Primary Colour',   'color')}
                        </div>
                      </div>
                      <div className={`${card} p-4 border-l-4 border-blue-400 flex items-center gap-3`}>
                        <PanelBottom size={16} className="text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Footer settings (social links, contact info, navigation columns) are in the{' '}
                          <button onClick={() => setTab('footer')} className="text-violet-600 dark:text-violet-400 underline font-medium">Footer Editor</button> tab.
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsPage === 'home' && (
                    <div className="space-y-5">
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Hero Section</h3>
                        <div className="space-y-3">
                          {sf('home_hero_badge',        'Hero Badge',        'text', 'Short banner above the main headline')}
                          <div className="grid grid-cols-2 gap-4">
                            {sf('home_hero_title_1', 'Headline Line 1', 'text')}
                            {sf('home_hero_title_2', 'Headline Line 2', 'text')}
                          </div>
                          {sf('home_hero_subtitle',     'Hero Subtitle',     'textarea')}
                          {sf('home_search_placeholder','Search Placeholder','text')}
                        </div>
                      </div>
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Impact Stats</h3>
                        <div className="space-y-4">
                          {([1,2,3,4] as const).map(n => (
                            <div key={n}>
                              <p className="text-xs text-violet-500 font-semibold mb-2 uppercase tracking-wider">Stat {n}</p>
                              <div className="grid grid-cols-3 gap-3">
                                {sf(`home_stat${n}_value`, 'Value',    'text')}
                                {sf(`home_stat${n}_label`, 'Label',    'text')}
                                {sf(`home_stat${n}_sub`,   'Sub-text', 'text')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Announcements</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: tag, date, title, desc, color, href</p>{sf('home_announcements','Announcements JSON','json')}</div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Events</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: emoji, type, month, year, title, location, desc</p>{sf('home_events','Events JSON','json')}</div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Initiatives</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: emoji, tag, title, desc, badges, gradient, href</p>{sf('home_initiatives','Initiatives JSON','json')}</div>
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Call To Action</h3>
                        <div className="space-y-3">
                          {sf('home_cta_title',    'CTA Title',    'text')}
                          {sf('home_cta_subtitle', 'CTA Subtitle', 'textarea')}
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsPage === 'about' && (
                    <div className="space-y-5">
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Hero Section</h3>
                        <div className="space-y-3">
                          {sf('about_hero_badge',    'Hero Badge',    'text')}
                          {sf('about_hero_title',    'Hero Title',    'text')}
                          {sf('about_hero_subtitle', 'Hero Subtitle', 'textarea')}
                        </div>
                      </div>
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Stats</h3>
                        <div className="space-y-4">
                          {([1,2,3,4] as const).map(n => (
                            <div key={n}>
                              <p className="text-xs text-violet-500 font-semibold mb-2 uppercase tracking-wider">Stat {n}</p>
                              <div className="grid grid-cols-2 gap-3">
                                {sf(`about_stat${n}_value`, 'Value', 'text')}
                                {sf(`about_stat${n}_label`, 'Label', 'text')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`${card} p-5`}>
                        <h3 className={`${ttl} mb-4`}>Mission, Vision & PPP</h3>
                        <div className="space-y-3">
                          {sf('about_mission',  'Mission Statement', 'textarea')}
                          {sf('about_vision',   'Vision Statement',  'textarea')}
                          {sf('about_ppp_note', 'PPP Note',          'textarea')}
                        </div>
                      </div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Leadership Team</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: name, title, initials, gradient, photo (URL), quote</p>{sf('about_leaders','Leadership JSON','json')}</div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Board Chairs</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: name, title, initials, gradient, board, tag, photo (URL)</p>{sf('about_board_chairs','Board Chairs JSON','json')}</div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Milestones</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: year, event</p>{sf('about_milestones','Milestones JSON','json')}</div>
                      <div className={`${card} p-5`}><h3 className={`${ttl} mb-1`}>Testimonials</h3><p className={`${muted} text-xs mb-3`}>JSON array — each item: name, role, tenure, initials, gradient, quote</p>{sf('about_testimonials','Testimonials JSON','json')}</div>
                    </div>
                  )}

                  {settingsPage === 'contact' && (
                    <div className={`${card} p-5`}>
                      <h3 className={`${ttl} mb-4`}>Contact Details</h3>
                      <div className="space-y-3">
                        {sf('contact_address', 'Office Address', 'textarea')}
                        <div className="grid grid-cols-2 gap-4">
                          {sf('contact_phone',         'Phone',              'text')}
                          {sf('contact_hours',         'Office Hours',       'text')}
                          {sf('contact_email_general', 'General Email',      'text')}
                          {sf('contact_email_hr',      'HR / Careers Email', 'text')}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center gap-4">
                    <button onClick={saveSettings} disabled={settingsSaving}
                      className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                      {settingsSaving ? 'Saving…' : 'Save All Settings'}
                    </button>
                    <p className={`${muted} text-xs`}>Changes apply site-wide immediately.</p>
                  </div>
                </>
              )}
            </div>
          ))()}

        </div>
      </div>
    </div>
  );
}
