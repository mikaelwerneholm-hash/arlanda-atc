export type FlightPhase =
  | 'enroute'
  | 'descending'
  | 'approach'
  | 'final'
  | 'landing'
  | 'landed'
  | 'taxiing'
  | 'holding_short'
  | 'lining_up'
  | 'takeoff'
  | 'climbing'
  | 'departing'
  | 'left_sector';

export type AircraftType = 'ARR' | 'DEP';

export type WeatherCondition = 'CAVOK' | 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'TS';

export interface Position {
  x: number; // radar x coordinate (0-1000)
  y: number; // radar y coordinate (0-1000)
}

export interface Aircraft {
  id: string;
  callsign: string;
  type: AircraftType;
  aircraftType: string;
  airline: string;
  origin: string;
  destination: string;
  position: Position;
  heading: number;       // degrees 0-359
  speed: number;         // knots
  altitude: number;      // feet
  targetHeading: number;
  targetSpeed: number;
  targetAltitude: number;
  phase: FlightPhase;
  assignedRunway: string | null;
  cleared: boolean;
  clearedApproach: boolean;
  clearedTakeoff: boolean;
  squawk: string;
  verticalRate: number;  // fpm
  selected: boolean;
  conflictAlert: boolean;
  goAround: boolean;
  holdingPattern: boolean;
  landedAt: number | null; // timestamp
  trail: Position[];
}

export type TrafficLevel = 'calm' | 'normal' | 'intense' | 'chaos';
export type TimeSpeed = 1 | 2 | 5;

export interface Runway {
  id: string;
  heading: number;
  reciprocal: string;
  length: number;
  active: boolean;
  activeFor: 'ARR' | 'DEP' | 'BOTH' | 'NONE';
}

export interface RadioMessage {
  id: string;
  timestamp: number;
  callsign: string;
  message: string;
  type: 'atc' | 'pilot' | 'system';
}

export interface WeatherData {
  windDirection: number;
  windSpeed: number;
  windGusts: number;
  visibility: number;
  cloudBase: number;
  condition: WeatherCondition;
  qnh: number;
}

export interface SimulationState {
  running: boolean;
  timeSpeed: TimeSpeed;
  trafficLevel: TrafficLevel;
  simTime: number;
  aircraft: Aircraft[];
  selectedAircraftId: string | null;
  radioLog: RadioMessage[];
  weather: WeatherData;
  activeRunwayArr: string;
  activeRunwayDep: string;
  score: number;
  separationViolations: number;
  landingsCompleted: number;
  departuresCompleted: number;
}
