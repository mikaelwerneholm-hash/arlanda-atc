import type { Aircraft, FlightPhase } from './types';

const CALLOUTS: Record<string, string[]> = {
  checkin_arr: [
    '{cs}, Stockholm Approach, identified, descend to {alt}, QNH {qnh}.',
    '{cs}, radar contact, maintain {alt}, expect ILS runway {rwy}.',
    '{cs}, Stockholm Control, you are identified, descend to {alt}.',
  ],
  checkin_dep: [
    '{cs}, Stockholm Departure, radar contact, climb to {alt}, heading {hdg}.',
    '{cs}, identified, fly heading {hdg}, climb FL{fl}.',
    '{cs}, departure, climb flight level {fl}, turn right heading {hdg}.',
  ],
  descend: [
    '{cs}, descend to {alt}.',
    '{cs}, continue descent to {alt}.',
    '{cs}, descend and maintain {alt}.',
  ],
  speed: [
    '{cs}, reduce speed to {spd} knots.',
    '{cs}, maintain {spd} knots until further advised.',
    '{cs}, speed {spd} knots.',
  ],
  heading: [
    '{cs}, fly heading {hdg}.',
    '{cs}, turn {dir} heading {hdg}.',
    '{cs}, heading {hdg}.',
  ],
  approach_clear: [
    '{cs}, cleared ILS approach runway {rwy}, contact tower 118.5.',
    '{cs}, ILS runway {rwy}, cleared approach.',
    '{cs}, you are cleared for the ILS runway {rwy}.',
  ],
  takeoff_clear: [
    '{cs}, runway {rwy}, cleared for takeoff, wind {wind}.',
    '{cs}, wind {wind}, runway {rwy}, cleared for takeoff.',
    '{cs}, cleared takeoff runway {rwy}.',
  ],
  lineup: [
    '{cs}, runway {rwy}, line up and wait.',
    '{cs}, taxi into position and hold runway {rwy}.',
  ],
  go_around: [
    '{cs}, go around, fly runway heading, climb to 3000 feet.',
    '{cs}, go around, climb straight ahead to 3000, contact approach on 119.25.',
  ],
  conflict: [
    '{cs}, traffic alert, turn right heading {hdg} immediately.',
    '{cs}, turn left heading {hdg} for traffic.',
  ],
  pilot_readback_arr: [
    'Descend to {alt}, {cs}.',
    'Maintain {alt}, {cs}.',
    '{alt} and ILS runway {rwy}, {cs}.',
  ],
  pilot_readback_dep: [
    'Climb FL{fl}, heading {hdg}, {cs}.',
    'Climbing to {alt}, {cs}.',
  ],
  pilot_checkin_arr: [
    '{cs}, passing {alt}, descending {targalt}, inbound.',
    '{cs} with you, level {alt}, with information {atis}.',
    'Good day, {cs}, {alt} descending {targalt}.',
  ],
  pilot_checkin_dep: [
    '{cs}, airborne runway {rwy}, climbing to {alt}.',
    '{cs} with you, {alt}, climbing {targalt}.',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function format(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? k);
}

function atisLetter(): string {
  return String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

export function buildAtcMessage(
  type: string,
  aircraft: Aircraft,
  extras: {
    qnh?: number;
    activeRunway?: string;
    wind?: string;
    targetHeading?: number;
    targetAlt?: number;
  } = {}
): string {
  const templates = CALLOUTS[type] ?? ['{cs}, roger.'];
  const template = pick(templates);
  const alt = extras.targetAlt ?? aircraft.targetAltitude;
  const fl = Math.round(alt / 100);
  const hdg = (extras.targetHeading ?? aircraft.targetHeading).toString().padStart(3, '0');
  const dir = aircraft.heading < (extras.targetHeading ?? aircraft.targetHeading) ? 'right' : 'left';

  return format(template, {
    cs: aircraft.callsign,
    alt: alt >= 10000 ? `FL${fl}` : `${Math.round(alt / 100) * 100} feet`,
    fl: fl.toString(),
    hdg,
    dir,
    spd: aircraft.targetSpeed.toString(),
    rwy: extras.activeRunway ?? aircraft.assignedRunway ?? '19R',
    qnh: (extras.qnh ?? 1013).toString(),
    wind: extras.wind ?? '190/12',
  });
}

export function buildPilotMessage(
  type: string,
  aircraft: Aircraft,
  extras: {
    activeRunway?: string;
    targetAlt?: number;
    targetHeading?: number;
  } = {}
): string {
  const templates = CALLOUTS[type] ?? ['{cs}, wilco.'];
  const template = pick(templates);
  const alt = extras.targetAlt ?? aircraft.targetAltitude;
  const fl = Math.round(alt / 100);
  const hdg = (extras.targetHeading ?? aircraft.targetHeading).toString().padStart(3, '0');

  return format(template, {
    cs: aircraft.callsign,
    alt: alt >= 10000 ? `FL${fl}` : `${Math.round(alt / 100) * 100} feet`,
    targalt: aircraft.targetAltitude >= 10000
      ? `FL${Math.round(aircraft.targetAltitude / 100)}`
      : `${Math.round(aircraft.targetAltitude / 100) * 100} feet`,
    fl: fl.toString(),
    hdg,
    rwy: extras.activeRunway ?? aircraft.assignedRunway ?? '19R',
    atis: atisLetter(),
  });
}

export function phaseChangeMessage(aircraft: Aircraft, newPhase: FlightPhase): string | null {
  switch (newPhase) {
    case 'final':
      return `${aircraft.callsign}, established on the localizer, runway ${aircraft.assignedRunway}.`;
    case 'landing':
      return `${aircraft.callsign}, touchdown.`;
    case 'landed':
      return `${aircraft.callsign}, runway vacated, good day.`;
    case 'takeoff':
      return `${aircraft.callsign}, rolling.`;
    case 'climbing':
      return `${aircraft.callsign}, airborne, climbing.`;
    case 'left_sector':
      return `${aircraft.callsign}, leaving sector, squawk 2000, good day.`;
    default:
      return null;
  }
}
