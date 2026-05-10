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

// Swedish phase guide — tells the player what to do for each phase
const PHASE_GUIDE: Record<string, { label: string; color: string; tip: string }> = {
  enroute:    { label: 'På väg in', color: 'text-cyan-400', tip: 'Flygplanet är på väg in i din sektor. Ge det en lägre höjd och rikta det mot Arlanda.' },
  descending: { label: 'Sjunker', color: 'text-cyan-400', tip: 'Flygplanet sjunker. Fortsätt sänka höjden gradvis. När det är under 4000 fot och nära banan — ge det ILS-clearance.' },
  approach:   { label: 'Inflygning', color: 'text-blue-400', tip: 'Flygplanet är nära banan! Om höjden är under 4000 fot — klicka på den gröna knappen "CLEAR ILS APPROACH" nedan.' },
  final:      { label: '→ Final — landar snart', color: 'text-green-400', tip: 'Flygplanet är på finalinflygning. Det landar automatiskt. Du kan trycka Go Around om banan blockeras.' },
  landing:    { label: '↓ Landar nu', color: 'text-green-300', tip: 'Flygplanet berör marken. Det försvinner från radarn när det rullar av banan.' },
  landed:     { label: 'Har landat ✓', color: 'text-slate-400', tip: 'Landning klar! +100 poäng.' },
  holding_short: {
    label: '⚡ Väntar på startklarering',
    color: 'text-orange-300',
    tip: 'Flygplanet väntar vid banan och är redo att lyfta. Kolla att banan är fri, sedan trycker du på den GULA knappen "GE STARTKLARERING" nedan.',
  },
  lining_up:  { label: 'Rullar in på banan', color: 'text-yellow-400', tip: 'Flygplanet rullar ut på banan. Det lyfter automatiskt när det fått clearance.' },
  takeoff:    { label: '↑ Lyfter!', color: 'text-yellow-300', tip: 'Flygplanet accelererar och lyfter. Det klättrar automatiskt.' },
  climbing:   { label: 'Stiger', color: 'text-amber-400', tip: 'Flygplanet stiger efter start. Det lämnar din sektor automatiskt. Du kan ge det heading om du vill styra det.' },
  departing:  { label: 'Avgående', color: 'text-amber-300', tip: 'Flygplanet har lämnat Arlanda och är på väg. Det försvinner snart från radarn. +80 poäng.' },
  left_sector:{ label: 'Lämnat sektorn', color: 'text-slate-500', tip: '' },
};

