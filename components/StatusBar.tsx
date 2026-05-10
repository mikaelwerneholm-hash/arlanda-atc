'use client';
import React from 'react';
import type { SimulationState, TrafficLevel, TimeSpeed } from '@/lib/types';

interface StatusBarProps {
  state: SimulationState;
  onToggleRunning: () => void;
  onSetTimeSpeed: (s: TimeSpeed) => void;
  onSetTrafficLevel: (l: TrafficLevel) => void;
}

function formatSimTime(t: number): string {
  const h = (8 + Math.floor(t / 3600)) % 24; // start at 08:00 local
  const m = Math.floor((t % 3600) / 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const TRAFFIC_LEVELS: TrafficLevel[] = ['calm', 'normal', 'intense', 'chaos'];
const TIME_SPEEDS: TimeSpeed[] = [1, 2, 5];

const trafficColors: Record<TrafficLevel, string> = {
  calm:    'bg-green-800/50 text-green-400 border-green-700',
  normal:  'bg-blue-800/50 text-blue-400 border-blue-700',
  intense: 'bg-orange-800/50 text-orange-400 border-orange-700',
  chaos:   'bg-red-800/50 text-red-400 border-red-700 animate-pulse',
};

export default function StatusBar({
  state,
  onToggleRunning,
  onSetTimeSpeed,
  onSetTrafficLevel,
}: StatusBarProps) {
  const { weather, activeRunwayArr, activeRunwayDep } = state;
  const hasConflicts = state.aircraft.some((a) => a.conflictAlert);

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900 border-b border-slate-700 flex-wrap font-mono text-xs">
      {/* Sim time */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500">TIME</span>
        <span className="text-white font-bold">{formatSimTime(state.simTime)}L</span>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Play/Pause */}
      <button
        onClick={onToggleRunning}
        className={`px-2 py-0.5 rounded border font-bold text-xs transition-colors ${
          state.running
            ? 'bg-red-900/50 border-red-700 text-red-300 hover:bg-red-800/60'
            : 'bg-green-900/50 border-green-700 text-green-300 hover:bg-green-800/60'
        }`}
      >
        {state.running ? '⏸ PAUSE' : '▶ START'}
      </button>

      {/* Time speed */}
      <div className="flex items-center gap-1">
        {TIME_SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSetTimeSpeed(s)}
            className={`px-1.5 py-0.5 rounded border text-[10px] transition-colors ${
              state.timeSpeed === s
                ? 'bg-cyan-800/60 border-cyan-600 text-cyan-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-slate-500'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Traffic level */}
      <div className="flex items-center gap-1">
        <span className="text-slate-500 text-[9px]">TFC</span>
        {TRAFFIC_LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => onSetTrafficLevel(l)}
            className={`px-1.5 py-0.5 rounded border text-[9px] uppercase transition-colors ${
              state.trafficLevel === l
                ? trafficColors[l]
                : 'bg-slate-800/40 border-slate-700 text-slate-600 hover:border-slate-500'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Active runways */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-[9px]">RWY</span>
        <span className="text-cyan-400">ARR {activeRunwayArr}</span>
        <span className="text-green-400">DEP {activeRunwayDep}</span>
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Weather */}
      <div className="flex items-center gap-2 text-slate-400">
        <span>{weather.windDirection.toString().padStart(3, '0')}°/{weather.windSpeed}KT</span>
        <span>{weather.condition}</span>
        <span>QNH {weather.qnh}</span>
        {weather.windGusts > 0 && <span className="text-amber-400">G{weather.windGusts}KT</span>}
      </div>

      <div className="w-px h-4 bg-slate-700" />

      {/* Score */}
      <div className="flex items-center gap-2 ml-auto">
        {hasConflicts && (
          <span className="text-red-400 font-bold animate-pulse text-[10px]">⚠ SEP ALERT</span>
        )}
        <span className="text-slate-500 text-[9px]">LDG</span>
        <span className="text-green-400">{state.landingsCompleted}</span>
        <span className="text-slate-500 text-[9px]">DEP</span>
        <span className="text-amber-400">{state.departuresCompleted}</span>
        <span className="text-slate-500 text-[9px]">SCORE</span>
        <span className="text-white font-bold">{state.score}</span>
        {state.separationViolations > 0 && (
          <span className="text-red-400 text-[9px]">−{state.separationViolations} SEP</span>
        )}
      </div>
    </div>
  );
}
