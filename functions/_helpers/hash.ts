import type { RouteShield } from '../_logic/types.def.js';

export async function sha256(text: string) {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const getShieldKey = (shield: RouteShield) =>
  shield.shape + shield.colour.bg + shield.colour.fg + shield.ref;

export const getShieldKeyHashed = (shield: RouteShield) =>
  sha256(getShieldKey(shield)).then((hash) => hash.slice(0, 8));
