'use client';
import { useState, useEffect, useRef } from 'react';
import type { SimulationState } from '@/lib/types';
import type { HelpTip } from '@/components/HelpToast';

const TIPS: Record<string, HelpTip> = {
  first_aircraft: {
    id: 'first_aircraft',
    icon: '✈',
    color: 'cyan',
    title: 'Flyg på radarn!',
    body: 'Klicka på en av prickarna på radarn för att markera ett flygplan. Blå prickar är ankommande (ska landa), gröna är avgående (ska lyfta). När du klickar på ett flyg öppnas kontrollpanelen till höger.',
  },
  first_arrival: {
    id: 'first_arrival',
    icon: '🔵',
    color: 'cyan',
    title: 'Ankommande flyg (ARRIVAL)',
    body: 'Det här flygplanet är på väg till Arlanda. Din uppgift: guida det ner i höjd, rätt riktning mot banan, och till slut ge det "ILS CLEARANCE" (tillstånd att landa). Klicka på det och börja med att sänka höjden till 8000 fot.',
  },
  first_departure: {
    id: 'first_departure',
    icon: '🟢',
    color: 'green',
    title: 'Avgående flyg (DEPARTURE)',
    body: 'Det här flygplanet väntar vid banan och vill lyfta. Klicka på det i listan eller på radarn. När banan är fri trycker du på den gula knappen "CLEARED FOR TAKEOFF". Kolla att ingen annan landar på samma bana först!',
  },
  first_approach: {
    id: 'first_approach',
    icon: '🛬',
    color: 'cyan',
    title: 'Dags att landa!',
    body: 'Ett flyg är nu tillräckligt lågt och nära banan. Klicka på det och tryck på den gröna knappen "CLEAR ILS APPROACH". Det ger flygplanet tillstånd att följa landningssystemet (ILS) ner till landning automatiskt.',
  },
  first_holding_short: {
    id: 'first_holding_short',
    icon: '🛫',
    color: 'green',
    title: 'Flyg väntar på start!',
    body: 'Det här flygplanet står redo vid banan och väntar på din startklarering. Klicka på det — du ser den gula knappen "CLEARED FOR TAKEOFF". Ge klareringen när inga andra flyg är på väg att landa på samma bana.',
  },
  first_conflict: {
    id: 'first_conflict',
    icon: '⚠️',
    color: 'red',
    title: 'SEPARATION-VARNING!',
    body: 'Två flyg är för nära varandra! Det är din viktigaste uppgift att förhindra detta. Klicka på ett av de röda flygplanen och ge det ett nytt HEADING (riktning) eller ny ALTITUDE (höjd) så de skiljs åt. Flyg måste ha minst 3 NM avstånd ELLER 1000 fot höjdskillnad.',
  },
  first_landing: {
    id: 'first_landing',
    icon: '✅',
    color: 'green',
    title: 'Flygplanet har landat!',
    body: 'Utmärkt! Du har guidat ett flygplan till säker landning. Det försvinner från radarn när det har lämnat banan. +100 poäng!',
    autoClose: 5000,
  },
  first_go_around: {
    id: 'first_go_around',
    icon: '↺',
    color: 'amber',
    title: 'Go Around — Avbruten landning',
    body: '"Go Around" betyder att landningen avbryts och flygplanet klättrar upp igen. Det kan hända om banan är blockerad, eller om du beordrar det. Flygplanet klättrar till 3000 fot och du måste ge det nya instruktioner för en ny landningsrunda.',
  },
  first_departure_complete: {
    id: 'first_departure_complete',
    icon: '✈',
    color: 'green',
    title: 'Avgående flyg har lämnat!',
    body: 'Flygplanet har lämnat din kontrollsektor. Bra jobbat! Det försvinner från radarn automatiskt. +80 poäng!',
    autoClose: 5000,
  },
};

export function useHelpSystem(state: SimulationState) {
  const [currentTip, setCurrentTip] = useState<HelpTip | null>(null);
  const shownTips = useRef<Set<string>>(new Set());
  const tipQueue = useRef<HelpTip[]>([]);
  const prevLandings = useRef(state.landingsCompleted);
  const prevDepartures = useRef(state.departuresCompleted);

  const enqueueTip = (tipId: string) => {
    if (shownTips.current.has(tipId)) return;
    const tip = TIPS[tipId];
    if (!tip) return;
    shownTips.current.add(tipId);
    tipQueue.current = [...tipQueue.current, tip];
  };

  const dismissTip = () => {
    tipQueue.current = tipQueue.current.slice(1);
    setCurrentTip(tipQueue.current[0] ?? null);
  };

  // Watch simulation state for trigger conditions
  useEffect(() => {
    if (!state.running) return;

    const aircraft = state.aircraft;

    // First time any aircraft appears
    if (aircraft.length > 0 && !shownTips.current.has('first_aircraft')) {
      enqueueTip('first_aircraft');
    }

    // First arrival
    const hasArrival = aircraft.some((a) => a.type === 'ARR');
    if (hasArrival) enqueueTip('first_arrival');

    // First departure
    const hasDep = aircraft.some((a) => a.type === 'DEP');
    if (hasDep) enqueueTip('first_departure');

    // First aircraft in approach/descending close to airport
    const approachReady = aircraft.find(
      (a) => a.type === 'ARR' && (a.phase === 'approach' || a.phase === 'descending') && a.altitude < 6000
    );
    if (approachReady) enqueueTip('first_approach');

    // First departure holding short
    const holdingShort = aircraft.find((a) => a.type === 'DEP' && a.phase === 'holding_short');
    if (holdingShort) enqueueTip('first_holding_short');

    // First conflict
    const hasConflict = aircraft.some((a) => a.conflictAlert);
    if (hasConflict) enqueueTip('first_conflict');

    // First landing completed
    if (state.landingsCompleted > prevLandings.current) {
      prevLandings.current = state.landingsCompleted;
      enqueueTip('first_landing');
    }

    // First departure completed
    if (state.departuresCompleted > prevDepartures.current) {
      prevDepartures.current = state.departuresCompleted;
      enqueueTip('first_departure_complete');
    }

    // Show next tip from queue if no current tip
    if (tipQueue.current.length > 0 && !currentTip) {
      setCurrentTip(tipQueue.current[0]);
    }
  }, [state, currentTip]);

  return { currentTip, dismissTip };
}
