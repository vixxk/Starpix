import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalPortal from './ModalPortal';
import {
  ChartBar,
  Sparkle,
  FolderSimple,
  MegaphoneSimple,
  CreditCard,
  ChartPieSlice,
  UsersThree,
  Tag,
  Flag,
  X,
  SignOut,
  Crown,
} from '@phosphor-icons/react';

const navigation = [
  { name: 'Overview', href: '/', icon: ChartBar },
  { name: 'Templates', href: '/templates', icon: Sparkle },
  { name: 'Categories', href: '/categories', icon: FolderSimple },
  { name: 'Campaigns', href: '/campaigns', icon: MegaphoneSimple },
  { name: 'Purchases', href: '/purchases', icon: CreditCard },
  { name: 'Subscriptions', href: '/subscriptions', icon: Crown },
  { name: 'User Reports', href: '/user-reports', icon: Flag },
  { name: 'Revenue Reports', href: '/reports', icon: ChartPieSlice },
  { name: 'Users', href: '/users', icon: UsersThree },
  { name: 'Pricing', href: '/pricing', icon: Tag },
];

export default function Sidebar({ open, onClose }) {
  const { logout, admin } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const content = (
    <>
      {/* Brand — ink slab with stamped orange mark */}
      <div className="px-5 pt-6 pb-5 border-b-2 border-paper-100/15">
        <div className="flex items-center gap-3">
          <img
            src="/starpix-logo.png"
            alt="Starpix"
            className="w-11 h-11 border-2 border-paper-100 rounded-[2px] object-cover shadow-hard-white bg-paper-100"
          />
          <div className="min-w-0">
            <h1 className="display text-xl text-white leading-none tracking-wide">STARPIX</h1>
            <p className="font-mono text-[9px] font-bold tracking-[0.24em] text-flame-400 uppercase mt-1">
              Control Room
            </p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 text-paper-200 hover:text-white hover:bg-paper-100/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav — stamped square buttons */}
      <nav className="flex-1 px-4 py-5 space-y-1.5">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-paper-200/40 px-2 pb-2">
          Workspace
        </p>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-[2px] border-2 px-3.5 py-2.5 text-sm font-bold uppercase tracking-wide transition-all duration-100 ${
                isActive
                  ? 'bg-flame-500 border-paper-100 text-ink shadow-hard-white -translate-x-0.5'
                  : 'border-transparent text-paper-100/80 hover:bg-paper-100/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="w-[18px] h-[18px] shrink-0"
                  weight={isActive ? 'fill' : 'bold'}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 bg-ink rounded-[1px]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer — operator plate */}
      <div className="p-4 border-t-2 border-paper-100/15">
        <div className="flex items-center justify-between rounded-[2px] border-2 border-paper-100/20 bg-ink px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-paper-100 text-ink flex items-center justify-center text-xs font-display font-bold border-2 border-paper-100/40">
              {admin?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate max-w-[120px]">{admin?.email || 'Administrator'}</p>
              <p className="font-mono text-[9px] text-flame-400 font-semibold uppercase tracking-wider">{admin?.role || 'super_admin'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            title="Logout"
            className="p-1.5 text-paper-200 hover:text-red-400 hover:bg-red-500/10 rounded-[2px] transition-colors"
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
          className="fixed inset-0 z-40 bg-ink/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 h-screen z-50 w-72 lg:w-64 shrink-0 bg-ink border-r-2 border-ink flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-4">
          <div className="max-w-sm w-full p-6 text-center rounded-[2px] bg-white border-2 border-ink shadow-hard-lg anim">
            <div className="w-12 h-12 rounded-[2px] bg-flame-500 border-2 border-ink flex items-center justify-center mx-auto mb-4 shadow-hard-sm">
              <SignOut className="w-6 h-6 text-ink" weight="duotone" />
            </div>
            <h3 className="display text-xl text-ink mb-1.5">Confirm Logout</h3>
            <p className="text-xs text-ink-mute mb-6 leading-relaxed">
              Are you sure you want to log out of Starpix Control Room? You will need to authenticate again to access admin features.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary flex-1 py-2.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="btn-danger flex-1 py-2.5 text-xs"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
}
