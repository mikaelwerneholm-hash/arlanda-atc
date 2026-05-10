'use client';
import React, { useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import RadarView from '@/components/RadarView';
import AircraftPanel from '@/components/AircraftPanel';
import FlightList from '@/components/FlightList';
import RadioLog from '@/components/RadioLog';
import StatusBar from '@/components/StatusBar';

export default function ATCPage() {
  const sim = useSimulation();
  const [showFlightList, setShowFlightList] = useState(true);
  const [showAircraftPanel, setShowAircraftPanel] = useState(true);
  const [showRadioLog, setShowRadioLog] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-[#020817] text-slate-300 overflow-hidden">
      {/* Status bar */}
      <StatusBar
        state={sim.state}
        onToggleRunning={sim.toggleRunning}
        onSetTimeSpeed={sim.setTimeSpeed}
        onSetTrafficLevel={sim.setTrafficLevel}
      />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden gap-1 p-1">

        {/* Left panel: flight lists */}
        {showFlightList && (
          <div className="w-52 flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between px-1 py-0.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Flight Strips</span>
              <button
                onClick={() => setShowFlightList(false)}
                className="text-slate-600 hover:text-slate-400 text-xs"
              >
                ×
              </button>
            </div>
            <div className="flex-1 bg-slate-900/40 rounded-lg border border-slate-800 overflow-hidden">
              <FlightList
                aircraft={sim.state.aircraft}
                selectedId={sim.state.selectedAircraftId}
                onSelect={sim.selectAircraft}
              />
            </div>
          </div>
        )}

        {/* Center: radar */}
        <div className="flex-1 flex flex-col min-w-0 gap-1">
          {/* Collapsed panel toggle bar */}
          {(!showFlightList || !showAircraftPanel || !showRadioLog) && (
            <div className="flex gap-1 px-1">
              {!showFlightList && (
                <button
                  onClick={() => setShowFlightList(true)}
                  className="text-[9px] font-mono bg-slate-800/60 hover:bg-slate-700 text-slate-400 px-2 py-0.5 rounded border border-slate-700"
                >
                  ◁ Strips
                </button>
              )}
              {!showAircraftPanel && (
                <button
                  onClick={() => setShowAircraftPanel(true)}
                  className="text-[9px] font-mono bg-slate-800/60 hover:bg-slate-700 text-slate-400 px-2 py-0.5 rounded border border-slate-700"
                >
                  Controls ▷
                </button>
              )}
              {!showRadioLog && (
                <button
                  onClick={() => setShowRadioLog(true)}
                  className="text-[9px] font-mono bg-slate-800/60 hover:bg-slate-700 text-slate-400 px-2 py-0.5 rounded border border-slate-700"
                >
                  Radio ▷
                </button>
              )}
            </div>
          )}

          <div className="flex-1 min-h-0">
            <RadarView
              state={sim.state}
              onSelectAircraft={sim.selectAircraft}
            />
          </div>
        </div>

        {/* Right panels */}
        <div className="flex flex-col gap-1 w-64 shrink-0">
          {/* Aircraft control panel */}
          {showAircraftPanel && (
            <div className="flex flex-col h-[55%] min-h-0">
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  {sim.selectedAircraft ? sim.selectedAircraft.callsign : 'Selected A/C'}
                </span>
                <button
                  onClick={() => setShowAircraftPanel(false)}
                  className="text-slate-600 hover:text-slate-400 text-xs"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 bg-slate-900/40 rounded-lg border border-slate-800 overflow-hidden p-2 min-h-0 overflow-y-auto">
                <AircraftPanel
                  aircraft={sim.selectedAircraft}
                  onIssueHeading={sim.issueHeading}
                  onIssueAltitude={sim.issueAltitude}
                  onIssueSpeed={sim.issueSpeed}
                  onClearApproach={sim.clearApproach}
                  onClearTakeoff={sim.clearTakeoff}
                  onGoAround={sim.issueGoAround}
                />
              </div>
            </div>
          )}

          {/* Radio log */}
          {showRadioLog && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between px-1 py-0.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Comm</span>
                <button
                  onClick={() => setShowRadioLog(false)}
                  className="text-slate-600 hover:text-slate-400 text-xs"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 bg-slate-900/40 rounded-lg border border-slate-800 overflow-hidden min-h-0">
                <RadioLog messages={sim.state.radioLog} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
