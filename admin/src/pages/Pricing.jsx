import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import { useToast } from '../context/ToastContext';
import {
  CurrencyInr,
  FloppyDisk,
  CheckCircle,
  Tag,
  Plus,
  Trash,
  Crown,
  Lightning,
  ArrowClockwise,
  Check,
} from '@phosphor-icons/react';

const DEFAULT_PLANS = [
  {
    id: '7days',
    name: '7 Days Access',
    price: 29,
    durationDays: 7,
    periodKey: 'sub_plan_7_days',
    ctaKey: 'sub_cta_7_days',
    badgeText: '',
    badgeType: '',
    badgeKey: '',
    features: [
      'All Premium Templates',
      'Daily New Content',
      'No Ads',
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: '30days',
    name: '30 Days Access',
    price: 99,
    durationDays: 30,
    periodKey: 'sub_plan_30_days',
    ctaKey: 'sub_cta_30_days',
    badgeText: 'MOST POPULAR',
    badgeType: 'popular',
    badgeKey: 'sub_most_popular',
    features: [
      'All Premium Templates',
      'Daily New Content',
      'Full Access for 30 Days',
      'No Ads',
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: '1year',
    name: '1 Year Access',
    price: 599,
    durationDays: 365,
    periodKey: 'sub_plan_1_year',
    ctaKey: 'sub_cta_1_year',
    badgeText: 'BEST VALUE',
    badgeType: 'best_value',
    badgeKey: 'sub_best_value',
    features: [
      'All Premium Templates',
      'Daily New Content',
      'Full Access for 1 Year',
      'No Ads',
      'Exclusive Festival Collections',
    ],
    isActive: true,
    sortOrder: 3,
  },
];

export default function Pricing() {
  const { toast } = useToast();
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [freeTemplateLimit, setFreeTemplateLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/pricing');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        if (Array.isArray(d.plans) && d.plans.length > 0) {
          setPlans(d.plans);
        }
        if (d.freeTemplateLimit !== undefined) {
          setFreeTemplateLimit(d.freeTemplateLimit);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pricing settings:', err);
      toast.error('Could not load pricing settings from server');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (idx, field, value) => {
    setPlans((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        [field]: value,
      };
      return updated;
    });
  };

  const handleFeatureChange = (planIdx, featIdx, value) => {
    setPlans((prev) => {
      const updated = [...prev];
      const nextFeats = [...(updated[planIdx].features || [])];
      nextFeats[featIdx] = value;
      updated[planIdx] = {
        ...updated[planIdx],
        features: nextFeats,
      };
      return updated;
    });
  };

  const handleAddFeature = (planIdx) => {
    setPlans((prev) => {
      const updated = [...prev];
      const nextFeats = [...(updated[planIdx].features || []), 'New Feature'];
      updated[planIdx] = {
        ...updated[planIdx],
        features: nextFeats,
      };
      return updated;
    });
  };

  const handleRemoveFeature = (planIdx, featIdx) => {
    setPlans((prev) => {
      const updated = [...prev];
      const nextFeats = (updated[planIdx].features || []).filter((_, i) => i !== featIdx);
      updated[planIdx] = {
        ...updated[planIdx],
        features: nextFeats,
      };
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        plans: plans.map((p, idx) => ({
          ...p,
          price: Number(p.price) || 0,
          durationDays: Number(p.durationDays) || 30,
          sortOrder: idx + 1,
        })),
        freeTemplateLimit: Number(freeTemplateLimit) || 0,
      };

      const res = await API.put('/admin/pricing', payload);
      if (res.data && res.data.success) {
        toast.success('Pricing and subscription packs saved successfully!');
        if (res.data.data && res.data.data.plans) {
          setPlans(res.data.data.plans);
        }
      }
    } catch (err) {
      console.error('Failed to save pricing settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save pricing settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHead
        icon={<Tag className="w-6 h-6" weight="duotone" />}
        title="Pricing & Subscription Packs"
        subtitle="Configure the 3 mobile premium access packs and pricing (All prices in INR ₹)"
        actions={
          <button
            type="button"
            onClick={fetchPricing}
            disabled={loading}
            className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* 3 Subscription Packs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.slice(0, 3).map((plan, planIdx) => {
            const isPopular = plan.badgeType === 'popular' || plan.id === '30days';
            const isBestValue = plan.badgeType === 'best_value' || plan.id === '1year';

            return (
              <div
                key={plan.id || planIdx}
                className={`panel p-4 sm:p-5 flex flex-col justify-between border-2 transition-all relative ${
                  isPopular
                    ? 'border-flame-500 bg-flame-50/20 shadow-hard'
                    : isBestValue
                    ? 'border-amber-500 bg-amber-50/20 shadow-hard'
                    : 'border-ink bg-paper-50 shadow-hard-sm'
                }`}
              >
                {/* Pack Header Badge */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink bg-paper-200 px-2 py-0.5 border border-ink rounded-[2px]">
                      Pack #{planIdx + 1}
                    </span>
                    {isPopular && (
                      <span className="badge bg-flame-500 text-white font-bold border-ink text-[10px] flex items-center gap-1">
                        <Lightning className="w-3 h-3" weight="fill" /> Most Popular
                      </span>
                    )}
                    {isBestValue && (
                      <span className="badge bg-amber-400 text-ink font-bold border-ink text-[10px] flex items-center gap-1">
                        <Crown className="w-3 h-3" weight="fill" /> Best Value
                      </span>
                    )}
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-ink">
                    <input
                      type="checkbox"
                      checked={plan.isActive !== false}
                      onChange={(e) => handlePlanChange(planIdx, 'isActive', e.target.checked)}
                      className="w-3.5 h-3.5 accent-flame-500 rounded-[2px]"
                    />
                    <span>Active</span>
                  </label>
                </div>

                {/* Plan Form Fields */}
                <div className="space-y-4 my-4 flex-1">
                  {/* Plan Name */}
                  <div>
                    <label className="field-label text-xs uppercase font-mono">Pack Name / Title</label>
                    <input
                      type="text"
                      required
                      value={plan.name}
                      onChange={(e) => handlePlanChange(planIdx, 'name', e.target.value)}
                      placeholder="e.g. 7 Days Access"
                      className="input font-bold"
                    />
                  </div>

                  {/* Price & Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label text-xs uppercase font-mono">Price (INR ₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 font-bold text-sm text-ink-mute">₹</span>
                        <input
                          type="number"
                          required
                          min={0}
                          value={plan.price}
                          onChange={(e) => handlePlanChange(planIdx, 'price', e.target.value)}
                          className="input pl-7 font-mono font-bold text-base text-ink"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="field-label text-xs uppercase font-mono">Duration (Days)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={plan.durationDays}
                        onChange={(e) => handlePlanChange(planIdx, 'durationDays', e.target.value)}
                        className="input font-mono font-bold text-base text-ink"
                      />
                    </div>
                  </div>

                  {/* Highlight Badge */}
                  <div>
                    <label className="field-label text-xs uppercase font-mono">Highlight Badge</label>
                    <select
                      value={plan.badgeType || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        let text = '';
                        let key = '';
                        if (val === 'popular') {
                          text = 'MOST POPULAR';
                          key = 'sub_most_popular';
                        } else if (val === 'best_value') {
                          text = 'BEST VALUE';
                          key = 'sub_best_value';
                        }
                        setPlans((prev) => {
                          const updated = [...prev];
                          updated[planIdx] = {
                            ...updated[planIdx],
                            badgeType: val,
                            badgeText: text,
                            badgeKey: key,
                          };
                          return updated;
                        });
                      }}
                      className="select text-xs font-bold uppercase"
                    >
                      <option value="">No Badge</option>
                      <option value="popular">⚡ Most Popular</option>
                      <option value="best_value">👑 Best Value</option>
                      <option value="custom">Custom Badge</option>
                    </select>

                    {plan.badgeType === 'custom' && (
                      <input
                        type="text"
                        value={plan.badgeText}
                        onChange={(e) => handlePlanChange(planIdx, 'badgeText', e.target.value)}
                        placeholder="Enter badge text (e.g. SPECIAL OFFER)"
                        className="input mt-1.5 text-xs font-bold uppercase"
                      />
                    )}
                  </div>

                  {/* Bullet Points / Features */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="field-label mb-0 text-xs uppercase font-mono">
                        Pack Features ({plan.features?.length || 0})
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddFeature(planIdx)}
                        className="text-[11px] font-bold text-flame-700 hover:text-flame-800 flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3 h-3" weight="bold" /> Add Feature
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {(plan.features || []).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" weight="bold" />
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => handleFeatureChange(planIdx, fIdx, e.target.value)}
                            className="input py-1 px-2 text-xs flex-1"
                            placeholder="Feature bullet description..."
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(planIdx, fIdx)}
                            className="p-1 text-ink-mute hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remove feature"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Live Preview Box */}
                <div className="mt-2 pt-3 border-t border-ink/20 flex items-center justify-between bg-paper-100/60 p-2.5 rounded-[2px]">
                  <div>
                    <span className="text-[10px] text-ink-mute font-mono block">App Preview</span>
                    <span className="font-bold text-ink text-xs">{plan.name || 'Pack'}</span>
                  </div>
                  <div className="text-right">
                    <span className="display text-base text-flame-600 font-bold">₹{plan.price || 0}</span>
                    <span className="text-[10px] text-ink-mute font-mono block">/{plan.durationDays} days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-6"
          >
            {saving ? (
              <ArrowClockwise className="w-4 h-4 animate-spin" />
            ) : (
              <FloppyDisk className="w-4 h-4" weight="fill" />
            )}
            Save Pricing Settings
          </button>
        </div>
      </form>
    </div>
  );
}