import type { Aircraft, SimulationState, TrafficLevel, RadioMessage, FlightPhase, Position } from './types';
import {
  AIRLINES,
  AIRCRAFT_TYPES,
  AIRPORTS,
  ARRIVAL_FIXES,
  DEPARTURE_FIXES,
  ARLANDA_CENTER,
  RUNWAY_POSITIONS,
  DEFAULT_WEATHER,
  getActiveRunwayForWind,
  FINAL_APPROACH_DISTANCE,
  FINAL_APPROACH_ALTITUDE_START,
} from './arlandaData';
import {
  moveAircraft,
  checkSeparation,
  generateSquawk,
  generateCallsign,
  distanceBetween,
  headingBetween,
  normalizeHeading,
} from './aircraftUtils';
import { buildPilotMessage, phaseChangeMessage } from './radioMessages';

let uidCounter = 0;
function uid(): string {
  return `ac_${Date.now()}_${uidCounter++}`;
}

const SPAWN_RATES: Record<TrafficLevel, number> = {
  calm: 120,     // one aircraft per 2 minutes
  normal: 60,    // one per minute
  intense: 30,   // one per 30 seconds
  chaos: 15,     // one per 15 seconds
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createArrival(id: string, activeRunway: string): Aircraft {
  const fix = randomFrom(ARRIVAL_FIXES);
  const airline = randomFrom(AIRLINES);
  const acType = randomFrom(AIRCRAFT_TYPES);
  const callsign = generateCallsign(airline.callsignPrefix);

  const entryAlt = randomInt(8000, 18000);
  const entrySpeed = randomInt(280, 380);

  // Heading generally toward Arlanda
  const headingToCenter = headingBetween(fix, ARLANDA_CENTER);

  return {
    id,
    callsign,
    type: 'ARR',
    aircraftType: acType.type,
    airline: airline.name,
    origin: randomFrom(AIRPORTS),
    destination: 'ESSA',
    position: { x: fix.x, y: fix.y },
    heading: headingToCenter,
    speed: entrySpeed,
    altitude: entryAlt,
    targetHeading: headingToCenter,
    targetSpeed: entrySpeed,
    targetAltitude: entryAlt,
    phase: 'descending',
    assignedRunway: activeRunway,
    cleared: false,
    clearedApproach: false,
    clearedTakeoff: false,
    squawk: generateSquawk(),
    verticalRate: -800,
    selected: false,
    conflictAlert: false,
    goAround: false,
    holdingPattern: false,
    landedAt: null,
    trail: [],
  };
}

function createDeparture(id: string, activeDepRunway: string): Aircraft {
  const airline = randomFrom(AIRLINES);
  const acType = randomFrom(AIRCRAFT_TYPES);
  const callsign = generateCallsign(airline.callsignPrefix);
  const rwyPos = RUNWAY_POSITIONS[activeDepRunway];
  const startPos = rwyPos ? rwyPos.start : ARLANDA_CENTER;

  // Random initial delay before appearing on radar
  return {
    id,
    callsign,
    type: 'DEP',
    aircraftType: acType.type,
    airline: airline.name,
    origin: 'ESSA',
    destination: randomFrom(AIRPORTS),
    position: { x: startPos.x + randomInt(-5, 5), y: startPos.y + randomInt(-5, 5) },
    heading: 10,
    speed: 0,
    altitude: 0,
    targetHeading: 10,
    targetSpeed: 0,
    targetAltitude: 0,
    phase: 'holding_short',
    assignedRunway: activeDepRunway,
    cleared: false,
    clearedApproach: false,
    clearedTakeoff: false,
    squawk: generateSquawk(),
    verticalRate: 0,
    selected: false,
    conflictAlert: false,
    goAround: false,
    holdingPattern: false,
    landedAt: null,
    trail: [],
  };
}

function isOutOfBounds(pos: Position): boolean {
  return pos.x < -50 || pos.x > 1050 || pos.y < -50 || pos.y > 1050;
}

// Continuous 3° descent profile: 35 ft per radar-pixel.
// At 80px (final approach start) = 2800ft ≈ FINAL_APPROACH_ALTITUDE_START.
function idealAltAtDistance(dist: number): number {
  return Math.max(0, Math.round(dist * 35));
}

// True if aircraft heading is roughly aligned with the runway (within 40°).
function isAlignedWithRunway(aircraftHeading: number, headingToThreshold: number): boolean {
  const diff = Math.abs(normalizeHeading(aircraftHeading - headingToThreshold));
  return diff < 40 || diff > 320;
}

function updateArrivalPhase(aircraft: Aircraft, state: SimulationState): Partial<Aircraft> & { newMsg?: string } {
  const { activeRunwayArr } = state;
  const rwyPos = RUNWAY_POSITIONS[activeRunwayArr];
  if (!rwyPos) return {};

  const thresholdPos = rwyPos.start;
  const distToThreshold = distanceBetween(aircraft.position, thresholdPos);
  const headingToThreshold = headingBetween(aircraft.position, thresholdPos);
  let updates: Partial<Aircraft> & { newMsg?: string } = {};

  // ── Auto-descent: aircraft manages its own altitude all the way to landing ──
  if (aircraft.phase === 'enroute' || aircraft.phase === 'descending') {
    const ideal = idealAltAtDistance(distToThreshold);
    if (ideal < aircraft.targetAltitude) {
      updates.targetAltitude = ideal;
    }
    // Auto-reduce speed as it gets closer
    if (distToThreshold < 250 && aircraft.targetSpeed > 240) updates.targetSpeed = 220;
    if (distToThreshold < 150 && aircraft.targetSpeed > 190) updates.targetSpeed = 180;

    // ── Auto-ILS clearance ───────────────────────────────────────────────────
    // Grant approach clearance automatically when the aircraft is:
    //   - close enough (< 145px from threshold)
    //   - low enough (< 5000ft)
    //   - roughly aligned with the runway (heading within 40°)
    // This lets the aircraft complete the full descent to 0 on its own.
    if (
      !aircraft.clearedApproach &&
      distToThreshold < 145 &&
      aircraft.altitude < 5000 &&
      isAlignedWithRunway(aircraft.heading, headingToThreshold)
    ) {
      updates.clearedApproach = true;
      updates.newMsg = `${aircraft.callsign}, ILS runway ${activeRunwayArr}, cleared approach.`;
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  switch (aircraft.phase) {
    case 'enroute':
    case 'descending': {
      if (aircraft.clearedApproach && distToThreshold < FINAL_APPROACH_DISTANCE * 1.5) {
        updates.phase = 'approach';
        updates.targetHeading = headingToThreshold;
        updates.targetAltitude = Math.min(aircraft.altitude, FINAL_APPROACH_ALTITUDE_START);
        updates.targetSpeed = 160;
      } else if (!aircraft.clearedApproach && distToThreshold < 120) {
        // Not yet aligned — steer it slightly off to the side to avoid runway
        updates.targetHeading = normalizeHeading(headingToThreshold - 35);
      }
      break;
    }
    case 'approach': {
      if (distToThreshold < FINAL_APPROACH_DISTANCE) {
        updates.phase = 'final';
        updates.targetHeading = headingToThreshold;
        updates.targetAltitude = FINAL_APPROACH_ALTITUDE_START;
        updates.targetSpeed = 145;
        const msg = `${aircraft.callsign}, established on the localizer, runway ${activeRunwayArr}.`;
        updates.newMsg = msg;
      }
      break;
    }
    case 'final': {
      // Descend on glide slope
      const fraction = Math.max(0, 1 - distToThreshold / FINAL_APPROACH_DISTANCE);
      const gsAlt = FINAL_APPROACH_ALTITUDE_START * (1 - fraction);
      updates.targetAltitude = Math.max(0, gsAlt);
      updates.targetHeading = headingToThreshold;
      updates.targetSpeed = Math.max(120, 145 - fraction * 30);

      if (distToThreshold < 8) {
        updates.phase = 'landing';
        updates.targetSpeed = 0;
        updates.targetAltitude = 0;
      }
      break;
    }
    case 'landing': {
      updates.targetSpeed = 0;
      if (aircraft.speed < 10 && aircraft.altitude < 10) {
        updates.phase = 'landed';
        updates.altitude = 0;
        updates.speed = 0;
        updates.landedAt = state.simTime;
        updates.newMsg = `${aircraft.callsign}, runway vacated, good day.`;
      }
      break;
    }
  }
  return updates;
}

function updateDeparturePhase(aircraft: Aircraft, state: SimulationState): Partial<Aircraft> & { newMsg?: string } {
  let updates: Partial<Aircraft> & { newMsg?: string } = {};

  switch (aircraft.phase) {
    case 'lining_up': {
      if (aircraft.clearedTakeoff) {
        // Begin takeoff roll — high acceleration so it becomes visible fast
        updates.phase = 'takeoff';
        updates.targetSpeed = 180;
        updates.targetAltitude = 200;
        updates.newMsg = `${aircraft.callsign}, rolling runway ${aircraft.assignedRunway}.`;
      }
      break;
    }
    case 'takeoff': {
      // Skip long runway roll (not visible at radar scale) — go airborne at 30kt
      if (aircraft.speed >= 30) {
        const exitFix = randomFrom(DEPARTURE_FIXES);
        updates.phase = 'climbing';
        updates.targetAltitude = 10000;
        updates.targetSpeed = 250;
        updates.targetHeading = headingBetween(aircraft.position, exitFix);
        updates.newMsg = `${aircraft.callsign}, airborne, climbing.`;
      }
      break;
    }
    case 'climbing': {
      if (aircraft.altitude > 8000) {
        updates.phase = 'departing';
        updates.targetAltitude = 18000;
        updates.targetSpeed = 300;
      }
      break;
    }
    case 'departing': {
      if (isOutOfBounds(aircraft.position)) {
        updates.phase = 'left_sector';
        updates.newMsg = `${aircraft.callsign}, leaving sector, good day.`;
      }
      break;
    }
  }
  return updates;
}

export function tickSimulation(
  state: SimulationState,
  dt: number,
  spawnAccumulator: number
): { state: SimulationState; spawnAccumulator: number } {
  if (!state.running) return { state, spawnAccumulator };

  const newMessages: RadioMessage[] = [];
  let newScore = state.score;
  let newSepViolations = state.separationViolations;
  let newLandings = state.landingsCompleted;
  let newDepartures = state.departuresCompleted;

  const addMsg = (callsign: string, message: string, type: 'atc' | 'pilot' | 'system') => {
    newMessages.push({
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: state.simTime,
      callsign,
      message,
      type,
    });
  };

  // Update all aircraft
  let updatedAircraft = state.aircraft.map((ac) => {
    if (ac.phase === 'landed' || ac.phase === 'left_sector' || ac.phase === 'holding_short') {
      return ac;
    }

    const movement = moveAircraft(ac, dt, state.timeSpeed);
    let updated: Aircraft = { ...ac, ...movement };

    // Phase logic
    let phaseUpdates: Partial<Aircraft> & { newMsg?: string } = {};
    if (updated.type === 'ARR') {
      phaseUpdates = updateArrivalPhase(updated, state);
    } else {
      phaseUpdates = updateDeparturePhase(updated, state);
    }

    const { newMsg, ...phaseFields } = phaseUpdates;
    if (newMsg) addMsg(updated.callsign, newMsg, 'pilot');
    updated = { ...updated, ...phaseFields };

    return updated;
  });

  // Separation checks
  updatedAircraft = updatedAircraft.map((ac, i) => {
    let conflict = false;
    for (let j = 0; j < updatedAircraft.length; j++) {
      if (i === j) continue;
      const other = updatedAircraft[j];
      if (
        other.phase === 'landed' ||
        other.phase === 'left_sector' ||
        other.phase === 'holding_short'
      ) continue;
      if (checkSeparation(ac, other)) {
        conflict = true;
        break;
      }
    }
    if (conflict && !ac.conflictAlert) {
      newSepViolations++;
      newScore = Math.max(0, newScore - 50);
      addMsg('SYSTEM', `⚠️ SEPARATION ALERT: ${ac.callsign}`, 'system');
    }
    return { ...ac, conflictAlert: conflict };
  });

  // Remove finished aircraft and count
  updatedAircraft = updatedAircraft.filter((ac) => {
    if (ac.phase === 'landed') {
      const age = state.simTime - (ac.landedAt ?? 0);
      if (age > 15) {
        newLandings++;
        newScore += 100;
        return false;
      }
    }
    if (ac.phase === 'left_sector') {
      const age = state.simTime - (ac.landedAt ?? state.simTime - 5);
      if (age > 5) {
        if (ac.type === 'DEP') {
          newDepartures++;
          newScore += 80;
        }
        return false;
      }
      // Mark departure time if not set
      return true;
    }
    if (isOutOfBounds(ac.position) && ac.phase !== 'landing' && ac.phase !== 'final') {
      return false;
    }
    return true;
  });

  // Mark left_sector time
  updatedAircraft = updatedAircraft.map((ac) => {
    if (ac.phase === 'left_sector' && ac.landedAt === null) {
      return { ...ac, landedAt: state.simTime };
    }
    return ac;
  });

  // Spawn new aircraft
  const spawnInterval = SPAWN_RATES[state.trafficLevel];
  let newSpawnAcc = spawnAccumulator + dt * state.timeSpeed;
  const spawnMsgs: string[] = [];

  while (newSpawnAcc >= spawnInterval) {
    newSpawnAcc -= spawnInterval;
    const isArrival = Math.random() < 0.6;
    const newAc = isArrival
      ? createArrival(uid(), state.activeRunwayArr)
      : createDeparture(uid(), state.activeRunwayDep);

    updatedAircraft.push(newAc);
    const checkinType = isArrival ? 'pilot_checkin_arr' : 'pilot_checkin_dep';
    const msg = buildPilotMessage(checkinType, newAc, { activeRunway: newAc.assignedRunway ?? undefined });
    addMsg(newAc.callsign, msg, 'pilot');
  }

  // Weather random variation (very slow)
  let newWeather = state.weather;
  if (Math.random() < 0.001 * dt * state.timeSpeed) {
    newWeather = {
      ...state.weather,
      windDirection: normalizeHeading(state.weather.windDirection + randomInt(-5, 5)),
      windSpeed: Math.max(0, Math.min(35, state.weather.windSpeed + randomInt(-2, 2))),
      qnh: Math.max(990, Math.min(1030, state.weather.qnh + randomInt(-1, 1))),
    };
  }

  const allMessages = [...state.radioLog, ...newMessages].slice(-80);

  return {
    state: {
      ...state,
      simTime: state.simTime + dt * state.timeSpeed,
      aircraft: updatedAircraft,
      radioLog: allMessages,
      weather: newWeather,
      score: newScore,
      separationViolations: newSepViolations,
      landingsCompleted: newLandings,
      departuresCompleted: newDepartures,
    },
    spawnAccumulator: newSpawnAcc,
  };
}

export function createInitialState(): SimulationState {
  const weather = DEFAULT_WEATHER;
  const runways = getActiveRunwayForWind(weather.windDirection);

  return {
    running: false,
    timeSpeed: 1,
    trafficLevel: 'normal',
    simTime: 0,
    aircraft: [],
    selectedAircraftId: null,
    radioLog: [
      {
        id: 'init_1',
        timestamp: 0,
        callsign: 'SYSTEM',
        message: 'Stockholm Approach Control — Arlanda ATC Simulator initialized.',
        type: 'system',
      },
      {
        id: 'init_2',
        timestamp: 0,
        callsign: 'SYSTEM',
        message: `Active runways: Arrivals ${runways.arr}, Departures ${runways.dep}. Wind ${weather.windDirection.toString().padStart(3, '0')}/${weather.windSpeed}KT. QNH ${weather.qnh}.`,
        type: 'system',
      },
    ],
    weather,
    activeRunwayArr: runways.arr,
    activeRunwayDep: runways.dep,
    score: 0,
    separationViolations: 0,
    landingsCompleted: 0,
    departuresCompleted: 0,
  };
}
