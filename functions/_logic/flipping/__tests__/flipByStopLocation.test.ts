import { describe, expect, it } from 'vitest';
import { flipByStopLocation } from '../flipByStopLocation.js';
import type { Station, Stop } from '../../types.def.js';

type MockStop = [lat: number, lon: number];

const station = <Station>{ name: 'Example' };

describe('flipByStopLocation', () => {
  it.each<[stops: MockStop[], expected: boolean[] | undefined]>([
    [
      // Trivial example
      [
        [-33.8742542, 151.2068633], // TH1
        [-33.8742433, 151.2067171], // TH2
        [-33.872883, 151.2068103], // TH3
        [-33.87426, 151.2069404], // TH4
        [-33.8729019, 151.2070006], // TH5
        [-33.8728876, 151.2068542], // TH6
      ],
      [true, true, false, true, false, false],
    ],
    [
      [
        [-33.6241714, 151.1522383], // Berowa 1 (southern end)
        [-33.6236181, 151.1529577], // Berowa 2 (middle)
        [-33.6232485, 151.1534421], // Berowa 3 (northern end)
      ],
      undefined,
    ],
  ])('can divide a series of stops', (mockStops, expected) => {
    const stops = mockStops.map(([lat, lon]) => <Stop>{ lat, lon });
    expect(flipByStopLocation(stops, [], station)).toStrictEqual(expected);
  });
});
