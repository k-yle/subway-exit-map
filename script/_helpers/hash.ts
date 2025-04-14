import { createHash } from 'node:crypto';
import type { RouteShield } from '../_logic/types.def.js';

export function sha256(text: string) {
  return createHash('sha256').update(text).digest('base64');
}

export const getShieldKey = (shield: RouteShield) =>
  shield.shape + shield.colour.bg + shield.colour.fg + shield.ref;

export const getShieldKeyHashed = (shield: RouteShield) =>
  sha256(getShieldKey(shield)).slice(0, 8).replaceAll('/', '_');
