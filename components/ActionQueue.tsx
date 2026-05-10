'use client';
import React from 'react';
import type { Aircraft, SimulationState } from '@/lib/types';
import { distanceBetween } from '@/lib/aircraftUtils';
import { RUNWAY_POSITIONS } from '@/lib/arlandaData';

interface PendingAction {
  aircraftId: string;
  callsign: string;
  priority: 'critical' | 'urgent' | 'normal';
  icon: string;
  title: string;
  description: string;
}

function buildActionList(state: SimulationState): PendingAction[] {
  const actions: PendingAction[] = [];
  const threshold = RUNWAY_POSITIONS[state.activeRunwayArr]?.start ?? { x: 500, y: 540 };

  for (const ac of state.aircraft) {
    if (ac.phase === 'landed' || ac.phase === 'left_sector') continue;

    const dist = distanceBetween(ac.position, threshold);

    // 1. CRITICAL: Separation conflict
    if (ac.conflictAlert) {
      actions.push({
        aircraftId: ac.id,
        callsign: ac.callsign,
        priority: 'critical',
        icon: '⚠',
        title: 'SEPARATION — FÖR NÄRA!',
        description: 'Ge nytt heading eller höjd omedelbart.',
      });
      continue;
    }

    // 2. URGENT: Arrival close, needs ILS clearance
    if (
      ac.type === 'ARR' &&
      !ac.clearedApproach &&
      dist < 160 &&
      ac.phase !== 'final' &&
      ac.phase !== 'landing'
    ) {
      actions.push({
        aircraftId: ac.id,
        callsign: ac.callsign,
        priority: 'urgent',
        icon: '🛬',
        title: 'Ge ILS-clearance',
        description: `Nära banan (${Math.round(dist)}px). Klicka → CLEAR ILS APPROACH.`,
      });
      continue;
    }

    // 3. URGENT: Departure waiting for takeoff clearance
    if (ac.type === 'DEP' && ac.phase === 'holding_short') {
      actions.push({
        aircraftId: ac.id,
        callsign: ac.callsign,
        priority: 'urgent',
        icon: '🛫',
        title: 'Väntar på startklarering',
        description: `${ac.callsign} står vid banan. Klicka → GE STARTKLARERING.`,
      });
      continue;
    }

    // 4. NORMAL: Arrival still very high and getting close
    if (
      ac.type === 'ARR' &&
      ac.altitude > 10000 &&
      dist < 200 &&
      (ac.phase === 'descending' || ac.phase === 'enroute')
    ) {
      actions.push({
        aircraftId: ac.id,
        callsign: ac.callsign,
        priority: 'normal',
        icon: '📡',
        title: 'Styr mot banan',
        description: `${ac.callsign} sjunker automatiskt. Du kan ge heading mot banan.`,
      });
    }
  }

  // Sort: critical first, then urgent, then normal
  const order = { critical: 0, urgent: 1, normal: 2 };
  actions.sort((a, b) => order[a.priority] - order[b.priority]);

  return actions.slice(0, 4); // max 4 actions shown
}

const priorityStyles = {
  critical: {
    row: 'bg-red-950/80 border-red-700 hover:bg-red-900/80',
    icon: 'text-red-300 bg-red-900/60',
    title: 'text-red-200 font-bold',
    desc: 'text-red-400',
    badge: 'bg-red-700 text-white',
    pulse: 'animate-pulse',
  },
  urgent: {
    row: 'bg-amber-950/60 border-amber-800 hover:bg-amber-900/60',
    icon: 'text-amber-300 bg-amber-900/60',
    title: 'text-amber-200 font-bold',
    desc: 'text-amber-500',
    badge: 'bg-amber-700 text-white',
    pulse: '',
  },
  normal: {
    row: 'bg-slate-900/60 border-slate-700 hover:bg-slate-800/60',
    icon: 'text-cyan-400 bg-slate-800',
    title: 'text-slate-300',
    desc: 'text-slate-500',
    badge: 'bg-slate-700 text-slate-300',
    pulse: '',
  },
};

interface ActionQueueProps {
  state: SimulationState;
  onSelectAircraft: (id: string) => void;
}

export default function ActionQueue({ state, onSelectAircraft }: ActionQueueProps) {
  const actions = buildActionList(state);

  if (!state.running) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-3 text-center">
        <p className="text-slate-500 text-xs font-sans">
          Klicka <span className="text-green-400 font-bold">▶ Starta</span> för att börja.
        </p>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-sm">✓</span>
          <p className="text-slate-500 text-xs font-sans">Allt under kontroll — inga åtgärder krävs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1">
        Åtgärder krävs · {actions.length}
      </div>
      {actions.map((action) => {
        const s = priorityStyles[action.priority];
        return (
          <button
            key={action.aircraftId}
            onClick={() => onSelectAircraft(action.aircraftId)}
            className={`
              w-full text-left flex items-start gap-2 px-2 py-2
              border rounded-lg transition-colors cursor-pointer
              ${s.row} ${s.pulse}
            `}
          >
            <span className={`text-base w-7 h-7 flex items-center justify-center rounded shrink-0 ${s.icon}`}>
              {action.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-mono ${s.title} truncate`}>
                <span className="text-white">{action.callsign}</span>
                {' · '}
                {action.title}
              </div>
              <div className={`text-[9px] font-sans mt-0.5 leading-snug ${s.desc}`}>
                {action.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
