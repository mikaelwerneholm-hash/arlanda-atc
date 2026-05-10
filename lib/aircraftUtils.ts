import type { Aircraft, Position } from './types';
import { HORIZONTAL_SEP_MIN, VERTICAL_SEP_MIN } from './arlandaData';

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function headingToVector(heading: number): { dx: number; dy: number } {
  const rad = degreesToRadians(heading);
  // In radar coords: 0° = up (negative y), 90° = right (positive x)
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
}

export function distanceBetween(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function headingBetween(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = -(to.y - from.y); // invert y for north-up
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  if (angle < 0) angle += 360;
  return angle;
}

export function normalizeHeading(h: number): number {
  h = h % 360;
  if (h < 0) h += 360;
  return h;
}

export function turnToward(current: number, target: number, maxTurn: number): number {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  if (Math.abs(diff) <= maxTurn) return target;
  return normalizeHeading(current + (diff > 0 ? maxTurn : -maxTurn));
}

export function approachValue(current: number, target: number, rate: number): number {
  if (Math.abs(target - current) <= rate) return target;
  return current + (target > current ? rate : -rate);
}

export function checkSeparation(a: Aircraft, b: Aircraft): boolean {
  const horizDist = distanceBetween(a.position, b.position);
  const vertDist = Math.abs(a.altitude - b.altitude);
  return horizDist < HORIZONTAL_SEP_MIN && vertDist < VERTICAL_SEP_MIN;
}

export function generateSquawk(): string {
  const codes = ['2345', '2346', '2356', '3456', '4567', '5678', '1234', '6543'];
  return codes[Math.floor(Math.random() * codes.length)];
}

export function formatAltitude(alt: number): string {
  if (alt >= 18000) {
    return `FL${Math.round(alt / 100).toString().padStart(3, '0')}`;
  }
  return `${Math.round(alt / 100) * 100}ft`;
}

export function formatHeading(h: number): string {
  return Math.round(h).toString().padStart(3, '0');
}

export function generateCallsign(prefix: string): string {
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${prefix}${num}`;
}

// Scale: 1 px ≈ 0.025 NM for gameplay feel. At 250kt: ~2.8 px/s → visible movement.
// Arrivals cross ~400px in ~2.5 min at 1x. At 5x: ~30 seconds. Feels right.
export const KNOTS_TO_PX_PER_SEC = 40 / 3600; // ~20x real scale for playability

export function moveAircraft(aircraft: Aircraft, dt: number, timeSpeed: number): Partial<Aircraft> {
  const effectiveDt = dt * timeSpeed;

  // Heading turns: 3°/s
  const newHeading = turnToward(aircraft.heading, aircraft.targetHeading, 3 * effectiveDt);

  // Speed change — faster during takeoff/climb so departure roll is visible
  const speedRate =
    aircraft.phase === 'takeoff' || aircraft.phase === 'lining_up' ? 40 :
    aircraft.phase === 'climbing' ? 15 :
    8; // kt/s
  const newSpeed = approachValue(aircraft.speed, aircraft.targetSpeed, speedRate * effectiveDt);

  // Gradual altitude change based on phase
  let climbRate = 2000; // fpm
  if (aircraft.phase === 'approach' || aircraft.phase === 'final') climbRate = 800;
  if (aircraft.phase === 'landing') climbRate = 500;
  // Convert fpm to feet per second
  const altChangePerSec = (climbRate / 60) * effectiveDt;
  const newAlt = approachValue(aircraft.altitude, aircraft.targetAltitude, altChangePerSec);

  // Move position
  const vec = headingToVector(newHeading);
  const pxPerSec = newSpeed * KNOTS_TO_PX_PER_SEC * effectiveDt;
  const newPos: Position = {
    x: aircraft.position.x + vec.dx * pxPerSec,
    y: aircraft.position.y + vec.dy * pxPerSec,
  };

  // Update trail (keep last 8 points)
  const newTrail = [...aircraft.trail, { ...aircraft.position }].slice(-8);

  return {
    heading: newHeading,
    speed: newSpeed,
    altitude: newAlt,
    position: newPos,
    trail: newTrail,
    verticalRate: (newAlt - aircraft.altitude) / (effectiveDt / 60), // fpm
  };
}
