import React from 'react';

export default function PageHead({ title, subtitle, actions, icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="icon-chip bg-glow-500/10 text-glow-300 border border-glow-500/25 rounded-2xl shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="display text-xl font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-night-300 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">{actions}</div>
      )}
    </div>
  );
}