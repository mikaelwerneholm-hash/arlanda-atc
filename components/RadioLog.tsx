'use client';
import React, { useEffect, useRef } from 'react';
import type { RadioMessage } from '@/lib/types';

interface RadioLogProps {
  messages: RadioMessage[];
}

function formatSimTime(t: number): string {
  const h = Math.floor(t / 3600) % 24;
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function RadioLog({ messages }: RadioLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const typeStyle: Record<string, string> = {
    atc:    'text-cyan-300',
    pilot:  'text-green-300',
    system: 'text-amber-400',
  };

  const typeBadge: Record<string, string> = {
    atc:    'bg-cyan-900/30 text-cyan-500',
    pilot:  'bg-green-900/30 text-green-500',
    system: 'bg-amber-900/30 text-amber-500',
  };

  const typeLabel: Record<string, string> = {
    atc:    'ATC',
    pilot:  'PLT',
    system: 'SYS',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/40 border-b border-slate-700">
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Radio Log</span>
        <span className="text-[9px] text-slate-600 font-mono">{messages.length} msgs</span>
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-1.5 items-start text-[10px] font-mono leading-tight">
            <span className="text-slate-600 whitespace-nowrap shrink-0 pt-0.5">
              {formatSimTime(msg.timestamp)}
            </span>
            <span className={`shrink-0 text-[8px] px-1 py-0.5 rounded ${typeBadge[msg.type]}`}>
              {typeLabel[msg.type]}
            </span>
            <span className={`${typeStyle[msg.type]} break-words`}>
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
