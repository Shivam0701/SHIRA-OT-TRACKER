import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock, History, Sun, Moon, LogOut, Calculator, User } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tracker from './pages/Tracker.jsx';
import OTHistory from './pages/OTHistory.jsx';
import OTCalculator from './pages/Calculator.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ onClose }) {
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
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onClose}>
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

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/tracker':    'OT Tracker',
  '/history':    'OT History',
  '/calculator': 'Salary Calculator',
};

// ── App shell (authenticated layout) ─────────────────────────────────────────
function AppShell() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('ot-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ot-theme', theme);
  }, [theme]);

  const pageTitle = PAGE_TITLES[location.pathname] || 'SHIRA OT Tracker';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          pageTitle={pageTitle}
        />
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

// ── Auth layout (no sidebar) ──────────────────────────────────────────────────
function AuthShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ot-theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ot-theme', theme);
  }, [theme]);

  return (
    <>
      <button className="theme-toggle auth-theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 999 }}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}

// ── Root router ───────────────────────────────────────────────────────────────
function RootRouter() {
  const location = useLocation();
  const isAuth = ['/login', '/register'].includes(location.pathname);
  return isAuth ? <AuthShell /> : <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RootRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
