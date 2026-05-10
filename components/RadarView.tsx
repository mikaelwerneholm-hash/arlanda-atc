'use client';
import React, { useCallback, useRef, useState } from 'react';
import type { Aircraft, SimulationState } from '@/lib/types';
import { RUNWAY_POSITIONS, ARLANDA_CENTER } from '@/lib/arlandaData';
import { formatAltitude, formatHeading } from '@/lib/aircraftUtils';

interface ViewBox { x: number; y: number; w: number; h: number }
const DEFAULT_VB: ViewBox = { x: 0, y: 0, w: 1000, h: 1000 };
const MIN_SIZE = 120;   // max zoom ~8x
const MAX_SIZE = 1000;  // min zoom = full view

interface RadarViewProps {
  state: SimulationState;
  onSelectAircraft: (id: string | null) => void;
}

function RunwayLines({ zoom }: { zoom: number }) {
  const sw = Math.max(1, 4 / zoom);
  return (
    <g>
      {Object.entries(RUNWAY_POSITIONS).map(([id, pos]) => (
        <line key={id} x1={pos.start.x} y1={pos.start.y} x2={pos.end.x} y2={pos.end.y}
          stroke="#334155" strokeWidth={sw} strokeLinecap="round" />
      ))}
      <text x="480" y="555" fill="#475569" fontSize={8 / zoom} textAnchor="middle">19R</text>
      <text x="480" y="428" fill="#475569" fontSize={8 / zoom} textAnchor="middle">01L</text>
      <text x="520" y="555" fill="#475569" fontSize={8 / zoom} textAnchor="middle">19L</text>
      <text x="520" y="448" fill="#475569" fontSize={8 / zoom} textAnchor="middle">01R</text>
    </g>
  );
}

function RadarRings({ zoom }: { zoom: number }) {
  const cx = ARLANDA_CENTER.x;
  const cy = ARLANDA_CENTER.y;
  const rings = [50, 100, 150, 200, 250];
  return (
    <g>
      {rings.map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={0.5 / zoom} />
      ))}
      <line x1={cx} y1={0} x2={cx} y2={1000} stroke="#1e293b" strokeWidth={0.5 / zoom} />
      <line x1={0} y1={cy} x2={1000} y2={cy} stroke="#1e293b" strokeWidth={0.5 / zoom} />
      {rings.map((r, i) => (
        <text key={r} x={cx + r + 3} y={cy - 2} fill="#334155" fontSize={7 / zoom}>
          {(i + 1) * 25}NM
        </text>
      ))}
    </g>
  );
}

function AircraftBlip({
  aircraft,
  onSelect,
  zoom,
}: {
  aircraft: Aircraft;
  onSelect: (id: string) => void;
  zoom: number;
}) {
  const { position, heading, speed, altitude, callsign, selected, conflictAlert, type, phase } = aircraft;
  if (phase === 'landed' || phase === 'left_sector') return null;

  const blipColor = conflictAlert ? '#ef4444'
    : selected ? '#fbbf24'
    : type === 'ARR' ? '#22d3ee'
    : '#4ade80';

  const s = 1 / zoom; // inverse scale so elements stay same screen size
  const rad = (heading * Math.PI) / 180;
  const vecLen = 15 * s;
  const vx = Math.sin(rad) * vecLen;
  const vy = -Math.cos(rad) * vecLen;
  const r = 3 * s;
  const lox = 8 * s;
  const loy = -8 * s;
  const fs1 = 7.5 * s;
  const fs2 = 6.5 * s;
  const lw = 54 * s;
  const lh = 28 * s;

  return (
    <g onClick={() => onSelect(aircraft.id)} style={{ cursor: 'pointer' }}>
      {/* Trail */}
      {aircraft.trail.map((pos, i) => (
        <circle key={i} cx={pos.x} cy={pos.y} r={1 * s} fill={blipColor}
          opacity={(i + 1) / aircraft.trail.length * 0.5} />
      ))}
      {/* Velocity vector */}
      <line x1={position.x} y1={position.y} x2={position.x + vx} y2={position.y + vy}
        stroke={blipColor} strokeWidth={0.8 * s} opacity="0.7" />
      {/* Blip shape */}
      {selected ? (
        <rect x={position.x - 4 * s} y={position.y - 4 * s} width={8 * s} height={8 * s}
          fill={blipColor} transform={`rotate(45, ${position.x}, ${position.y})`} />
      ) : (
        <circle cx={position.x} cy={position.y} r={r} fill={blipColor} />
      )}
      {/* Conflict ring */}
      {conflictAlert && (
        <circle cx={position.x} cy={position.y} r={12 * s}
          fill="none" stroke="#ef4444" strokeWidth={1 * s} opacity="0.7" />
      )}
      {/* Data block */}
      <g transform={`translate(${position.x + lox}, ${position.y + loy})`}>
        <rect x={-2 * s} y={-10 * s} width={lw} height={lh} fill="rgba(0,0,0,0.7)" rx={s} />
        <text fill={blipColor} fontSize={fs1} fontFamily="monospace" fontWeight="bold" y={0}>
          {callsign}
        </text>
        <text fill="#94a3b8" fontSize={fs2} fontFamily="monospace" y={9 * s}>
          {formatAltitude(altitude)}
        </text>
        <text fill="#94a3b8" fontSize={fs2} fontFamily="monospace" y={17 * s}>
          {Math.round(speed)}KT {formatHeading(heading)}°
        </text>
      </g>
    </g>
  );
}

