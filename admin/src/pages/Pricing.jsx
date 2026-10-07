import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import { useToast } from '../context/ToastContext';
import MediaUploadZone from '../components/MediaUploadZone';
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
  Image as ImageIcon,
  Sparkle,
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

const DEFAULT_POSTERS = [
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/f30784b5-3698-40f5-9f55-4eae4622fcd4.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/ccead801-2abb-4d74-8f50-7bee9c53fa7a.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/eb57459c-c20d-4bbb-8fee-5f5464efb57d.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/d81f4913-f71e-433f-b803-c3f27777967c.jpg',
  'https://starpix-media-production.s3.ap-south-1.amazonaws.com/subscription/6adc6e37-9b98-4470-9a27-e2915e73b4e3.jpg',
];

const DEFAULT_CHECKLIST = [
  { id: 'templates', text: 'Thousands of Premium Templates', textKey: 'sub_feat_thousands', iconType: 'p_box' },
  { id: 'morning_night', text: 'Good Morning & Good Night Special', textKey: 'sub_feat_morning_night', iconType: 'sun' },
  { id: 'festival_devotional', text: 'Festival & Devotional Special', textKey: 'sub_feat_festival_devotional', iconType: 'flower' },
  { id: 'trending_viral', text: 'Trending & Viral Designs', textKey: 'sub_feat_trending_viral', iconType: 'trending' },
  { id: 'personalization', text: 'Name & Photo Personalization', textKey: 'sub_feat_name_photo', iconType: 'person' },
  { id: 'download_share', text: 'HD Download & Fast Share', textKey: 'sub_feat_download_share', iconType: 'download' },
  { id: 'new_content', text: 'Daily New Content Added', textKey: 'sub_feat_new_content', iconType: 'sparkles' },
];

