import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Envelope, LockKey, ArrowRight, WarningCircle, Crown, Eye, EyeSlash } from '@phosphor-icons/react';

export default function Login() {
  const [email, setEmail] = useState('admin@statuzzz.com');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-glow-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-24 w-[420px] h-[420px] bg-orange-700/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-glow-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid w-full max-w-4xl lg:grid-cols-2 overflow-hidden rounded-3xl border border-night-600/60 bg-night-800/70 backdrop-blur-xl shadow-2xl relative z-10 p-10 lg:p-0">
        {/* Form side */}
        <div className="lg:p-12 flex flex-col justify-center">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-glow-400 to-glow-500 flex items-center justify-center shadow-glow">
              <Crown className="w-6 h-6 text-night-950" weight="fill" />
            </div>
            <div>
              <h1 className="display text-2xl font-bold text-white tracking-tight">STATUZZZ</h1>
              <p className="text-[10px] font-semibold tracking-[0.24em] text-glow-300 uppercase">Control Room Access</p>
            </div>
          </div>

          <h2 className="display text-2xl font-bold text-white leading-snug mb-1.5">
            Welcome back,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-glow-400 to-glow-300">Commander.</span>
          </h2>
          <p className="text-sm text-night-300 mb-8">Sign in to orchestrate templates, campaigns and monetization.</p>

          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2 anim">
              <WarningCircle className="w-4 h-4 text-red-400 shrink-0" weight="duotone" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email Address</label>
              <div className="relative">
                <Envelope className="w-[18px] h-[18px] text-night-400 absolute left-3.5 top-3" weight="duotone" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-11"
                  placeholder="admin@statuzzz.com"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Password</label>
              <div className="relative">
                <LockKey className="w-[18px] h-[18px] text-night-400 absolute left-3.5 top-3" weight="duotone" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-3 text-night-400 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeSlash className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2"
            >
              <span>{loading ? 'Authenticating…' : 'Sign in to Control Room'}</span>
              <ArrowRight className="w-4 h-4" weight="bold" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-night-600/60 text-center">
            <p className="text-[11px] text-night-400">
              Dev defaults ·{' '}
              <span className="font-mono text-glow-300">admin@statuzzz.com</span> /{' '}
              <span className="font-mono text-glow-300">admin123</span>
            </p>
          </div>
        </div>

        {/* Brand side with AI Generated Artwork */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-night-850 via-night-900 to-[#1F120A] border-l border-night-600/50 p-10 relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_30%,rgba(249,115,22,0.18),transparent_70%)] pointer-events-none" />

          {/* AI Artwork Hero Graphic */}
          <div className="relative z-10 my-auto flex flex-col items-center">
            <div className="relative group w-full max-w-sm rounded-2xl overflow-hidden border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.25)]">
              <img 
                src="/hero-art.png" 
                alt="Statuzzz Control Studio" 
                className="w-full h-56 object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-orange-400 bg-night-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-orange-500/20">
                  STUDIO v2.0 · LIVE
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-6 mt-6 pt-2">
            <h3 className="display text-2xl font-extrabold text-white leading-tight">
              Your status engine,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-glow-400 via-amber-300 to-glow-200">
                fully loaded & operational.
              </span>
            </h3>
            
            <ul className="grid grid-cols-1 gap-2.5 text-xs text-night-200">
              {[
                'Template Drops & Live Curation',
                'Campaign Launch & Frame Control',
                'Real-Time Revenue Analytics'
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 bg-night-900/60 border border-night-600/40 rounded-xl px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="font-medium text-night-100">{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-[10px] text-night-400 uppercase tracking-[0.25em] font-bold">
              © Statuzzz · Mobile Status Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}