import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Loader2, XCircle, MinusCircle } from 'lucide-react';

interface Props {
  status: 'completed' | 'processing' | 'pending' | 'failed' | 'cancelled' | 'none' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const py = size === 'sm' ? 'py-0.5' : 'py-1';
  const px = size === 'sm' ? 'px-2.5' : 'px-3';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  switch (status) {
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded-full ${textSize} font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm`}>
          <CheckCircle2 className={iconSize} />
          Completed
        </span>
      );
    case 'processing':
      return (
        <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded-full ${textSize} font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm animate-pulse`}>
          <Loader2 className={`${iconSize} animate-spin`} />
          Processing
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded-full ${textSize} font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 shadow-sm`}>
          <Clock className={iconSize} />
          Queued
        </span>
      );
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded-full ${textSize} font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm`}>
          <AlertCircle className={iconSize} />
          Failed
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded-full ${textSize} font-medium bg-neutral-800 text-neutral-400 border border-neutral-700 shadow-sm`}>
          <XCircle className={iconSize} />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 ${px} ${py} rounded-full ${textSize} font-medium bg-neutral-800/80 text-neutral-400 border border-neutral-700/60`}>
          <MinusCircle className={iconSize} />
          Not Analyzed
        </span>
      );
  }
};
