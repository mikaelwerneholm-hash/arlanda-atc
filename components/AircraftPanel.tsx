'use client';
import React, { useState } from 'react';
import type { Aircraft } from '@/lib/types';
import { formatAltitude, formatHeading } from '@/lib/aircraftUtils';

interface AircraftPanelProps {
  aircraft: Aircraft | null;
  onIssueHeading: (id: string, h: number) => void;
  onIssueAltitude: (id: string, alt: number) => void;
  onIssueSpeed: (id: string, spd: number) => void;
  onClearApproach: (id: string) => void;
  onClearTakeoff: (id: string) => void;
  onGoAround: (id: string) => void;
}

const ALTITUDE_PRESETS = [2000, 3000, 4000, 5000, 6000, 8000, 10000, 14000, 18000, 24000, 35000];
const SPEED_PRESETS = [160, 180, 200, 220, 250, 280, 300, 320, 340];
const HEADING_PRESETS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function Badge({ label, value, color = 'slate' }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-800 text-slate-300',
    cyan: 'bg-cyan-900/50 text-cyan-300',
    green: 'bg-green-900/50 text-green-300',
    amber: 'bg-amber-900/50 text-amber-300',
    red: 'bg-red-900/50 text-red-300',
  };
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">{label}</span>
      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${colors[color]}`}>{value}</span>
    </div>
  );
}

export default function AircraftPanel({
  aircraft,
  onIssueHeading,
  onIssueAltitude,
  onIssueSpeed,
  onClearApproach,
  onClearTakeoff,
  onGoAround,
}: AircraftPanelProps) {
  const [headingInput, setHeadingInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [spdInput, setSpdInput] = useState('');

  if (!aircraft) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 font-mono text-sm gap-2">
        <div className="text-2xl">✈</div>
        <div>Click aircraft on radar</div>
        <div className="text-xs text-slate-700">to issue instructions</div>
      </div>
    );
  }

  const id = aircraft.id;
  const phaseColors: Record<string, string> = {
    descending: 'text-cyan-400',
    approach: 'text-blue-400',
    final: 'text-green-400',
    landing: 'text-green-300',
    landed: 'text-slate-500',
    climbing: 'text-amber-400',
    departing: 'text-amber-300',
    takeoff: 'text-yellow-400',
    lining_up: 'text-yellow-500',
    holding_short: 'text-orange-400',
    left_sector: 'text-slate-600',
    enroute: 'text-cyan-600',
  };

  const submitHeading = () => {
    const h = parseInt(headingInput);
    if (!isNaN(h)) { onIssueHeading(id, h); setHeadingInput(''); }
  };
  const submitAlt = () => {
    const a = parseInt(altInput);
    if (!isNaN(a)) { onIssueAltitude(id, a); setAltInput(''); }
  };
  const submitSpd = () => {
    const s = parseInt(spdInput);
    if (!isNaN(s)) { onIssueSpeed(id, s); setSpdInput(''); }
  };

  const vrSign = aircraft.verticalRate > 50 ? '↑' : aircraft.verticalRate < -50 ? '↓' : '→';
  const vrColor = aircraft.verticalRate > 50 ? 'text-green-400' : aircraft.verticalRate < -50 ? 'text-red-400' : 'text-slate-400';

  return (
    <div className="h-full flex flex-col gap-2 overflow-y-auto font-mono text-xs text-slate-300">
      {/* Header */}
      <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-bold text-white tracking-wider">{aircraft.callsign}</span>
          <span className={`text-xs uppercase tracking-widest ${phaseColors[aircraft.phase] ?? 'text-slate-400'}`}>
            {aircraft.phase.replace('_', ' ')}
          </span>
        </div>
        <div className="text-slate-400 text-[10px]">{aircraft.aircraftType} · {aircraft.airline}</div>
        <div className="text-slate-500 text-[10px] mt-0.5">
          {aircraft.type === 'ARR' ? `${aircraft.origin} → ESSA` : `ESSA → ${aircraft.destination}`}
        </div>
        <div className="text-slate-500 text-[10px]">SQUAWK {aircraft.squawk}</div>
      </div>

      {/* Live data */}
      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
        <div className="grid grid-cols-3 gap-2">
          <Badge label="ALT" value={formatAltitude(aircraft.altitude)} color="cyan" />
          <Badge label="SPD" value={`${Math.round(aircraft.speed)}KT`} color="cyan" />
          <Badge label="HDG" value={`${formatHeading(aircraft.heading)}°`} color="cyan" />
        </div>
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[9px] text-slate-500">V/S: <span className={vrColor}>{vrSign} {Math.abs(Math.round(aircraft.verticalRate))} fpm</span></span>
          <span className="text-[9px] text-slate-500">RWY: <span className="text-white">{aircraft.assignedRunway ?? '—'}</span></span>
        </div>
      </div>

      {/* Target values */}
      <div className="bg-slate-900/40 rounded-lg p-2 border border-slate-800/50">
        <div className="text-[9px] text-slate-600 mb-1 uppercase">Cleared / Targets</div>
        <div className="grid grid-cols-3 gap-2">
          <Badge label="TGT ALT" value={formatAltitude(aircraft.targetAltitude)} color="amber" />
          <Badge label="TGT SPD" value={`${aircraft.targetSpeed}KT`} color="amber" />
          <Badge label="TGT HDG" value={`${formatHeading(aircraft.targetHeading)}°`} color="amber" />
        </div>
      </div>

      {/* Status flags */}
      <div className="flex gap-1 flex-wrap px-1">
        {aircraft.clearedApproach && (
          <span className="bg-green-900/40 text-green-400 text-[9px] px-2 py-0.5 rounded border border-green-800">ILS CLR</span>
        )}
        {aircraft.clearedTakeoff && (
          <span className="bg-yellow-900/40 text-yellow-400 text-[9px] px-2 py-0.5 rounded border border-yellow-800">T/O CLR</span>
        )}
        {aircraft.goAround && (
          <span className="bg-orange-900/40 text-orange-400 text-[9px] px-2 py-0.5 rounded border border-orange-800">GO ARND</span>
        )}
        {aircraft.conflictAlert && (
          <span className="bg-red-900/40 text-red-400 text-[9px] px-2 py-0.5 rounded border border-red-800 animate-pulse">CONFLICT</span>
        )}
      </div>

      {/* Instruction inputs */}
      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800 space-y-2">
        <div className="text-[9px] text-slate-600 uppercase">Issue Instructions</div>

        {/* Heading */}
        <div>
          <label className="text-[9px] text-slate-500 block mb-0.5">Heading °</label>
          <div className="flex gap-1">
            <input
              type="number"
              min={0}
              max={359}
              value={headingInput}
              onChange={(e) => setHeadingInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitHeading()}
              placeholder="000–359"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={submitHeading}
              className="bg-cyan-800 hover:bg-cyan-700 text-white text-xs px-2 rounded"
            >
              SET
            </button>
          </div>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {HEADING_PRESETS.map((h) => (
              <button
                key={h}
                onClick={() => onIssueHeading(id, h)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] px-1.5 py-0.5 rounded"
              >
                {h.toString().padStart(3, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Altitude */}
        <div>
          <label className="text-[9px] text-slate-500 block mb-0.5">Altitude ft / FL</label>
          <div className="flex gap-1">
            <input
              type="number"
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAlt()}
              placeholder="e.g. 8000"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={submitAlt}
              className="bg-cyan-800 hover:bg-cyan-700 text-white text-xs px-2 rounded"
            >
              SET
            </button>
          </div>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {ALTITUDE_PRESETS.map((a) => (
              <button
                key={a}
                onClick={() => onIssueAltitude(id, a)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] px-1.5 py-0.5 rounded"
              >
                {a >= 18000 ? `FL${a / 100}` : `${a / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="text-[9px] text-slate-500 block mb-0.5">Speed KT</label>
          <div className="flex gap-1">
            <input
              type="number"
              value={spdInput}
              onChange={(e) => setSpdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSpd()}
              placeholder="e.g. 250"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={submitSpd}
              className="bg-cyan-800 hover:bg-cyan-700 text-white text-xs px-2 rounded"
            >
              SET
            </button>
          </div>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {SPEED_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => onIssueSpeed(id, s)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] px-1.5 py-0.5 rounded"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-1 pb-2">
        {aircraft.type === 'ARR' && !aircraft.clearedApproach && (
          <button
            onClick={() => onClearApproach(id)}
            className="col-span-2 bg-green-800/60 hover:bg-green-700/80 border border-green-700 text-green-300 font-bold text-xs py-1.5 rounded"
          >
            ✓ CLEAR ILS APPROACH
          </button>
        )}
        {aircraft.type === 'DEP' && aircraft.phase === 'holding_short' && (
          <button
            onClick={() => onClearTakeoff(id)}
            className="col-span-2 bg-yellow-800/60 hover:bg-yellow-700/80 border border-yellow-700 text-yellow-300 font-bold text-xs py-1.5 rounded"
          >
            ✓ CLEARED FOR TAKEOFF
          </button>
        )}
        {(aircraft.phase === 'final' || aircraft.phase === 'approach') && (
          <button
            onClick={() => onGoAround(id)}
            className="col-span-2 bg-red-800/60 hover:bg-red-700/80 border border-red-700 text-red-300 font-bold text-xs py-1.5 rounded"
          >
            ↺ GO AROUND
          </button>
        )}
      </div>
    </div>
  );
}
