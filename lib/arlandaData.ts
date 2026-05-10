import type { Runway, WeatherData } from './types';

// Arlanda radar coordinate system: 500,500 = center (ESSA)
// Scale: ~1 unit = ~0.5 NM

export const ARLANDA_CENTER: { x: number; y: number } = { x: 500, y: 500 };

export const RUNWAYS: Runway[] = [
  {
    id: '01L',
    heading: 10,
    reciprocal: '19R',
    length: 3301,
    active: true,
    activeFor: 'ARR',
  },
  {
    id: '19R',
    heading: 190,
    reciprocal: '01L',
    length: 3301,
    active: true,
    activeFor: 'DEP',
  },
  {
    id: '01R',
    heading: 10,
    reciprocal: '19L',
    length: 2500,
    active: true,
    activeFor: 'BOTH',
  },
  {
    id: '19L',
    heading: 190,
    reciprocal: '01R',
    length: 2500,
    active: false,
    activeFor: 'NONE',
  },
  {
    id: '08',
    heading: 80,
    reciprocal: '26',
    length: 2500,
    active: false,
    activeFor: 'NONE',
  },
  {
    id: '26',
    heading: 260,
    reciprocal: '08',
    length: 2500,
    active: false,
    activeFor: 'NONE',
  },
];

// Runway threshold positions on radar (simplified)
export const RUNWAY_POSITIONS: Record<string, { start: { x: number; y: number }; end: { x: number; y: number } }> = {
  '01L': { start: { x: 488, y: 540 }, end: { x: 488, y: 440 } },
  '19R': { start: { x: 488, y: 440 }, end: { x: 488, y: 540 } },
  '01R': { start: { x: 512, y: 540 }, end: { x: 512, y: 460 } },
  '19L': { start: { x: 512, y: 460 }, end: { x: 512, y: 540 } },
  '08':  { start: { x: 460, y: 498 }, end: { x: 560, y: 498 } },
  '26':  { start: { x: 560, y: 498 }, end: { x: 460, y: 498 } },
};

// Entry points for arrivals (edge of radar sector)
export const ARRIVAL_FIXES = [
  { name: 'DOSRU', x: 500, y: 50, heading: 180 },   // North
  { name: 'LIDEN', x: 820, y: 200, heading: 225 },  // Northeast
  { name: 'KOGAX', x: 850, y: 500, heading: 270 },  // East
  { name: 'ABSIT', x: 700, y: 820, heading: 315 },  // Southeast
  { name: 'ELTOK', x: 150, y: 750, heading: 350 },  // Southwest
  { name: 'EMBUT', x: 100, y: 400, heading: 90 },   // West
  { name: 'VARAS', x: 200, y: 150, heading: 135 },  // Northwest
];

// Departure exit points
export const DEPARTURE_FIXES = [
  { name: 'DOSRU', x: 500, y: 50 },
  { name: 'LIDEN', x: 820, y: 200 },
  { name: 'KOGAX', x: 850, y: 500 },
  { name: 'ABSIT', x: 700, y: 820 },
  { name: 'ELTOK', x: 150, y: 750 },
  { name: 'EMBUT', x: 100, y: 400 },
  { name: 'VARAS', x: 200, y: 150 },
];

export const AIRLINES = [
  { callsignPrefix: 'SAS', name: 'Scandinavian Airlines', codes: ['SK'] },
  { callsignPrefix: 'NOZ', name: 'Norwegian', codes: ['DY'] },
  { callsignPrefix: 'FIN', name: 'Finnair', codes: ['AY'] },
  { callsignPrefix: 'DLH', name: 'Lufthansa', codes: ['LH'] },
  { callsignPrefix: 'KLM', name: 'KLM Royal Dutch Airlines', codes: ['KL'] },
  { callsignPrefix: 'RYR', name: 'Ryanair', codes: ['FR'] },
  { callsignPrefix: 'BRA', name: 'BRA', codes: ['TF'] },
  { callsignPrefix: 'DAL', name: 'DHL Express', codes: ['DH'] },
  { callsignPrefix: 'BEL', name: 'Brussels Airlines', codes: ['SN'] },
  { callsignPrefix: 'IBE', name: 'Iberia', codes: ['IB'] },
  { callsignPrefix: 'EZY', name: 'EasyJet', codes: ['U2'] },
  { callsignPrefix: 'WZZ', name: 'Wizz Air', codes: ['W6'] },
  { callsignPrefix: 'BAW', name: 'British Airways', codes: ['BA'] },
  { callsignPrefix: 'AFL', name: 'Aeroflot', codes: ['SU'] },
];

export const AIRCRAFT_TYPES = [
  { type: 'A320', category: 'medium', cruiseAlt: 37000, approachSpeed: 140, climbRate: 2000 },
  { type: 'A321', category: 'medium', cruiseAlt: 37000, approachSpeed: 145, climbRate: 1800 },
  { type: 'B737', category: 'medium', cruiseAlt: 35000, approachSpeed: 138, climbRate: 2000 },
  { type: 'B738', category: 'medium', cruiseAlt: 35000, approachSpeed: 140, climbRate: 2000 },
  { type: 'E190', category: 'light', cruiseAlt: 35000, approachSpeed: 130, climbRate: 1800 },
  { type: 'ATR72', category: 'light', cruiseAlt: 25000, approachSpeed: 115, climbRate: 1200 },
  { type: 'A330', category: 'heavy', cruiseAlt: 39000, approachSpeed: 155, climbRate: 1500 },
  { type: 'B777', category: 'heavy', cruiseAlt: 41000, approachSpeed: 158, climbRate: 1400 },
  { type: 'B788', category: 'heavy', cruiseAlt: 40000, approachSpeed: 150, climbRate: 1600 },
  { type: 'C56X', category: 'light', cruiseAlt: 45000, approachSpeed: 120, climbRate: 3000 },
];

export const AIRPORTS = [
  'EGLL', 'EHAM', 'EDDM', 'EDDF', 'LFPG', 'LEMD', 'LIRF', 'EPWA',
  'EFHK', 'EKCH', 'ENGM', 'EGCC', 'LEBL', 'LTFM', 'UUEE', 'OMDB',
  'KJFK', 'KATL', 'KSEA', 'ZBAA', 'VHHH',
];

export const DEFAULT_WEATHER: WeatherData = {
  windDirection: 190,
  windSpeed: 12,
  windGusts: 0,
  visibility: 9999,
  cloudBase: 4000,
  condition: 'FEW',
  qnh: 1013,
};

// Separation minimums in radar units
export const HORIZONTAL_SEP_MIN = 30; // ~3 NM in our coordinate system
export const VERTICAL_SEP_MIN = 1000; // feet

// Final approach path start (roughly 8NM from threshold)
export const FINAL_APPROACH_DISTANCE = 80;

// Glide slope: aircraft descends from ~3000ft at final start to ~0ft at threshold
export const FINAL_APPROACH_ALTITUDE_START = 3000;

export function getActiveRunwayForWind(windDir: number): { arr: string; dep: string } {
  // Arlanda primarily uses north/south runways
  // Wind from south (135-315) → land/depart north (01L/01R)
  // Wind from north → land/depart south (19R/19L)
  const useNorth = windDir >= 135 && windDir <= 315;
  if (useNorth) {
    return { arr: '01L', dep: '01R' };
  } else {
    return { arr: '19R', dep: '19L' };
  }
}
