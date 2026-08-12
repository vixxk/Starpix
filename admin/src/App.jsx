import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Templates from './pages/Templates';
import Categories from './pages/Categories';
import Frames from './pages/Frames';
import Effects from './pages/Effects';
import Campaigns from './pages/Campaigns';
import Purchases from './pages/Purchases';
import UsersPage from './pages/Users';
import Pricing from './pages/Pricing';
import { useAuth } from './context/AuthContext';

function ProtectedLayout() {
  const { admin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-night-950 gap-3">
        <div className="w-9 h-9 border-[3px] border-glow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-night-300 tracking-wide">Authenticating Admin…</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-night-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 anim">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/frames" element={<Frames />} />
        <Route path="/effects" element={<Effects />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}