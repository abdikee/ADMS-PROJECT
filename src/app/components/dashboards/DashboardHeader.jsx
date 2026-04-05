import React from 'react';

export function DashboardHeader({ eyebrow, title, description, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 shadow-sm">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-blue-100/40 to-transparent" />
      <div className="absolute -top-16 right-12 h-40 w-40 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 md:text-base">
            {description}
          </p>
        </div>
        {children ? (
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
