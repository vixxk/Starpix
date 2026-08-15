import React, { useState } from 'react';
import PageHead from '../components/PageHead';
import { CurrencyInr, FloppyDisk, LockKey, CheckCircle, Tag } from '@phosphor-icons/react';

export default function Pricing() {
  const [pricing, setPricing] = useState({
    vipPassPrice: 199,
    currency: 'INR',
    freeTemplateLimit: 0,
    previewProtectionEnabled: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <PageHead
        icon={<Tag className="w-6 h-6" weight="duotone" />}
        title="Pricing & Paywall"
        subtitle="Global unlock pricing & paywall security rules"
      />

      <div className="panel p-6">
        {saved && (
          <div className="mb-5 p-3.5 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 text-xs font-semibold flex items-center gap-2 anim">
            <CheckCircle className="w-4 h-4" weight="fill" /> Pricing settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-glow-600" weight="duotone" /> VIP Pass Price
              </label>
              <input
                type="number"
                value={pricing.vipPassPrice}
                onChange={(e) => setPricing({ ...pricing, vipPassPrice: parseInt(e.target.value, 10) })}
                className="input"
              />
            </div>

            <div>
              <label className="field-label">Default Currency</label>
              <select
                value={pricing.currency}
                onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
                className="select"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="field-label">Free Template Limit</label>
              <input
                type="number"
                value={pricing.freeTemplateLimit}
                onChange={(e) => setPricing({ ...pricing, freeTemplateLimit: parseInt(e.target.value, 10) || 0 })}
                className="input"
              />
            </div>
          </div>

          <div className="p-4 bg-paper-100 border-2 border-ink rounded-[2px] space-y-3">
            <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
              <LockKey className="w-4 h-4 text-glow-600" weight="duotone" /> Screenshot & Preview Security
            </h4>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm text-ink-soft font-medium">
              <input
                type="checkbox"
                checked={pricing.previewProtectionEnabled}
                onChange={(e) => setPricing({ ...pricing, previewProtectionEnabled: e.target.checked })}
                className="w-4 h-4 rounded accent-glow-500"
              />
              Block screenshots & screen recording on mobile preview
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
            >
              <FloppyDisk className="w-4 h-4" weight="fill" /> Save Pricing Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}