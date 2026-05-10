'use client';
import React from 'react';
import type { Aircraft } from '@/lib/types';
import { formatAltitude, formatHeading } from '@/lib/aircraftUtils';

interface FlightListProps {
  aircraft: Aircraft[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function PhaseChip({ phase }: { phase: string }) {
  const styles: Record<string, string> = {
    descending: 'bg-cyan-900/40 text-cyan-400',
    approach:   'bg-blue-900/40 text-blue-400',
    final:      'bg-green-900/40 text-green-300',
    landing:    'bg-green-900/60 text-green-200',
    landed:     'bg-slate-800 text-slate-500',
    climbing:   'bg-amber-900/40 text-amber-400',
    departing:  'bg-amber-900/60 text-amber-300',
    takeoff:    'bg-yellow-900/40 text-yellow-400',
    lining_up:  'bg-yellow-900/60 text-yellow-300',
    holding_short: 'bg-orange-900/40 text-orange-400',
    enroute:    'bg-slate-800 text-slate-400',
    left_sector:'bg-slate-900 text-slate-600',
  };
  return (
    <span className={`text-[8px] font-mono uppercase px-1 py-0.5 rounded ${styles[phase] ?? 'bg-slate-800 text-slate-400'}`}>
      {phase.replace('_', ' ')}
    </span>
  );
}

function AircraftRow({ ac, selected, onSelect }: { ac: Aircraft; selected: boolean; onSelect: () => void }) {
  const isConflict = ac.conflictAlert;
  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded text-xs font-mono
        border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors
        ${selected ? 'bg-slate-700/50 border-l-2 border-l-cyan-500' : ''}
        ${isConflict ? 'bg-red-950/30 animate-pulse' : ''}
      `}
    >
      <div className="w-20 text-white font-bold truncate">{ac.callsign}</div>
      <div className="w-10 text-slate-400 text-[9px]">{ac.aircraftType}</div>
      <div className="w-16 text-cyan-400">{formatAltitude(ac.altitude)}</div>
      <div className="flex-1">
        <PhaseChip phase={ac.phase} />
      </div>
      {isConflict && <span className="text-red-400 text-[10px]">⚠</span>}
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
