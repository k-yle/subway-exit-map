import type { OsmNode, OsmRelation } from 'osm-api';
import { isTruthy, uniq } from '../_helpers/objects.js';
import { sortByRank } from '../_helpers/wikidata.js';
import { ICONS } from '../_helpers/override.js';
import type {
  AdjacentStop,
  Data,
  RawInput,
  Station,
  Stop,
} from './types.def.js';
import { createExitMap } from './createExitMap.js';
import { groupRoutesThatStopHere } from './groupRoutesThatStopHere.js';
import { flipFunctions } from './flipping/index.js';

/** remove platform number from stop_position nodes */
const cleanName = (name: string) => name.split(',')[0].replace(/ \d+$/, '');

export function processData(
  { osm: data, wikidata, lastUpdated }: RawInput,
  languages: string[],
  API_BASE_URL: string,
): {
  imageUrls: Record<string, string>;
  toClient: Data;
} {
  const warnings: string[] = [];
  const stations: Station[] = [];

  // find all stop_area relations first
  for (const relation of data) {
    if (
      relation.type === 'relation' &&
      relation.tags?.public_transport === 'stop_area'
    ) {
      const trainStationFeature = relation.members
        .map((member) => {
          const feature = data.find(
            (f) => f.type === member.type && f.id === member.ref,
          );
          if (feature?.tags?.public_transport === 'station') return feature;
          return undefined;
        })
        .find(Boolean);

      if (!trainStationFeature?.tags) {
        warnings.push(`No station found for ${relation.id}`);
        continue;
      }

      const gtfsId = trainStationFeature.tags.ref || `_${relation.id}`;

      let station = stations.find((s) => s.gtfsId === gtfsId);
      if (!station) {
        station = {
          relationId: relation.id,
          gtfsId,
          name: trainStationFeature.tags.name,
          fareGates:
            trainStationFeature.tags.fare_gates === 'yes'
              ? true
              : trainStationFeature.tags.fare_gates === 'no'
                ? false
                : undefined,
          networks: [],
          stops: [],
        };
        stations.push(station);
      }

      for (const member of relation.members) {
        if (member.type === 'node' && member.role.startsWith('stop')) {
          const node = data.find(
            (feature): feature is OsmNode =>
              feature.type === 'node' && feature.id === member.ref,
          );

          const hasData = Object.keys(node?.tags || {}).some((key) =>
            key.startsWith('exit:carriages'),
          );

          if (node && hasData) {
            // find a platform in the same stop_area with a matching local_ref
            const platformFeature = relation.members
              .filter((m) => m.role === 'platform')
              .map((m) => data.find((d) => d.type === m.type && d.id === m.ref))
              .find(
                (feature) =>
                  node.tags?.local_ref &&
                  node.tags?.local_ref === feature?.tags?.local_ref,
              );

            const routesThatStopHere = data.filter(
              (feature): feature is OsmRelation =>
                feature.type === 'relation' &&
                !!feature.tags?.route &&
                feature.members.some(
                  (m) =>
                    m.type === 'node' &&
                    m.role.startsWith('stop') &&
                    m.ref === node.id,
                ),
            );

            // the OSM nodeId
            const lastStops = new Set<number>();
            const nextStops = new Set<number>();

            for (const route of routesThatStopHere) {
              const network = route.tags?.['network:wikidata'];
              if (network && !station.networks.includes(network)) {
                station.networks.push(network);
              }

              const stopsOnThisRoute = route.members
                .filter((m) => m.type === 'node' && m.role.startsWith('stop'))
                .map((m) => m.ref);
              const indexOfOurStop = stopsOnThisRoute.indexOf(node.id);

              const lastStopId = stopsOnThisRoute[indexOfOurStop - 1] || -1;
              const nextStopId = stopsOnThisRoute[indexOfOurStop + 1] || -1;
              const lastStop = data.find(
                (f) => f.type === 'node' && f.id === lastStopId,
              );
              const nextStop = data.find(
                (f) => f.type === 'node' && f.id === nextStopId,
              );
              if (lastStop?.tags) {
                lastStops.add(lastStop.id);
              }
              if (nextStop?.tags) {
                nextStops.add(nextStop.id);
              }
            }

            station.stops.push({
              nodeId: node.id,
              gtfsId: node.tags?.ref || `${node.id}`,
              platform: node.tags?.local_ref,
              description:
                (node.tags?.description?.length ?? 99) < 20
                  ? node.tags!.description
                  : undefined,
              inaccessible:
                node.tags?.wheelchair === 'no' ||
                platformFeature?.tags?.wheelchair === 'no',
              lat: node.lat,
              lon: node.lon,
              ...createExitMap(node, data),
              lastUpdate: {
                date: node.timestamp,
                user: node.user,
              },
              routes: groupRoutesThatStopHere(routesThatStopHere, node),

              // typecast is a hack, we fix this later
              lastStop: <never[]>[...lastStops],
              nextStop: <never[]>[...nextStops],
            });
          } else {
            // we haven't downloaded this node
            // because no routes (from our network) stop here
          }
        }
      }

      // sort the platforms in a way that handles number, letters,
      // a mix of numbers+letters (e.g. 14A), or names (e.g. NYC).
      const getPlatform = (stop: Stop) =>
        stop.platform || stop.description || '';

      let longestPlatform = 0;
      for (const stop of station.stops) {
        longestPlatform = Math.max(longestPlatform, getPlatform(stop).length);
      }

      station.stops.sort((stopA, stopB) => {
        const a = getPlatform(stopA).padStart(longestPlatform, '0');
        const b = getPlatform(stopB).padStart(longestPlatform, '0');
        return a.localeCompare(b);
      });
    }
  }

  const stationsByStopId: Record<number, [Station, Stop]> = {};
  for (const station of stations) {
    for (const stop of station.stops) {
      stationsByStopId[stop.nodeId] = [station, stop];
    }
  }

  // convert the next/last stop from number[] to the proper type
  const nIdToObject = (stopNodeId: number): AdjacentStop | undefined => {
    const [station, stop] = stationsByStopId[stopNodeId] || [];

    if (!station || !stop) {
      // the next stop doesn't have exit:carriages data, but we
      // might be able to find it in the raw OSM data
      const maybeStop = data.find(
        (n) => n.type === 'node' && n.id === stopNodeId && n.tags?.name,
      );
      if (maybeStop) {
        return {
          gtfsId: undefined,
          platform: maybeStop.tags!.local_ref,
          stationName: cleanName(maybeStop.tags!.name),
        };
      }

      return undefined;
    }

    return {
      gtfsId: station.gtfsId,
      stationName: station.name,
      platform: stop.platform,
    };
  };
  for (const station of stations) {
    for (const stop of station.stops) {
      stop.lastStop = stop.lastStop
        .map((id) => nIdToObject(<never>id))
        .filter(isTruthy);
      stop.nextStop = stop.nextStop
        .map((id) => nIdToObject(<never>id))
        .filter(isTruthy);
    }

    const stopsArray = station.stops;
    // nothing to flip at stations with only 1 platform
    if (stopsArray.length > 1) {
      // try several different algorithms to figure out
      // which stops (if any) should be flipped
      for (const f of flipFunctions) {
        const stopsToFlip = f(stopsArray, data, station, warnings);
        if (stopsToFlip) {
          station.flipAlgorithm = f.name;
          for (const [index, stop] of stopsArray.entries()) {
            stop.flip = stopsToFlip[index];
          }
          break;
        }
      }
    }
  }

  const imageUrls: { [qId: string]: string } = {};

  const networkMetadata: Data['networks'] = stations
    .flatMap((station) => station.networks)
    .filter(uniq)
    .map((qId) => {
      if (!wikidata[qId]) {
        throw new Error(`No wikidata info for ${qId}`);
      }
      const firstSupportedLanguage =
        languages.find((lang) => wikidata[qId].labels[lang]) || 'en';

      const wikipediaPage =
        wikidata[qId].sitelinks[`${firstSupportedLanguage}wiki`]?.title;

      const bestLogo = (wikidata[qId].claims.P8972 || wikidata[qId].claims.P154)
        ?.filter((claim) => claim.mainsnak.datatype === 'commonsMedia')
        .sort(sortByRank)[0]?.mainsnak.datavalue?.value;

      const fbUsername =
        wikidata[qId].claims.P2013?.sort(sortByRank)[0]?.mainsnak.datavalue
          ?.value;

      const logoUrl = bestLogo
        ? `http://commons.wikimedia.org/wiki/Special:FilePath/${bestLogo}`
        : fbUsername
          ? `https://graph.facebook.com/${fbUsername}/picture?type=large`
          : undefined;

      if (logoUrl) imageUrls[qId] = logoUrl;

      return {
        qId,
        name: wikidata[qId].labels[firstSupportedLanguage]?.value,
        wikipedia: wikipediaPage
          ? `https://${firstSupportedLanguage}.wikipedia.org/wiki/${wikipediaPage.replaceAll(' ', '_')}`
          : undefined,
        logoUrl: logoUrl && `${API_BASE_URL}/image?qId=${qId}`,
      };
    })
    .sort((a, b) => b.name.localeCompare(a.name));

  return {
    imageUrls,
    toClient: {
      warnings,
      stations: stations.sort((a, b) => a.name.localeCompare(b.name)),
      networks: networkMetadata,
      supportedSymbols: Object.fromEntries(
        Object.keys(ICONS).map((symbol) => [
          symbol,
          `${API_BASE_URL}/image?symbol=${symbol}`,
        ]),
      ),
      lastGenerated: new Date().toISOString(),
      lastUpdated,
    },
  };
}