export default function Pricing({ embedded = false }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'posters' | 'checklist'
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [posters, setPosters] = useState(DEFAULT_POSTERS);
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
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
        if (Array.isArray(d.posters) && d.posters.length > 0) {
          setPosters(d.posters);
        }
        if (Array.isArray(d.checklist) && d.checklist.length > 0) {
          setChecklist(d.checklist);
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

  const handlePosterChange = (idx, url) => {
    setPosters((prev) => {
      const updated = [...prev];
      updated[idx] = url;
      return updated;
    });
  };

  const handleChecklistChange = (idx, field, value) => {
    setChecklist((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
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
        posters: posters.filter(Boolean),
        checklist: checklist.map((c, idx) => ({
          ...c,
          id: c.id || `feat_${idx + 1}`,
        })),
        freeTemplateLimit: Number(freeTemplateLimit) || 0,
      };

      const res = await API.put('/admin/pricing', payload);
      if (res.data && res.data.success) {
        toast.success('Pricing and subscriptions settings saved successfully!');
        if (res.data.data) {
          if (res.data.data.plans) setPlans(res.data.data.plans);
          if (res.data.data.posters) setPosters(res.data.data.posters);
          if (res.data.data.checklist) setChecklist(res.data.data.checklist);
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
      {!embedded && (
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
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b-2 border-ink bg-paper-100 p-1.5 gap-2 rounded-[2px]">
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-[2px] ${
            activeTab === 'plans'
              ? 'bg-ink text-paper-50 shadow-hard'
              : 'text-ink-mute hover:text-ink hover:bg-paper-200/50'
          }`}
        >
          <Tag className="w-4 h-4" weight={activeTab === 'plans' ? 'fill' : 'bold'} />
          Subscription Packs ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('posters')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-[2px] ${
            activeTab === 'posters'
              ? 'bg-ink text-paper-50 shadow-hard'
              : 'text-ink-mute hover:text-ink hover:bg-paper-200/50'
          }`}
        >
          <ImageIcon className="w-4 h-4" weight={activeTab === 'posters' ? 'fill' : 'bold'} />
          Paywall Hero Posters ({posters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-[2px] ${
            activeTab === 'checklist'
              ? 'bg-ink text-paper-50 shadow-hard'
              : 'text-ink-mute hover:text-ink hover:bg-paper-200/50'
          }`}
        >
          <Sparkle className="w-4 h-4" weight={activeTab === 'checklist' ? 'fill' : 'bold'} />
          VIP Benefits Checklist ({checklist.length})
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: 3 Subscription Packs Grid */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-paper-100 p-3 border-2 border-ink rounded-[2px]">
              <div>
                <h3 className="font-bold text-sm text-ink uppercase tracking-wide">Mobile Subscription Packs</h3>
                <p className="text-xs text-ink-mute">Configure duration, price in INR ₹, badges, and bullet features for the mobile buy plans screen.</p>
              </div>
            </div>

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
          </div>
        )}

        {/* Tab 2: 5 Hero Posters */}
        {activeTab === 'posters' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-paper-100 p-3 border-2 border-ink rounded-[2px]">
              <div>
                <h3 className="font-bold text-sm text-ink uppercase tracking-wide">VIP Paywall Hero Posters (5 Cards)</h3>
                <p className="text-xs text-ink-mute">
                  Upload or customize the 5 overlapping fanned posters displayed on the VIP Subscription screen in the mobile app.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {['Durga Puja / Devotional (Top-Left)', 'Good Morning (Top-Right)', 'Good Night (Middle-Left)', 'Together Always (Middle-Right)', 'Festival / Diwali (Bottom-Left)'].map((label, pIdx) => {
                const currentUrl = posters[pIdx] || '';
                return (
                  <div key={pIdx} className="panel p-3.5 border-2 border-ink bg-white flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-paper-200 mb-2">
                        <span className="font-mono text-[10px] font-bold text-ink uppercase bg-paper-200 px-2 py-0.5 rounded-[2px]">
                          Card #{pIdx + 1}
                        </span>
                      </div>
                      <label className="text-[11px] font-bold text-ink uppercase tracking-wider block mb-1">
                        {label}
                      </label>
                      <MediaUploadZone
                        folder="subscription"
                        accept="image/*"
                        value={currentUrl}
                        onChange={(url) => handlePosterChange(pIdx, url)}
                        label=""
                      />
                    </div>
                    {Boolean(currentUrl) && (
                      <div className="w-full h-36 rounded-[2px] border border-ink/20 overflow-hidden bg-paper-100 mt-2">
                        <img src={currentUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Benefits Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-paper-100 p-3 border-2 border-ink rounded-[2px]">
              <div>
                <h3 className="font-bold text-sm text-ink uppercase tracking-wide">VIP Benefits Checklist</h3>
                <p className="text-xs text-ink-mute">
                  Customize the bullet items displayed under "Unlock Starpix Premium" on the left column of the paywall.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChecklist((prev) => [...prev, { id: `feat_${Date.now()}`, text: 'New VIP Benefit', textKey: '', iconType: 'checkmark' }])}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Add Checklist Item
              </button>
            </div>

            <div className="space-y-2">
              {checklist.map((item, cIdx) => (
                <div key={item.id || cIdx} className="panel p-3 border-2 border-ink bg-white flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-ink-mute bg-paper-200 px-2 py-1 rounded-[2px]">
                    #{cIdx + 1}
                  </span>
                  <div className="w-36">
                    <select
                      value={item.iconType || 'checkmark'}
                      onChange={(e) => handleChecklistChange(cIdx, 'iconType', e.target.value)}
                      className="input text-xs font-bold"
                    >
                      <option value="p_box">P Premium Box</option>
                      <option value="sun">☀️ Sun (Morning)</option>
                      <option value="flower">🌸 Flower (Festivals)</option>
                      <option value="trending">📈 Trending</option>
                      <option value="person">👤 Person (Photo)</option>
                      <option value="download">📥 Download</option>
                      <option value="sparkles">✨ Sparkles</option>
                      <option value="checkmark">✓ Checkmark</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleChecklistChange(cIdx, 'text', e.target.value)}
                    placeholder="Benefit description..."
                    className="input text-xs flex-1 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setChecklist((prev) => prev.filter((_, i) => i !== cIdx))}
                    className="p-1.5 text-ink-mute hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove item"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            Save Pricing & Subscription Settings
          </button>
        </div>
      </form>
    </div>
  );
}