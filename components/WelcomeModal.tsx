'use client';
import React from 'react';

interface WelcomeModalProps {
  onStart: () => void;
}

export default function WelcomeModal({ onStart }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d1829] border border-cyan-900/60 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✈</div>
          <h1 className="text-2xl font-bold text-white font-mono tracking-wider">
            STOCKHOLM ARLANDA
          </h1>
          <p className="text-cyan-400 font-mono text-sm tracking-widest mt-1">
            APPROACH CONTROL · ESSA
          </p>
        </div>

        {/* Intro text */}
        <p className="text-slate-300 text-sm text-center mb-6 leading-relaxed">
          Du är flygledare. Ditt jobb är att guida flyg säkert in till landning och ut från Arlanda.
          Du behöver ingen utbildning — spelet lär dig allt steg för steg.
        </p>

        {/* The basics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 font-mono text-xs font-bold">BLÅ PRICK = ANKOMMANDE</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Flyg på väg in till Arlanda. Du ska leda dem ner till landning. Klicka på dem och ge dem heading, höjd och till slut ILS-clearance.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-green-400 font-mono text-xs font-bold">GRÖN PRICK = AVGÅENDE</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Flyg som väntar på att lyfta. Klicka på dem och tryck "CLEARED FOR TAKEOFF" när banan är fri.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-300 font-mono text-xs font-bold">HEADING = RIKTNING</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Grader 0–360. Norr = 360°, Öster = 090°, Söder = 180°, Väster = 270°. Du styr vart flygplanet flyger.
            </p>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-400 font-mono text-xs font-bold">⚠ SEPARATION = AVSTÅND</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Flyg måste ha minst 3 NM avstånd ELLER 1000 fot höjdskillnad. Röd varning = flyg för nära — agera direkt!
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-cyan-950/40 border border-cyan-900/50 rounded-lg p-3 mb-6">
          <p className="text-cyan-300 text-xs font-mono font-bold mb-1">💡 TIPS FÖR NYBÖRJARE</p>
          <ul className="text-slate-400 text-xs space-y-1 list-none">
            <li>→ Börja med trafiknivå <span className="text-green-400">CALM</span> — ett flyg i taget</li>
            <li>→ Klicka på ett flygplan för att se vad det behöver</li>
            <li>→ Hjälprutor dyker upp automatiskt när något nytt händer</li>
            <li>→ Du kan pausa när som helst med ⏸-knappen uppe till vänster</li>
          </ul>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold font-mono text-lg py-4 rounded-xl transition-all duration-150 shadow-lg shadow-green-900/50 tracking-wider"
        >
          ▶ STARTA SIMULERINGEN
        </button>

        <p className="text-slate-600 text-xs text-center mt-3 font-mono">
          Trafiknivå: CALM · Hjälptexter aktiverade
        </p>
      </div>
    </div>
  );
}
