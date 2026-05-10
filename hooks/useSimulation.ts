'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimulationState, TrafficLevel, TimeSpeed, Aircraft } from '@/lib/types';
import { createInitialState, tickSimulation } from '@/lib/simulationEngine';
import { buildAtcMessage } from '@/lib/radioMessages';
import { normalizeHeading } from '@/lib/aircraftUtils';

const TICK_MS = 100; // 10 ticks per second

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(createInitialState);
  const spawnAccRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Main game loop
  useEffect(() => {
    let animFrame: number;

    const tick = (timestamp: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
        animFrame = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((timestamp - lastTickRef.current) / 1000, 0.5); // max 0.5s step
      lastTickRef.current = timestamp;

      if (stateRef.current.running) {
        const { state: newState, spawnAccumulator } = tickSimulation(
          stateRef.current,
          dt,
          spawnAccRef.current
        );
        spawnAccRef.current = spawnAccumulator;
        setState(newState);
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const toggleRunning = useCallback(() => {
    setState((s) => ({ ...s, running: !s.running }));
  }, []);

  const setTimeSpeed = useCallback((speed: TimeSpeed) => {
    setState((s) => ({ ...s, timeSpeed: speed }));
  }, []);

  const setTrafficLevel = useCallback((level: TrafficLevel) => {
    setState((s) => ({ ...s, trafficLevel: level }));
  }, []);

  const selectAircraft = useCallback((id: string | null) => {
    setState((s) => ({
      ...s,
      selectedAircraftId: id,
      aircraft: s.aircraft.map((ac) => ({ ...ac, selected: ac.id === id })),
    }));
  }, []);

  const addRadioMessage = useCallback((callsign: string, message: string, type: 'atc' | 'pilot' | 'system') => {
    setState((s) => ({
      ...s,
      radioLog: [
        ...s.radioLog,
        { id: `msg_${Date.now()}`, timestamp: s.simTime, callsign, message, type },
      ].slice(-80),
    }));
  }, []);

  // ATC instructions
  const issueHeading = useCallback((aircraftId: string, heading: number) => {
    setState((s) => {
      const ac = s.aircraft.find((a) => a.id === aircraftId);
      if (!ac) return s;
      const h = normalizeHeading(heading);
      const msg = buildAtcMessage('heading', ac, { targetHeading: h });
      return {
        ...s,
        aircraft: s.aircraft.map((a) =>
          a.id === aircraftId ? { ...a, targetHeading: h } : a
        ),
        radioLog: [...s.radioLog, {
          id: `msg_${Date.now()}`,
          timestamp: s.simTime,
          callsign: ac.callsign,
          message: msg,
          type: 'atc',
        }].slice(-80),
      };
    });
  }, []);

  const issueAltitude = useCallback((aircraftId: string, altitude: number) => {
    setState((s) => {
      const ac = s.aircraft.find((a) => a.id === aircraftId);
      if (!ac) return s;
      const msg = buildAtcMessage('descend', ac, { targetAlt: altitude });
      return {
        ...s,
        aircraft: s.aircraft.map((a) =>
          a.id === aircraftId ? { ...a, targetAltitude: altitude } : a
        ),
        radioLog: [...s.radioLog, {
          id: `msg_${Date.now()}`,
          timestamp: s.simTime,
          callsign: ac.callsign,
          message: msg,
          type: 'atc',
        }].slice(-80),
      };
    });
  }, []);

  const issueSpeed = useCallback((aircraftId: string, speed: number) => {
    setState((s) => {
      const ac = s.aircraft.find((a) => a.id === aircraftId);
      if (!ac) return s;
      const msg = buildAtcMessage('speed', ac);
      return {
        ...s,
        aircraft: s.aircraft.map((a) =>
          a.id === aircraftId ? { ...a, targetSpeed: speed } : a
        ),
        radioLog: [...s.radioLog, {
          id: `msg_${Date.now()}`,
          timestamp: s.simTime,
          callsign: ac.callsign,
          message: msg,
          type: 'atc',
        }].slice(-80),
      };
    });
  }, []);

  const clearApproach = useCallback((aircraftId: string) => {
    setState((s) => {
      const ac = s.aircraft.find((a) => a.id === aircraftId);
      if (!ac) return s;
      const msg = buildAtcMessage('approach_clear', ac, { activeRunway: s.activeRunwayArr });
      return {
        ...s,
        aircraft: s.aircraft.map((a) =>
          a.id === aircraftId ? { ...a, clearedApproach: true, assignedRunway: s.activeRunwayArr } : a
        ),
        radioLog: [...s.radioLog, {
          id: `msg_${Date.now()}`,
          timestamp: s.simTime,
          callsign: ac.callsign,
          message: msg,
          type: 'atc',
        }].slice(-80),
      };
    });
  }, []);

  const clearTakeoff = useCallback((aircraftId: string) => {
    setState((s) => {
      const ac = s.aircraft.find((a) => a.id === aircraftId);
      if (!ac || ac.phase !== 'holding_short') return s;
      const windStr = `${s.weather.windDirection.toString().padStart(3, '0')}/${s.weather.windSpeed}KT`;
      const msg = buildAtcMessage('takeoff_clear', ac, {
        activeRunway: s.activeRunwayDep,
        wind: windStr,
      });
      return {
        ...s,
        aircraft: s.aircraft.map((a) =>
          a.id === aircraftId ? { ...a, clearedTakeoff: true, phase: 'lining_up' } : a
        ),
        radioLog: [...s.radioLog, {
          id: `msg_${Date.now()}`,
          timestamp: s.simTime,
          callsign: ac.callsign,
          message: msg,
          type: 'atc',
        }].slice(-80),
      };
    });
  }, []);

  const issueGoAround = useCallback((aircraftId: string) => {
    setState((s) => {
      const ac = s.aircraft.find((a) => a.id === aircraftId);
      if (!ac) return s;
      const msg = buildAtcMessage('go_around', ac);
      return {
        ...s,
        aircraft: s.aircraft.map((a) =>
          a.id === aircraftId
            ? {
                ...a,
                phase: 'climbing',
                goAround: true,
                clearedApproach: false,
                clearedTakeoff: false,
                targetAltitude: 3000,
                targetSpeed: 200,
                targetHeading: a.heading,
              }
            : a
        ),
        radioLog: [...s.radioLog, {
          id: `msg_${Date.now()}`,
          timestamp: s.simTime,
          callsign: ac.callsign,
          message: msg,
          type: 'atc',
        }].slice(-80),
      };
    });
  }, []);

  const setActiveRunway = useCallback((arr: string, dep: string) => {
    setState((s) => ({
      ...s,
      activeRunwayArr: arr,
      activeRunwayDep: dep,
    }));
  }, []);

  const selectedAircraft = state.aircraft.find((a) => a.id === state.selectedAircraftId) ?? null;

  return {
    state,
    selectedAircraft,
    toggleRunning,
    setTimeSpeed,
    setTrafficLevel,
    selectAircraft,
    issueHeading,
    issueAltitude,
    issueSpeed,
    clearApproach,
    clearTakeoff,
    issueGoAround,
    setActiveRunway,
    addRadioMessage,
  };
}