function Badge({ label, value, color = 'slate' }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-800 text-slate-300',
    cyan:  'bg-cyan-900/50 text-cyan-300',
    green: 'bg-green-900/50 text-green-300',
    amber: 'bg-amber-900/50 text-amber-300',
    red:   'bg-red-900/50 text-red-300',
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
      <div className="h-full flex flex-col items-center justify-center text-slate-600 font-sans text-sm gap-3 px-4 text-center">
        <div className="text-3xl">✈</div>
        <div className="text-slate-400 font-bold text-sm">Inget flyg valt</div>
        <div className="text-slate-600 text-xs leading-relaxed">
          Klicka på ett flygplan på radarn eller i listan till vänster för att ge det instruktioner.
        </div>
      </div>
    );
  }

  const id = aircraft.id;
  const guide = PHASE_GUIDE[aircraft.phase];
  const vrSign = aircraft.verticalRate > 50 ? '↑' : aircraft.verticalRate < -50 ? '↓' : '→';
  const vrColor = aircraft.verticalRate > 50 ? 'text-green-400' : aircraft.verticalRate < -50 ? 'text-red-400' : 'text-slate-400';

  const submitHeading = () => { const h = parseInt(headingInput); if (!isNaN(h)) { onIssueHeading(id, h); setHeadingInput(''); } };
  const submitAlt    = () => { const a = parseInt(altInput);     if (!isNaN(a)) { onIssueAltitude(id, a); setAltInput(''); } };
  const submitSpd    = () => { const s = parseInt(spdInput);     if (!isNaN(s)) { onIssueSpeed(id, s);    setSpdInput(''); } };

  const isDep = aircraft.type === 'DEP';
  const isArr = aircraft.type === 'ARR';
  const canClearApproach = isArr && !aircraft.clearedApproach && (aircraft.phase === 'approach' || aircraft.phase === 'descending');
  const canClearTakeoff  = isDep && aircraft.phase === 'holding_short';
  const canGoAround      = isArr && (aircraft.phase === 'final' || aircraft.phase === 'approach');

  return (
    <div className="h-full flex flex-col gap-2 overflow-y-auto font-mono text-xs text-slate-300">

      {/* Header — callsign + route */}
      <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-bold text-white tracking-wider">{aircraft.callsign}</span>
          <span className={`text-[10px] font-sans font-bold ${guide?.color ?? 'text-slate-400'}`}>
            {guide?.label ?? aircraft.phase}
          </span>
        </div>
        <div className="text-slate-400 text-[10px]">{aircraft.aircraftType} · {aircraft.airline}</div>
        <div className="text-slate-500 text-[10px] mt-0.5">
          {isArr ? `Från ${aircraft.origin} → Arlanda` : `Arlanda → ${aircraft.destination}`}
        </div>
        {aircraft.conflictAlert && (
          <div className="mt-1.5 bg-red-900/50 border border-red-700 rounded px-2 py-1 text-red-300 text-[10px] font-sans animate-pulse">
            ⚠ SEPARATION! Ge nytt heading eller höjd omedelbart.
          </div>
        )}
      </div>

      {/* Vad ska jag göra nu? */}
      {guide?.tip && (
        <div className="bg-slate-900/70 rounded-lg px-3 py-2 border border-slate-700/50">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Vad gör jag nu?</div>
          <p className="text-slate-300 text-[10px] leading-relaxed font-sans">{guide.tip}</p>
        </div>
      )}

      {/* PRIMÄRKNAPP — biggest action */}
      {canClearTakeoff && (
        <button
          onClick={() => onClearTakeoff(id)}
          className="w-full bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold text-sm py-3 rounded-xl font-sans shadow-lg shadow-yellow-900/40 transition-all"
        >
          ✈ GE STARTKLARERING
          <div className="text-[10px] font-normal mt-0.5 text-yellow-900">Cleared for takeoff runway {aircraft.assignedRunway}</div>
        </button>
      )}

      {canClearApproach && (
        <button
          onClick={() => onClearApproach(id)}
          className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold text-sm py-3 rounded-xl font-sans shadow-lg shadow-green-900/40 transition-all"
        >
          ✓ CLEAR ILS — Tillstånd att landa
          <div className="text-[10px] font-normal mt-0.5 text-green-200">ILS approach runway {aircraft.assignedRunway}</div>
        </button>
      )}

      {canGoAround && (
        <button
          onClick={() => onGoAround(id)}
          className="w-full bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold text-sm py-2 rounded-xl font-sans transition-all"
        >
          ↺ GO AROUND — Avbryt landning
          <div className="text-[10px] font-normal mt-0.5 text-red-200">Flygplanet klättrar till 3000 fot igen</div>
        </button>
      )}

      {/* Live data */}
      <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
        <div className="text-[9px] text-slate-500 uppercase mb-1.5">Nuläge</div>
        <div className="grid grid-cols-3 gap-2">
          <Badge label="Höjd" value={formatAltitude(aircraft.altitude)} color="cyan" />
          <Badge label="Fart" value={`${Math.round(aircraft.speed)}KT`} color="cyan" />
          <Badge label="Kurs" value={`${formatHeading(aircraft.heading)}°`} color="cyan" />
        </div>
        <div className="flex justify-between mt-2 px-1 text-[9px] text-slate-500">
          <span>Stigning: <span className={vrColor}>{vrSign} {Math.abs(Math.round(aircraft.verticalRate))} fpm</span></span>
          <span>Bana: <span className="text-white">{aircraft.assignedRunway ?? '—'}</span></span>
        </div>
      </div>

      {/* Ge riktning (Heading) */}
      {!isDep || aircraft.phase !== 'holding_short' ? (
        <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800 space-y-3">
          <div className="text-[9px] text-slate-400 uppercase font-bold">Ge instruktioner</div>

          {/* Heading */}
          <div>
            <div className="flex items-baseline justify-between mb-0.5">
              <label className="text-[10px] text-white font-bold font-sans">Riktning (Heading)</label>
              <span className="text-[8px] text-slate-500">N=360, Ö=090, S=180, V=270</span>
            </div>
            <div className="flex gap-1">
              <input
                type="number" min={0} max={359}
                value={headingInput}
                onChange={(e) => setHeadingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitHeading()}
                placeholder="t.ex. 180"
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button onClick={submitHeading} className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 rounded font-bold">OK</button>
            </div>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {HEADING_PRESETS.map((h) => (
                <button key={h} onClick={() => onIssueHeading(id, h)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] px-1.5 py-0.5 rounded transition-colors">
                  {h.toString().padStart(3, '0')}
                </button>
              ))}
            </div>
          </div>

          {/* Altitude */}
          <div>
            <div className="flex items-baseline justify-between mb-0.5">
              <label className="text-[10px] text-white font-bold font-sans">Höjd (Altitude)</label>
              <span className="text-[8px] text-slate-500">i fot (feet)</span>
            </div>
            <div className="flex gap-1">
              <input
                type="number"
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAlt()}
                placeholder="t.ex. 8000"
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button onClick={submitAlt} className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 rounded font-bold">OK</button>
            </div>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {ALTITUDE_PRESETS.map((a) => (
                <button key={a} onClick={() => onIssueAltitude(id, a)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] px-1.5 py-0.5 rounded transition-colors">
                  {a >= 18000 ? `FL${a / 100}` : `${a / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <label className="text-[10px] text-white font-bold font-sans block mb-0.5">Fart (Knots)</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={spdInput}
                onChange={(e) => setSpdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitSpd()}
                placeholder="t.ex. 250"
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button onClick={submitSpd} className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-3 rounded font-bold">OK</button>
            </div>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {SPEED_PRESETS.map((s) => (
                <button key={s} onClick={() => onIssueSpeed(id, s)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[9px] px-1.5 py-0.5 rounded transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