export default function RadarView({ state, onSelectAircraft }: RadarViewProps) {
  const [vb, setVb] = useState<ViewBox>(DEFAULT_VB);
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const zoom = 1000 / vb.w; // current zoom level

  // ── Zoom with scroll wheel ───────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = e.deltaY > 0 ? 1.25 : 0.8; // scroll down = zoom out
    setVb((prev) => {
      const newW = Math.min(MAX_SIZE, Math.max(MIN_SIZE, prev.w * factor));
      const newH = Math.min(MAX_SIZE, Math.max(MIN_SIZE, prev.h * factor));
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      const newX = Math.max(-100, Math.min(900, prev.x + fx * (prev.w - newW)));
      const newY = Math.max(-100, Math.min(900, prev.y + fy * (prev.h - newH)));
      return { x: newX, y: newY, w: newW, h: newH };
    });
  }, []);

  // ── Pan with drag ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((lastMouse.current.x - e.clientX) / rect.width) * vb.w;
    const dy = ((lastMouse.current.y - e.clientY) / rect.height) * vb.h;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setVb((prev) => ({
      ...prev,
      x: Math.max(-200, Math.min(800, prev.x + dx)),
      y: Math.max(-200, Math.min(800, prev.y + dy)),
    }));
  }, [vb.w, vb.h]);

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  // Click on background deselects
  const handleSvgClick = useCallback((e: React.MouseEvent) => {
    const el = e.target as SVGElement;
    if (el.tagName === 'rect' && el.getAttribute('fill') === '#030712') {
      onSelectAircraft(null);
    }
  }, [onSelectAircraft]);

  const activeAircraft = state.aircraft.filter(
    (ac) => ac.phase !== 'landed' && ac.phase !== 'left_sector'
  );

  return (
    <div className="relative w-full h-full bg-[#030712] rounded-lg overflow-hidden border border-slate-800">

      {/* Overlay labels */}
      <div className="absolute top-2 left-3 text-xs text-slate-500 font-mono pointer-events-none z-10">
        STOCKHOLM TMA — ESSA
      </div>
      <div className="absolute top-2 right-3 text-xs text-slate-500 font-mono pointer-events-none z-10">
        {activeAircraft.length} TRACKS
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
        <button onClick={() => setVb(v => {
          const f = 0.7; const cx = v.x + v.w / 2; const cy = v.y + v.h / 2;
          const nw = Math.max(MIN_SIZE, v.w * f); const nh = Math.max(MIN_SIZE, v.h * f);
          return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
        })}
          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-base font-bold flex items-center justify-center"
          title="Zooma in">+</button>
        <button onClick={() => setVb(v => {
          const f = 1.4; const cx = v.x + v.w / 2; const cy = v.y + v.h / 2;
          const nw = Math.min(MAX_SIZE, v.w * f); const nh = Math.min(MAX_SIZE, v.h * f);
          return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
        })}
          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded text-base font-bold flex items-center justify-center"
          title="Zooma ut">−</button>
        <button onClick={() => setVb(DEFAULT_VB)}
          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 rounded text-[9px] font-mono flex items-center justify-center"
          title="Återställ vy">⊙</button>
      </div>

      {/* Zoom level badge */}
      {zoom > 1.05 && (
        <div className="absolute bottom-3 left-3 text-[9px] font-mono text-slate-500 bg-slate-900/70 px-2 py-0.5 rounded z-10 pointer-events-none">
          {zoom.toFixed(1)}×
        </div>
      )}

      {/* SVG radar */}
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full h-full"
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        <rect width="1000" height="1000" fill="#030712" />
        <RadarRings zoom={zoom} />
        <RunwayLines zoom={zoom} />
        <circle cx={ARLANDA_CENTER.x} cy={ARLANDA_CENTER.y} r={4 / zoom}
          fill="none" stroke="#334155" strokeWidth={1 / zoom} />
        <text x={ARLANDA_CENTER.x + 6 / zoom} y={ARLANDA_CENTER.y + 3 / zoom}
          fill="#334155" fontSize={8 / zoom} fontFamily="monospace">ESSA</text>
        {state.aircraft.map((ac) => (
          <AircraftBlip key={ac.id} aircraft={ac} onSelect={onSelectAircraft} zoom={zoom} />
        ))}
      </svg>

      {/* Separation alert banner */}
      {state.aircraft.some((ac) => ac.conflictAlert) && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-200 text-xs font-mono px-3 py-1 rounded animate-pulse z-10">
          ⚠ SEPARATION ALERT — se Åtgärder →
        </div>
      )}

      {/* Pan hint — shown briefly */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] text-slate-700 font-mono pointer-events-none z-10">
        Scrollhjul = zoom · Dra = panorera
      </div>
    </div>
  );
}
