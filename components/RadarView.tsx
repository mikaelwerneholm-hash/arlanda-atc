'use client';
import React, { useCallback } from 'react';
import type { Aircraft, SimulationState } from '@/lib/types';
import { RUNWAY_POSITIONS, ARLANDA_CENTER } from '@/lib/arlandaData';
import { formatAltitude, formatHeading } from '@/lib/aircraftUtils';

interface RadarViewProps {
  state: SimulationState;
  onSelectAircraft: (id: string | null) => void;
}

function RunwayLines() {
  return (
    <g className="runways">
      {Object.entries(RUNWAY_POSITIONS).map(([id, pos]) => (
        <line
          key={id}
          x1={pos.start.x}
          y1={pos.start.y}
          x2={pos.end.x}
          y2={pos.end.y}
          stroke="#334155"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      {/* Runway labels */}
      <text x="480" y="548" fill="#475569" fontSize="7" textAnchor="middle">19R</text>
      <text x="480" y="432" fill="#475569" fontSize="7" textAnchor="middle">01L</text>
      <text x="520" y="548" fill="#475569" fontSize="7" textAnchor="middle">19L</text>
      <text x="520" y="452" fill="#475569" fontSize="7" textAnchor="middle">01R</text>
    </g>
  );
}

function RadarRings() {
  const cx = ARLANDA_CENTER.x;
  const cy = ARLANDA_CENTER.y;
  const rings = [50, 100, 150, 200, 250];
  return (
    <g className="radar-rings">
      {rings.map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="0.5" />
      ))}
      {/* Cardinal lines */}
      <line x1={cx} y1={50} x2={cx} y2={950} stroke="#1e293b" strokeWidth="0.5" />
      <line x1={50} y1={cy} x2={950} y2={cy} stroke="#1e293b" strokeWidth="0.5" />
      {/* Range labels */}
      {rings.map((r, i) => (
        <text key={r} x={cx + r + 3} y={cy - 3} fill="#334155" fontSize="7">
          {(i + 1) * 25}NM
        </text>
      ))}
    </g>
  );
}

function AircraftBlip({
  aircraft,
  onSelect,
}: {
  aircraft: Aircraft;
  onSelect: (id: string) => void;
}) {
  const { position, heading, speed, altitude, callsign, selected, conflictAlert, type, phase } = aircraft;

  const isActive = phase !== 'landed' && phase !== 'left_sector' && phase !== 'holding_short';
  if (!isActive && phase !== 'holding_short') {
    if (phase === 'landed' || phase === 'left_sector') return null;
  }

  const blipColor = conflictAlert
    ? '#ef4444'
    : selected
    ? '#fbbf24'
    : type === 'ARR'
    ? '#22d3ee'
    : '#4ade80';

  const labelOffsetX = 8;
  const labelOffsetY = -8;

  // Draw velocity vector (short line showing where aircraft is going)
  const rad = (heading * Math.PI) / 180;
  const vecLen = 15;
  const vx = Math.sin(rad) * vecLen;
  const vy = -Math.cos(rad) * vecLen;

  return (
    <g
      className="aircraft-blip cursor-pointer"
      onClick={() => onSelect(aircraft.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Trail dots */}
      {aircraft.trail.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={1}
          fill={blipColor}
          opacity={(i + 1) / aircraft.trail.length * 0.5}
        />
      ))}

      {/* Velocity vector */}
      <line
        x1={position.x}
        y1={position.y}
        x2={position.x + vx}
        y2={position.y + vy}
        stroke={blipColor}
        strokeWidth="0.8"
        opacity="0.7"
      />

      {/* Aircraft blip */}
      {selected ? (
        <rect
          x={position.x - 4}
          y={position.y - 4}
          width={8}
          height={8}
          fill={blipColor}
          transform={`rotate(45, ${position.x}, ${position.y})`}
        />
      ) : (
        <circle cx={position.x} cy={position.y} r={3} fill={blipColor} />
      )}

      {/* Conflict ring */}
      {conflictAlert && (
        <circle
          cx={position.x}
          cy={position.y}
          r={12}
          fill="none"
          stroke="#ef4444"
          strokeWidth="1"
          opacity="0.6"
          className="animate-ping"
        />
      )}

      {/* Data block */}
      <g transform={`translate(${position.x + labelOffsetX}, ${position.y + labelOffsetY})`}>
        <rect x={-2} y={-10} width={52} height={28} fill="rgba(0,0,0,0.6)" rx={1} />
        <text fill={blipColor} fontSize="7.5" fontFamily="monospace" fontWeight="bold" y={0}>
          {callsign}
        </text>
        <text fill="#94a3b8" fontSize="6.5" fontFamily="monospace" y={9}>
          {formatAltitude(altitude)}
        </text>
        <text fill="#94a3b8" fontSize="6.5" fontFamily="monospace" y={17}>
          {Math.round(speed)}KT {formatHeading(heading)}°
        </text>
      </g>
    </g>
  );
}

export default function RadarView({ state, onSelectAircraft }: RadarViewProps) {
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as SVGElement).classList.contains('radar-bg')) {
        onSelectAircraft(null);
      }
    },
    [onSelectAircraft]
  );

  const activeAircraft = state.aircraft.filter(
    (ac) => ac.phase !== 'landed' && ac.phase !== 'left_sector'
  );

  return (
    <div className="relative w-full h-full bg-[#030712] rounded-lg overflow-hidden border border-slate-800">
      {/* Radar sweep overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-2 left-3 text-xs text-slate-500 font-mono">
          STOCKHOLM TMA — ESSA
        </div>
        <div className="absolute top-2 right-3 text-xs text-slate-500 font-mono">
          {activeAircraft.length} TRACKS
        </div>
      </div>

      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full"
        onClick={handleBackgroundClick}
      >
        {/* Background */}
        <rect className="radar-bg" width="1000" height="1000" fill="#030712" />

        {/* Radar rings and grid */}
        <RadarRings />

        {/* Runways */}
        <RunwayLines />

        {/* Arlanda center marker */}
        <circle cx={ARLANDA_CENTER.x} cy={ARLANDA_CENTER.y} r={4} fill="none" stroke="#334155" strokeWidth="1" />
        <text x={ARLANDA_CENTER.x + 6} y={ARLANDA_CENTER.y + 3} fill="#334155" fontSize="8" fontFamily="monospace">
          ESSA
        </text>

        {/* Aircraft */}
        {state.aircraft.map((ac) => (
          <AircraftBlip key={ac.id} aircraft={ac} onSelect={onSelectAircraft} />
        ))}
      </svg>

      {/* Conflict alerts overlay */}
      {state.aircraft.some((ac) => ac.conflictAlert) && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500 text-red-300 text-xs font-mono px-3 py-1 rounded animate-pulse">
          ⚠ SEPARATION ALERT
        </div>
      )}
    </div>
  );
}
