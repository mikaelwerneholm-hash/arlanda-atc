'use client';
import React, { useEffect, useState } from 'react';

export interface HelpTip {
  id: string;
  title: string;
  body: string;
  color: 'cyan' | 'green' | 'amber' | 'red';
  icon: string;
  autoClose?: number; // ms
}

interface HelpToastProps {
  tip: HelpTip | null;
  onDismiss: () => void;
}

const colorMap = {
  cyan:  { bg: 'bg-cyan-950/95',  border: 'border-cyan-700', title: 'text-cyan-300',  icon: 'bg-cyan-800/60' },
  green: { bg: 'bg-green-950/95', border: 'border-green-700', title: 'text-green-300', icon: 'bg-green-800/60' },
  amber: { bg: 'bg-amber-950/95', border: 'border-amber-700', title: 'text-amber-300', icon: 'bg-amber-800/60' },
  red:   { bg: 'bg-red-950/95',   border: 'border-red-700',   title: 'text-red-300',   icon: 'bg-red-800/60' },
};

export default function HelpToast({ tip, onDismiss }: HelpToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tip) {
      setVisible(true);
      if (tip.autoClose) {
        const t = setTimeout(() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }, tip.autoClose);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [tip, onDismiss]);

  if (!tip) return null;

  const c = colorMap[tip.color];

  return (
    <div
      className={`
        absolute bottom-4 left-4 z-40 max-w-xs w-80
        ${c.bg} ${c.border} border rounded-xl shadow-2xl
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${c.border}`}>
        <span className={`text-lg w-8 h-8 flex items-center justify-center rounded-lg ${c.icon}`}>
          {tip.icon}
        </span>
        <span className={`font-mono font-bold text-sm flex-1 ${c.title}`}>{tip.title}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="text-slate-500 hover:text-slate-300 text-lg leading-none ml-1 font-bold"
        >
          ×
        </button>
      </div>
      {/* Body */}
      <div className="px-3 py-2.5">
        <p className="text-slate-300 text-xs leading-relaxed font-sans">{tip.body}</p>
      </div>
      {/* Dismiss button */}
      <div className="px-3 pb-2.5">
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className={`w-full text-xs font-mono font-bold py-1.5 rounded-lg border ${c.border} ${c.title} hover:opacity-80 transition-opacity`}
        >
          Förstår! Fortsätt →
        </button>
      </div>
    </div>
  );
}
