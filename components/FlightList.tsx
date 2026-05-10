'use client';
import React from 'react';
import type { Aircraft } from '@/lib/types';
import { formatAltitude, formatHeading } from '@/lib/aircraftUtils';

interface FlightListProps {
  aircraft: Aircraft[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Swedish labels per phase — makes the game understandable for non-ATC users
const PHASE_LABELS: Record<string, { sv: string; style: string }> = {
  descending:    { sv: 'Sjunker',       style: 'bg-cyan-900/40 text-cyan-400' },
  approach:      { sv: 'Inflygning',    style: 'bg-blue-900/40 text-blue-400' },
  final:         { sv: '→ Final',       style: 'bg-green-800/60 text-green-200' },
  landing:       { sv: '↓ Landar',      style: 'bg-green-700/70 text-white' },
  landed:        { sv: 'Landat',        style: 'bg-slate-800 text-slate-500' },
  climbing:      { sv: 'Stiger',        style: 'bg-amber-900/40 text-amber-400' },
  departing:     { sv: 'Avgående',      style: 'bg-amber-900/60 text-amber-300' },
  takeoff:       { sv: '↑ Lyfter!',     style: 'bg-yellow-700/60 text-yellow-100' },
  lining_up:     { sv: 'Rullar in',     style: 'bg-yellow-900/60 text-yellow-300' },
  holding_short: { sv: '⚡ Väntar start', style: 'bg-orange-800/60 text-orange-200 animate-pulse' },
  enroute:       { sv: 'På väg',        style: 'bg-slate-800 text-slate-400' },
  left_sector:   { sv: 'Lämnat',        style: 'bg-slate-900 text-slate-600' },
};

function PhaseChip({ phase }: { phase: string }) {
  const info = PHASE_LABELS[phase] ?? { sv: phase, style: 'bg-slate-800 text-slate-400' };
  return (
    <span className={`text-[8px] font-mono px-1 py-0.5 rounded whitespace-nowrap ${info.style}`}>
      {info.sv}
    </span>
  );
}

function AircraftRow({ ac, selected, onSelect }: { ac: Aircraft; selected: boolean; onSelect: () => void }) {
  const isConflict = ac.conflictAlert;
  const needsAction = ac.phase === 'holding_short' || (ac.type === 'ARR' && ac.phase === 'approach' && !ac.clearedApproach);
  return (
    <div
      onClick={onSelect}
      className={`
        flex flex-col px-2 py-1.5 cursor-pointer
        border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors
        ${selected ? 'bg-slate-700/50 border-l-2 border-l-cyan-400' : ''}
        ${isConflict ? 'bg-red-950/30' : ''}
        ${needsAction && !selected ? 'border-l-2 border-l-amber-500' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <div className="text-white font-bold font-mono text-xs">{ac.callsign}</div>
        <div className="text-slate-500 font-mono text-[9px]">{ac.aircraftType}</div>
        {isConflict && <span className="text-red-400 text-xs ml-auto">⚠</span>}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <PhaseChip phase={ac.phase} />
        {needsAction && !isConflict && (
          <span className="text-amber-400 text-[8px] font-mono ml-auto">← klicka!</span>
        )}
      </div>
    </div>
  );
}

export default function FlightList({ aircraft, selectedId, onSelect }: FlightListProps) {
  const arrivals = aircraft.filter(
    (ac) => ac.type === 'ARR' && ac.phase !== 'landed' && ac.phase !== 'left_sector'
  );
  const departures = aircraft.filter(
    (ac) => ac.type === 'DEP' && ac.phase !== 'landed' && ac.phase !== 'left_sector'
  );

  return (
    <div className="flex flex-col h-full gap-2 overflow-hidden">
      {/* Arrivals */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/40 rounded-t border-b border-slate-700">
          <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest">Arrivals</span>
          <span className="text-[9px] text-slate-500 font-mono">{arrivals.length}</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {arrivals.length === 0 ? (
            <div className="text-slate-600 text-[10px] font-mono px-2 py-2">No arrivals</div>
          ) : (
            arrivals.map((ac) => (
              <AircraftRow
                key={ac.id}
                ac={ac}
                selected={ac.id === selectedId}
                onSelect={() => onSelect(ac.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Departures */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/40 rounded-t border-b border-slate-700">
          <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest">Departures</span>
          <span className="text-[9px] text-slate-500 font-mono">{departures.length}</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {departures.length === 0 ? (
            <div className="text-slate-600 text-[10px] font-mono px-2 py-2">No departures</div>
          ) : (
            departures.map((ac) => (
              <AircraftRow
                key={ac.id}
                ac={ac}
                selected={ac.id === selectedId}
                onSelect={() => onSelect(ac.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
