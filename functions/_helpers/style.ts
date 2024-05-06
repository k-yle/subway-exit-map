/** expects a 6-digit hex code (no hash symbol) */
export function getConstrastingTextColour(bg: string): string {
  const r = parseInt(bg.slice(0, 2), 16);
  const g = parseInt(bg.slice(2, 4), 16);
  const b = parseInt(bg.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000' : '#fff';
}
