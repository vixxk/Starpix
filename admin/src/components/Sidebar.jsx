import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChartBar,
  Sparkle,
  FolderSimple,
  FrameCorners,
  Confetti,
  MegaphoneSimple,
  CreditCard,
  UsersThree,
  Tag,
  X,
  SignOut,
  Crown,
} from '@phosphor-icons/react';

const navigation = [
  { name: 'Overview', href: '/', icon: ChartBar },
  { name: 'Templates', href: '/templates', icon: Sparkle },
  { name: 'Categories', href: '/categories', icon: FolderSimple },
  { name: 'Frames', href: '/frames', icon: FrameCorners },
  { name: 'Effects', href: '/effects', icon: Confetti },
  { name: 'Campaigns', href: '/campaigns', icon: MegaphoneSimple },
  { name: 'Purchases', href: '/purchases', icon: CreditCard },
  { name: 'Users', href: '/users', icon: UsersThree },
  { name: 'Pricing', href: '/pricing', icon: Tag },
];

export default function Sidebar({ open, onClose }) {
  const { logout, admin } = useAuth();

  const content = (
    <>
      {/* Brand */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-glow-400 to-glow-500 flex items-center justify-center shadow-glow relative overflow-hidden">
          <Crown className="w-5 h-5 text-night-950" weight="fill" />
        </div>
        <div className="min-w-0">
          <h1 className="display font-bold text-lg text-white leading-tight tracking-tight">STATUZZZ</h1>
          <p className="text-[10px] font-semibold tracking-[0.22em] text-glow-300 uppercase">Control Room</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden ml-auto p-1.5 text-night-300 hover:text-white hover:bg-night-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        <p className="label px-3 pb-2 pt-2">Workspace</p>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-glow-500/15 text-glow-300'
                  : 'text-night-200 hover:bg-night-700/70 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-glow-400 transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />
                <item.icon
                  className="w-[18px] h-[18px] shrink-0"
                  weight={isActive ? 'duotone' : 'regular'}
                />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-night-600/60 bg-night-800/40">
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-night-900/60 border border-night-600/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-glow-400 to-glow-500 text-night-950 flex items-center justify-center text-xs font-display font-bold">
              {admin?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{admin?.email || 'admin@statuzzz.com'}</p>
              <p className="text-[10px] text-glow-300 font-medium capitalize">{admin?.role || 'super_admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-night-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <SignOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-night-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 shrink-0 bg-night-900 border-r border-night-600/60 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}