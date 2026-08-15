import React from 'react';

export default function PageHead({ title, subtitle, actions, icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="icon-chip bg-ink text-flame-400 shadow-hard-sm shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="display-hero text-xl text-ink tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-ink-mute font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">{actions}</div>
      )}
    </div>
  );
}