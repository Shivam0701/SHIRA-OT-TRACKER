import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Clock, History, Sun, Moon, LogOut, Calculator, User, ShieldCheck, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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

// ── User Sidebar ──────────────────────────────────────────────────────────────
function UserSidebar() {
  const navItems = [
    { to: '/',           icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/tracker',    icon: <Clock size={17} />,           label: 'OT Tracker' },
    { to: '/history',    icon: <History size={17} />,         label: 'History' },
    { to: '/calculator', icon: <Calculator size={17} />,      label: 'Salary Calc' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">⏱ SHIRA OT</div>
        <div className="sidebar-logo-sub">Overtime Tracker</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {icon}{label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ── Admin Sidebar ─────────────────────────────────────────────────────────────
function AdminSidebar() {
  const navItems = [
    { to: '/admin',       icon: <ShieldCheck size={17} />, label: 'Dashboard' },
    { to: '/admin/users', icon: <Users size={17} />,       label: 'Users' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">⏱ SHIRA OT</div>
        <div className="sidebar-logo-sub" style={{ color: 'var(--primary)', fontWeight: 700 }}>Admin</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            {icon}{label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ theme, onThemeToggle, pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <span className="header-title">{pageTitle}</span>
      <div className="header-actions">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <User size={14} />
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{user.name}</span>
            {user.role === 'admin' && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                Admin
              </span>
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
  const pageTitle = ADMIN_TITLES[location.pathname] || 'Admin';

  return (
    <div className="app-layout">
      <AdminSidebar />
      <div className="main-content">
        <Header theme={theme} onThemeToggle={onThemeToggle} pageTitle={pageTitle} />
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
  const pageTitle = USER_TITLES[location.pathname] || 'SHIRA OT Tracker';

  return (
    <div className="app-layout">
      <UserSidebar />
      <div className="main-content">
        <Header theme={theme} onThemeToggle={onThemeToggle} pageTitle={pageTitle} />
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
      </Routes>
    </>
  );
}

// ── Root router ───────────────────────────────────────────────────────────────
const AUTH_PATHS = ['/login', '/register', '/auth/callback', '/complete-profile'];

function RootRouter({ theme, onThemeToggle }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (AUTH_PATHS.includes(path)) return <AuthShell theme={theme} onThemeToggle={onThemeToggle} />;

  // While auth is loading, show nothing (ProtectedRoute handles spinner)
  if (loading) return <UserShell theme={theme} onThemeToggle={onThemeToggle} />;

  // Admin gets admin shell, redirect / to /admin
  if (user?.role === 'admin') {
    if (path === '/') return <Navigate to="/admin" replace />;
    return <AdminShell theme={theme} onThemeToggle={onThemeToggle} />;
  }

  // Regular users get user shell, redirect /admin to /
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
