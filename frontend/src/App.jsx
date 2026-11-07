import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Clock, History, Sun, Moon, LogOut, Calculator, User, ShieldCheck, Users, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Logo from './components/Logo.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tracker from './pages/Tracker.jsx';
import OTHistory from './pages/OTHistory.jsx';
import OTCalculator from './pages/Calculator.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import GoogleCallback from './pages/GoogleCallback.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

// ── Shared brand block ────────────────────────────────────────────────────────
function SidebarBrand({ isAdmin }) {
  return (
    <div className="sidebar-logo">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <img src="/logo.svg" alt="SHIRA OT" width={44} height={44} style={{ borderRadius: 8, display: 'block' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="sidebar-brand-name">SHIRA OT</div>
          <div className={`sidebar-brand-sub${isAdmin ? ' admin' : ''}`}>
            {isAdmin ? 'Admin Panel' : 'Overtime Tracker'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── User Sidebar ──────────────────────────────────────────────────────────────
function UserSidebar({ open, onClose }) {
  const navItems = [
    { to: '/',           icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/tracker',    icon: <Clock size={17} />,           label: 'OT Tracker' },
    { to: '/history',    icon: <History size={17} />,         label: 'History' },
    { to: '/calculator', icon: <Calculator size={17} />,      label: 'Salary Calc' },
  ];
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <SidebarBrand isAdmin={false} />
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

// ── Admin Sidebar ─────────────────────────────────────────────────────────────
function AdminSidebar({ open, onClose }) {
  const navItems = [
    { to: '/admin',       icon: <ShieldCheck size={17} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <Users size={17} />,       label: 'Users' },
  ];
  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <SidebarBrand isAdmin={true} />
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={onClose}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ theme, onThemeToggle, pageTitle, onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Hamburger — mobile only */}
        <button className="menu-btn" onClick={onMenuToggle} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <span className="header-title">{pageTitle}</span>
      </div>
      <div className="header-actions">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <User size={14} />
            <span style={{ fontWeight: 600, color: 'var(--text)' }} className="header-username">{user.name}</span>
            {user.role === 'admin' && (
              <span className="admin-badge">Admin</span>
            )}
          </div>
        )}
        <button className="theme-toggle" onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {user && (
          <button className="theme-toggle" onClick={handleLogout} title="Sign out"
            style={{ color: 'var(--danger)' }}>
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}

// ── Admin shell ───────────────────────────────────────────────────────────────
const ADMIN_TITLES = {
  '/admin':       'Admin Dashboard',
  '/admin/users': 'User Management',
};

function AdminShell({ theme, onThemeToggle }) {
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = ADMIN_TITLES[location.pathname] || 'Admin';

  // Close on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <div className="app-layout">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-content">
        <Header theme={theme} onThemeToggle={onThemeToggle} pageTitle={pageTitle} onMenuToggle={() => setMenuOpen(o => !o)} />
        <main className="page-body">
          <Routes>
            <Route path="/admin"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </main>
        <footer className="footer">
          Made by&nbsp;<a href="https://shiraai.in" target="_blank" rel="noopener noreferrer">SHIRA AI</a>
        </footer>
      </div>
    </div>
  );
}

// ── User shell ────────────────────────────────────────────────────────────────
const USER_TITLES = {
  '/':           'Dashboard',
  '/tracker':    'OT Tracker',
  '/history':    'OT History',
  '/calculator': 'Salary Calculator',
};

function UserShell({ theme, onThemeToggle }) {
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = USER_TITLES[location.pathname] || 'SHIRA OT Tracker';

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <div className="app-layout">
      <UserSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-content">
        <Header theme={theme} onThemeToggle={onThemeToggle} pageTitle={pageTitle} onMenuToggle={() => setMenuOpen(o => !o)} />
        <main className="page-body">
          <Routes>
            <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tracker"    element={<ProtectedRoute><Tracker /></ProtectedRoute>} />
            <Route path="/history"    element={<ProtectedRoute><OTHistory /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><OTCalculator /></ProtectedRoute>} />
          </Routes>
        </main>
        <footer className="footer">
          Made by&nbsp;<a href="https://shiraai.in" target="_blank" rel="noopener noreferrer">SHIRA AI</a>
        </footer>
      </div>
    </div>
  );
}

// ── Auth shell ────────────────────────────────────────────────────────────────
function AuthShell({ theme, onThemeToggle }) {
  return (
    <>
      <button className="theme-toggle auth-theme-btn" onClick={onThemeToggle}
        style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 999 }}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <Routes>
        <Route path="/login"            element={<Login />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/auth/callback"    element={<GoogleCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
      </Routes>
    </>
  );
}

// ── Root router ───────────────────────────────────────────────────────────────
const AUTH_PATHS = ['/login', '/register', '/auth/callback', '/complete-profile', '/forgot-password', '/reset-password'];

function RootRouter({ theme, onThemeToggle }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (AUTH_PATHS.includes(path)) return <AuthShell theme={theme} onThemeToggle={onThemeToggle} />;
  if (loading) return <UserShell theme={theme} onThemeToggle={onThemeToggle} />;

  if (user?.role === 'admin') {
    if (path === '/') return <Navigate to="/admin" replace />;
    return <AdminShell theme={theme} onThemeToggle={onThemeToggle} />;
  }

  if (path.startsWith('/admin')) return <Navigate to="/" replace />;
  return <UserShell theme={theme} onThemeToggle={onThemeToggle} />;
}

// ── Theme init ────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('ot-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

export default function App() {
  const [theme, setTheme] = useState(savedTheme);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ot-theme', next);
      return next;
    });
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <RootRouter theme={theme} onThemeToggle={toggleTheme} />
      </AuthProvider>
    </BrowserRouter>
  );
}
