import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Envelope, LockKey, ArrowRight, WarningCircle, Crown, Eye, EyeSlash, Stamp, CheckCircle } from '@phosphor-icons/react';

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
    <div className="min-h-screen bg-paper-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Oversized watermark */}
      <span className="absolute -left-3 bottom-6 font-display text-[11rem] leading-none text-ink/[0.045] select-none pointer-events-none uppercase tracking-tight">
        Statuzzz
      </span>
      <span className="absolute right-4 top-4 label !text-ink/30">Control Room // v2.0</span>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Hard frame */}
        <div className="grid lg:grid-cols-2 border-2 border-ink bg-white shadow-hard-lg anim">
          {/* FORM SIDE */}
          <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-12 h-12 bg-ink text-flame-400 border-2 border-ink shadow-hard-sm flex items-center justify-center">
                <Crown className="w-6 h-6" weight="fill" />
              </div>
              <div>
                <h1 className="display text-2xl text-ink">Statuzzz</h1>
                <p className="label !text-flame-600 mt-0.5">Control Room Access</p>
              </div>
            </div>

            <h2 className="display text-3xl text-ink leading-none mb-3">
              Welcome Back,
              <span className="block text-flame-600">Commander.</span>
            </h2>
            <p className="text-sm text-ink-soft mb-8 leading-relaxed">
              Sign in to orchestrate status templates, campaigns, user entitlements &amp; revenue analytics.
            </p>

            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border-2 border-red-600 text-red-800 text-xs font-semibold flex items-center gap-2 anim">
                <WarningCircle className="w-4 h-4 text-red-700 shrink-0" weight="duotone" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Email Address</label>
                <div className="relative">
                  <Envelope className="w-[18px] h-[18px] text-ink-mute absolute left-3.5 top-3" weight="duotone" />
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
                  <LockKey className="w-[18px] h-[18px] text-ink-mute absolute left-3.5 top-3" weight="duotone" />
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
                    className="absolute right-3.5 top-3 text-ink-mute hover:text-ink transition-colors"
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

            <div className="mt-6 pt-5 border-t-2 border-ink/15 flex items-center justify-between gap-2">
              <p className="label !text-ink/50">Dev defaults</p>
              <p className="font-mono text-[11px] text-ink-soft">
                <span className="font-bold text-ink">admin@statuzzz.com</span> / <span className="font-bold text-ink">admin123</span>
              </p>
            </div>
          </div>

          {/* WORKBENCH SLAB */}
          <div className="hidden lg:flex flex-col justify-between bg-ink text-paper-50 border-l-2 border-ink p-10 relative overflow-hidden">
            {/* Flame corner block */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-flame-500" />
            <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
              <Stamp className="w-4 h-4 text-white" weight="fill" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">Workbench · Live</span>
            </div>

            <div className="relative z-10 my-auto w-full">
              <div className="border-2 border-paper-50/50 bg-night-950 shadow-hard-white">
                <img
                  src="/hero-art.png"
                  alt="Statuzzz Photo Status Studio"
                  className="w-full h-52 object-cover object-center"
                />
                <div className="flex items-center justify-between px-3.5 py-2.5 border-t-2 border-paper-50/50">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-flame-300">
                    Status Studio v2.0
                  </span>
                  <span className="w-2.5 h-2.5 bg-flame-500 animate-pulse-dot" />
                </div>
              </div>

              <h3 className="display text-2xl text-paper-50 leading-tight mt-7">
                Status Creation Engine
                <span className="block text-flame-400">Loaded &amp; operational.</span>
              </h3>

              <ul className="grid grid-cols-1 gap-2 mt-5">
                {[
                  'Photo & Name Placement Controls',
                  'Strict Paywall & Entitlement Rules',
                  'Real-Time Revenue Telemetry',
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 bg-paper-50/5 border border-paper-50/25 px-3 py-2"
                  >
                    <CheckCircle className="w-4 h-4 text-flame-400 shrink-0" weight="fill" />
                    <span className="text-xs font-medium text-paper-100">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative z-10 label !text-paper-50/40 mt-8">
              © Statuzzz · Mobile Status Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
