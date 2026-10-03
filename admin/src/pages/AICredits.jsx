import React, { useState, useEffect } from 'react';
import API from '../services/api';
import PageHead from '../components/PageHead';
import { useToast } from '../context/ToastContext';
import MediaUploadZone from '../components/MediaUploadZone';
import {
  Coins,
  FloppyDisk,
  ArrowClockwise,
  Plus,
  Trash,
  Image as ImageIcon,
  VideoCamera,
  Crown,
  Lightning,
  Gift,
  Tag,
  CheckCircle,
  Eye,
} from '@phosphor-icons/react';

export default function AICredits() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' | 'banner' | 'guide'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [packs, setPacks] = useState([]);
  const [heroBanner, setHeroBanner] = useState({
    headline: 'Create Amazing',
    subheadline: 'AI Photos & Videos',
    description: 'Use AI credits to transform photos into 8K realistic Bollywood portraits, festival videos, and trending reels',
    magicScript: 'Turn photos into magic',
    heroGirlImage: '',
    heroGirlBeforeImage: '',
  });
  const [usageGuide, setUsageGuide] = useState([]);
  const [currency, setCurrency] = useState('INR');

  const fetchAICredits = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/ai-credits');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        if (Array.isArray(d.packs)) setPacks(d.packs);
        if (d.heroBanner) setHeroBanner(d.heroBanner);
        if (Array.isArray(d.usageGuide)) setUsageGuide(d.usageGuide);
        if (d.currency) setCurrency(d.currency);
      }
    } catch (err) {
      console.error('Failed to load AI credits settings:', err);
      toast.error('Failed to load AI Credits settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAICredits();
  }, []);

  // Pack Handlers
  const handlePackChange = (index, field, value) => {
    setPacks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddPack = () => {
    const newId = `pack_${Date.now()}`;
    const newPack = {
      id: newId,
      name: `New Pack ${packs.length + 1}`,
      nameKey: '',
      descKey: '',
      description: 'Generates AI photos and videos',
      credits: 100,
      creditsDisplay: '100 AI Credits',
      price: '₹ 99',
      priceNum: 99,
      iconType: 'coins_med',
      badgeKey: '',
      badgeType: '',
      isPopular: false,
      isBestValue: false,
      isActive: true,
      sortOrder: packs.length + 1,
    };
    setPacks((prev) => [...prev, newPack]);
    toast.success('New credit pack added');
  };

  const handleDeletePack = (index) => {
    setPacks((prev) => prev.filter((_, i) => i !== index));
    toast.success('Pack removed');
  };

  // Guide Handlers
  const handleGuideChange = (index, field, value) => {
    setUsageGuide((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddGuideItem = () => {
    const newItem = {
      id: `guide_${Date.now()}`,
      type: 'image',
      title: 'Custom AI Photo',
      titleKey: '',
      range: '25–30 Credits',
      image: heroBanner.heroGirlImage || 'https://starpix-media-production.s3.ap-south-1.amazonaws.com/ai-trends/530a9c2b-88eb-4cc6-93a1-0e2ce8ea8d30.jpg',
      sortOrder: usageGuide.length + 1,
    };
    setUsageGuide((prev) => [...prev, newItem]);
    toast.success('New guide item added');
  };

  const handleDeleteGuideItem = (index) => {
    setUsageGuide((prev) => prev.filter((_, i) => i !== index));
    toast.success('Guide item removed');
  };

  // Save Settings
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        packs: packs.map((p, idx) => ({
          ...p,
          credits: Number(p.credits) || 0,
          priceNum: Number(String(p.price || '').replace(/[^0-9.]/g, '')) || 0,
          sortOrder: idx + 1,
        })),
        heroBanner,
        usageGuide: usageGuide.map((g, idx) => ({
          ...g,
          sortOrder: idx + 1,
        })),
        currency,
      };

      const res = await API.put('/admin/ai-credits', payload);
      if (res.data && res.data.success) {
        toast.success('Buy AI Credits settings updated successfully!');
        if (res.data.data) {
          if (Array.isArray(res.data.data.packs)) setPacks(res.data.data.packs);
          if (res.data.data.heroBanner) setHeroBanner(res.data.data.heroBanner);
          if (Array.isArray(res.data.data.usageGuide)) setUsageGuide(res.data.data.usageGuide);
        }
      }
    } catch (err) {
      console.error('Failed to save AI credits settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Coins className="w-6 h-6 text-flame-500" weight="duotone" />}
        title="Buy AI Credits Management"
        subtitle="Full administrative control over credit packs, pricing, hero visuals, and credit usage guide displayed in the mobile app."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAICredits}
              disabled={loading}
              className="btn-secondary flex items-center gap-1.5"
            >
              <ArrowClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 bg-flame-500 text-ink border-2 border-ink"
            >
              <FloppyDisk className="w-4 h-4" weight="bold" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex border-b-2 border-ink bg-paper-100 p-1.5 gap-2 rounded-[2px]">
        <button
          type="button"
          onClick={() => setActiveTab('packs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-[2px] ${
            activeTab === 'packs'
              ? 'bg-ink text-paper-50 shadow-hard'
              : 'text-ink-mute hover:text-ink hover:bg-paper-200/50'
          }`}
        >
          <Coins className="w-4 h-4" weight={activeTab === 'packs' ? 'fill' : 'bold'} />
          Credit Packs ({packs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-[2px] ${
            activeTab === 'guide'
              ? 'bg-ink text-paper-50 shadow-hard'
              : 'text-ink-mute hover:text-ink hover:bg-paper-200/50'
          }`}
        >
          <Tag className="w-4 h-4" weight={activeTab === 'guide' ? 'fill' : 'bold'} />
          Usage Guide ({usageGuide.length})
        </button>
      </div>

      {/* Tab 1: Credit Packs */}
      {activeTab === 'packs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-paper-100 p-3 border-2 border-ink rounded-[2px]">
            <div>
              <h3 className="font-bold text-sm text-ink uppercase tracking-wide">Mobile AI Credit Packs</h3>
              <p className="text-xs text-ink-mute">Configure credit tiers, prices in ₹, badges, and icon badges.</p>
            </div>
            <button
              type="button"
              onClick={handleAddPack}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" weight="bold" />
              Add Credit Pack
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack, idx) => {
              const isPopular = pack.badgeType === 'popular' || pack.isPopular;
              const isBestValue = pack.badgeType === 'best_value' || pack.isBestValue;

              return (
                <div
                  key={pack.id || idx}
                  className={`panel p-4 flex flex-col justify-between border-2 transition-all relative ${
                    isPopular
                      ? 'border-flame-500 bg-flame-50/20 shadow-hard'
                      : isBestValue
                      ? 'border-amber-500 bg-amber-50/20 shadow-hard'
                      : 'border-ink bg-white'
                  }`}
                >
                  {/* Top Badge & Delete */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold text-ink-mute uppercase px-2 py-0.5 bg-paper-200 rounded-[2px]">
                      Slot #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-ink-mute mr-1">
                        <input
                          type="checkbox"
                          checked={pack.isActive !== false}
                          onChange={(e) => handlePackChange(idx, 'isActive', e.target.checked)}
                          className="accent-flame-500"
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeletePack(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Pack"
                      >
                        <Trash className="w-4 h-4" weight="bold" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Pack Title */}
                    <div>
                      <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                        Pack Title
                      </label>
                      <input
                        type="text"
                        value={pack.name || ''}
                        onChange={(e) => handlePackChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Creator Pack"
                        className="input-field text-sm font-bold w-full"
                      />
                    </div>

                    {/* Credits & Price Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                          Credits Amount
                        </label>
                        <input
                          type="number"
                          value={pack.credits}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            handlePackChange(idx, 'credits', val);
                            handlePackChange(idx, 'creditsDisplay', `${val.toLocaleString()} AI Credits`);
                          }}
                          className="input-field text-sm font-bold w-full"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                          Price Display
                        </label>
                        <input
                          type="text"
                          value={pack.price || ''}
                          onChange={(e) => handlePackChange(idx, 'price', e.target.value)}
                          placeholder="₹ 199"
                          className="input-field text-sm font-bold w-full"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                        Description / Subtitle
                      </label>
                      <input
                        type="text"
                        value={pack.description || ''}
                        onChange={(e) => handlePackChange(idx, 'description', e.target.value)}
                        placeholder="Description shown in app"
                        className="input-field text-xs w-full"
                      />
                    </div>

                    {/* Badge Selection */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                          Badge Type
                        </label>
                        <select
                          value={pack.badgeType || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handlePackChange(idx, 'badgeType', val);
                            if (val === 'popular') {
                              handlePackChange(idx, 'badgeKey', 'most_popular');
                              handlePackChange(idx, 'isPopular', true);
                              handlePackChange(idx, 'isBestValue', false);
                            } else if (val === 'best_value') {
                              handlePackChange(idx, 'badgeKey', 'best_value');
                              handlePackChange(idx, 'isPopular', false);
                              handlePackChange(idx, 'isBestValue', true);
                            } else if (val === 'starter') {
                              handlePackChange(idx, 'badgeKey', 'first_purchase_only');
                              handlePackChange(idx, 'isPopular', false);
                              handlePackChange(idx, 'isBestValue', false);
                            } else {
                              handlePackChange(idx, 'badgeKey', '');
                              handlePackChange(idx, 'isPopular', false);
                              handlePackChange(idx, 'isBestValue', false);
                            }
                          }}
                          className="input-field text-xs w-full"
                        >
                          <option value="">No Badge</option>
                          <option value="popular">⚡ MOST POPULAR</option>
                          <option value="best_value">👑 BEST VALUE</option>
                          <option value="starter">🎁 First Purchase</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                          Coin Icon Style
                        </label>
                        <select
                          value={pack.iconType || 'coins_med'}
                          onChange={(e) => handlePackChange(idx, 'iconType', e.target.value)}
                          className="input-field text-xs w-full"
                        >
                          <option value="gift">Gift Box Badge</option>
                          <option value="coins_small">Few Coins</option>
                          <option value="coins_med">Medium Coins</option>
                          <option value="coins_large">Large Coins</option>
                          <option value="coins_stack">High Stack</option>
                          <option value="coins_gold">Golden Chest</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Visual Preview Pill */}
                  <div className="mt-4 pt-3 border-t border-paper-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">{pack.creditsDisplay || `${pack.credits} Credits`}</span>
                    <span className="font-extrabold text-flame-600 font-mono text-sm">{pack.price}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Tab 3: Usage Guide */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-paper-100 p-3 border-2 border-ink rounded-[2px]">
            <div>
              <h3 className="font-bold text-sm text-ink uppercase tracking-wide">
                "How AI Credits are used?" Guide Columns
              </h3>
              <p className="text-xs text-ink-mute">
                Shows users realistic credit consumption estimates for photos and video reels.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddGuideItem}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" weight="bold" />
              Add Guide Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usageGuide.map((item, idx) => (
              <div
                key={item.id || idx}
                className="panel p-4 border-2 border-ink bg-white flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-ink-mute uppercase px-2 py-0.5 bg-paper-200 rounded-[2px]">
                    Card #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteGuideItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove item"
                  >
                    <Trash className="w-4 h-4" weight="bold" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                    Format / Title
                  </label>
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => handleGuideChange(idx, 'title', e.target.value)}
                    placeholder="e.g. Basic Face Swap Photo"
                    className="input-field text-xs font-bold w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                      Media Type
                    </label>
                    <select
                      value={item.type || 'image'}
                      onChange={(e) => handleGuideChange(idx, 'type', e.target.value)}
                      className="input-field text-xs w-full"
                    >
                      <option value="image">Image Format</option>
                      <option value="video">Video Format</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                      Credit Cost Range
                    </label>
                    <input
                      type="text"
                      value={item.range || ''}
                      onChange={(e) => handleGuideChange(idx, 'range', e.target.value)}
                      placeholder="e.g. 20–25 Credits"
                      className="input-field text-xs font-bold w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block mb-1">
                    Sample Thumbnail Asset
                  </label>
                  <input
                    type="text"
                    value={item.image || ''}
                    onChange={(e) => handleGuideChange(idx, 'image', e.target.value)}
                    placeholder="https://..."
                    className="input-field text-xs w-full mb-1.5"
                  />
                  <MediaUploadZone
                    folder="ai-credits"
                    accept="image"
                    currentUrl={item.image}
                    onUploadComplete={(url) => handleGuideChange(idx, 'image', url)}
                    label="Upload Guide Thumbnail"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
