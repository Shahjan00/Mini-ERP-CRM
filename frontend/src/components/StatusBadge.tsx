import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'default' | 'customer' | 'challan' | 'movement';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'default' }) => {
  const normalized = status.toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized === 'ACTIVE' || normalized === 'CONFIRMED' || normalized === 'IN') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (normalized === 'LEAD' || normalized === 'DRAFT') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (normalized === 'INACTIVE' || normalized === 'CANCELLED' || normalized === 'OUT') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (normalized === 'RETAIL') {
    styles = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  } else if (normalized === 'WHOLESALE') {
    styles = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  } else if (normalized === 'DISTRIBUTOR') {
    styles = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${styles}`}
    >
      {status}
    </span>
  );
};
