import React from 'react';

export default function PageHead({ title, subtitle, actions, icon, hideOnMobile = true }) {
  return (
    <>
      <div className={`${hideOnMobile ? 'hidden sm:flex' : 'flex'} flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3.5 sm:mb-6`}>
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {icon && (
            <div className="icon-chip w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg bg-ink text-flame-400 shadow-hard-sm shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="display-hero text-lg sm:text-xl text-ink tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] sm:text-xs text-ink-mute font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">{actions}</div>
        )}
      </div>
      {hideOnMobile && actions && (
        <div className="sm:hidden mb-3">{actions}</div>
      )}
    </>
  );
}