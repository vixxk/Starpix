import React, { useState, useEffect } from 'react';
import ModalPortal from './ModalPortal';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Crown,
  CheckCircle,
  X,
  WarningCircle,
  Sparkle,
  CalendarCheck,
  ShieldCheck,
} from '@phosphor-icons/react';

const FALLBACK_PLANS = [
  {
    id: '7days',
    name: '7 Days Access',
    price: 29,
    durationDays: 7,
    badgeText: 'Quick Trial',
    badgeType: 'popular',
  },
  {
    id: '30days',
    name: '30 Days Access',
    price: 99,
    durationDays: 30,
    badgeText: 'Most Popular',
    badgeType: 'popular',
  },
  {
    id: '1year',
    name: '1 Year Access',
    price: 599,
    durationDays: 365,
    badgeText: 'Best Value',
    badgeType: 'best_value',
  },
  {
    id: 'lifetime',
    name: 'Lifetime / Permanent VIP',
    price: 0,
    durationDays: 0,
    badgeText: 'Admin Grant',
    badgeType: 'custom',
  },
];

export default function GrantVipModal({ isOpen, user, onClose, onSuccess }) {
  const { toast } = useToast();
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState('30days');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchPricing = async () => {
      try {
        const res = await API.get('/admin/pricing');
        if (res.data?.success && res.data?.data?.plans?.length) {
          const active = res.data.data.plans.filter((p) => p.isActive !== false);
          // Add lifetime option to dynamic plans if not already there
          const hasLifetime = active.some((p) => p.id === 'lifetime');
          const combined = hasLifetime
            ? active
            : [
                ...active,
                {
                  id: 'lifetime',
                  name: 'Lifetime / Permanent VIP',
                  price: 0,
                  durationDays: 0,
                  badgeText: 'Admin Grant',
                  badgeType: 'custom',
                },
              ];
          setPlans(combined);
          if (!combined.some((p) => p.id === selectedPlanId)) {
            setSelectedPlanId(combined[0]?.id || '30days');
          }
        }
      } catch (e) {
        // Fallback to static defaults
      }
    };
    fetchPricing();
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const isAlreadyVip = Boolean(user.isPremium && user.subscriptionStatus === 'active');
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const calculateExpiry = () => {
    if (!selectedPlan || selectedPlan.durationDays === 0 || selectedPlan.id === 'lifetime') {
      return 'Permanent (No Expiry)';
    }
    const d = new Date();
    d.setDate(d.getDate() + Number(selectedPlan.durationDays));
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isAlreadyVip) {
        // Revoke
        const res = await API.put(`/admin/users/${user._id}/toggle-vip`, { action: 'revoke' });
        if (res.data?.success) {
          toast.success(res.data.message || 'VIP membership revoked');
          onSuccess && onSuccess();
          onClose();
        }
      } else {
        // Grant with chosen pack
        const res = await API.put(`/admin/users/${user._id}/toggle-vip`, {
          action: 'grant',
          planId: selectedPlan.id,
          durationDays: selectedPlan.durationDays,
        });
        if (res.data?.success) {
          toast.success(res.data.message || 'VIP membership granted');
          onSuccess && onSuccess();
          onClose();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update VIP status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-ink/70 backdrop-blur-sm animate-fade-in">
        <div className="modal-card w-full max-w-lg bg-paper-50 border-2 border-ink shadow-hard-lg overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-ink bg-paper-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 border-2 border-ink flex items-center justify-center shrink-0 ${
                  isAlreadyVip ? 'bg-rose-500 text-white' : 'bg-flame-500 text-ink'
                }`}
              >
                {isAlreadyVip ? (
                  <WarningCircle className="w-5 h-5" weight="bold" />
                ) : (
                  <Crown className="w-5 h-5" weight="fill" />
                )}
              </div>
              <div>
                <h3 className="display font-bold text-base text-ink leading-tight">
                  {isAlreadyVip ? 'Revoke VIP Entitlement?' : 'Grant VIP Membership Pack'}
                </h3>
                <p className="font-mono text-[10px] text-ink-mute uppercase tracking-wider">
                  Target User: {user.name || user.phoneNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 text-ink hover:bg-paper-200 border-2 border-transparent hover:border-ink transition-all"
            >
              <X className="w-4 h-4" weight="bold" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {isAlreadyVip ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-rose-50 border-2 border-rose-500/40 text-rose-950 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <WarningCircle className="w-4 h-4 text-rose-600 shrink-0" weight="bold" />
                    Immediate Entitlement Revocation
                  </p>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    This user currently holds an active VIP membership pass. Revoking will immediately disable unlimited downloads, remove VIP badges, and reset their account status to Free Member.
                  </p>
                </div>
                <div className="p-3 bg-paper-100 border-2 border-ink/20 font-mono text-xs space-y-1">
                  <p><span className="text-ink-mute">User:</span> <strong className="text-ink">{user.name || 'Starpix User'}</strong></p>
                  <p><span className="text-ink-mute">Phone:</span> <strong className="text-ink">{user.phoneNumber}</strong></p>
                  <p><span className="text-ink-mute">Current Plan:</span> <strong className="text-amber-600 uppercase">{user.subscriptionPlan || 'Active VIP'}</strong></p>
                  {user.subscriptionExpiresAt && (
                    <p><span className="text-ink-mute">Expires:</span> <strong className="text-ink">{new Date(user.subscriptionExpiresAt).toLocaleDateString()}</strong></p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="label block text-[10px] text-ink uppercase mb-2">
                    Select VIP Membership Pack to Grant
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {plans.map((p) => {
                      const isSelected = selectedPlanId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`cursor-pointer p-3 border-2 transition-all relative ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-600 shadow-hard-sm'
                              : 'bg-paper-50 border-ink/30 hover:border-ink hover:bg-paper-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-bold text-xs text-ink leading-tight">
                              {p.name}
                            </span>
                            {isSelected && (
                              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" weight="fill" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-2">
                            <span className="font-mono text-ink-mute">
                              {p.durationDays > 0 ? `${p.durationDays} Days` : 'Lifetime'}
                            </span>
                            <span className="font-bold font-mono text-glow-700 text-xs">
                              {p.price > 0 ? `₹${p.price}` : 'Free'}
                            </span>
                          </div>
                          {p.badgeText && (
                            <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider bg-ink text-flame-400 px-1.5 py-0.5 border border-ink">
                              {p.badgeText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grant Summary Preview */}
                <div className="p-3 bg-paper-100 border-2 border-ink/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-mute font-medium flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 text-amber-600" weight="fill" /> Pack:
                    </span>
                    <strong className="text-ink font-bold">{selectedPlan?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-mute font-medium flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-glow-600" weight="bold" /> Access Valid Until:
                    </span>
                    <strong className="text-ink font-mono font-bold">{calculateExpiry()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t-2 border-ink bg-paper-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`text-xs px-4 py-2 font-bold uppercase tracking-wider border-2 border-ink transition-all ${
                isAlreadyVip
                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-hard-sm'
                  : 'bg-flame-500 text-ink hover:bg-flame-400 shadow-hard-sm'
              }`}
            >
              {submitting
                ? 'Processing...'
                : isAlreadyVip
                ? 'Revoke VIP'
                : `Grant VIP Pass`}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
